const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const logger = require('../../shared/utils/logger');
const jobDataAccess = require('./data/jobDataAccess');
const config = require('../../shared/utils/config');
const SceneProcessor = require('./processors/scene-processor');
const MusicProcessor = require('./processors/music-processor');
const MetadataManager = require('./utils/metadata-manager');
const progressTracker = require('./utils/progress-tracker');

// Import new utility classes
const serviceConfigManager = require('./utils/service-config-manager');
const jobResultManager = require('./utils/job-result-manager');
const outputManager = require('./utils/output-manager');

class JobPipelineService {
  constructor(services) {
    this.services = services;
    this.jobDataAccess = jobDataAccess;
    this.sceneProcessor = new SceneProcessor(services, jobDataAccess);
    this.musicProcessor = new MusicProcessor(services.music, jobDataAccess);
    this.integrationOutputPath = path.join(config.output.integrationDirectory);
    logger.info('JobPipelineService initialized with JobDataAccess');
  }

  getJobOutputPath(jobId, date = new Date()) {
    const dateString = date.toISOString().split('T')[0];
    return path.join(this.integrationOutputPath, dateString, jobId);
  }

  async processScenes(llmResult, jobId, jobOutputDir, serviceConfig, parameters, visualizationType) {
    // Process all scenes in parallel
    const scenePromises = llmResult.content.scenes.map((scene, i) => {
      const sceneId = i + 1;
      const sceneDir = this.getSceneOutputPath(jobOutputDir, sceneId);
      
      return this.sceneProcessor.processScene(
        scene, sceneId, jobId, sceneDir, serviceConfig, parameters, visualizationType
      ).catch(error => {
        logger.error(`Error processing scene ${sceneId}:`, error);
        return { status: 'failed', error: error.message };
      });
    });

    try {
      const results = await Promise.all(scenePromises);
      
      // Log each scene result to verify data integrity
      results.forEach(scene => {
        /*logger.info(`Scene result in processScenes for scene ${scene.sceneId}:`, {
          status: scene.status,
          hasImage: !!scene.image,
          hasVoice: !!scene.voice,
          imageStatus: scene.image?.status,
          imageHasFilePath: !!scene.image?.filePath,
          imageHasPublicUrl: !!scene.image?.publicUrl
        });*/
      });
      
      // Try to recover missing image data if needed
      if (!serviceConfig.skipImage) {
        const recoveredResults = await Promise.all(results.map(async (scene) => {
          if (scene.status !== 'failed' && scene.status !== 'skipped' && !scene.image) {
            logger.warn(`Image result missing in scene ${scene.sceneId} when not skipped, attempting to recover from job progress data`);
            
            try {
              // Get the job data to see if we can recover the image information
              const job = await this.jobDataAccess.getJob(jobId);
              if (job && job.progress && job.progress.image) {
                const sceneProgressData = job.progress.image;
                
                logger.info(`Found job progress data for image in scene ${scene.sceneId}:`, { progress: sceneProgressData });
                
                // Create a new scene object with the recovered image data
                return {
                  ...scene,
                  image: {
                    filePath: sceneProgressData.filePath,
                    fileName: sceneProgressData.filePath ? path.basename(sceneProgressData.filePath) : null,
                    storageKey: sceneProgressData.storageKey,
                    publicUrl: sceneProgressData.publicUrl,
                    status: 'completed'
                  }
                };
              }
            } catch (error) {
              logger.error(`Error recovering image data for scene ${scene.sceneId}:`, error);
            }
          }
          return scene;
        }));
        
        // Use recovered results if available
        return {
          sceneResults: recoveredResults,
          hasFailedServices: recoveredResults.some(r => r.status === 'failed')
        };
      }
      
      return {
        sceneResults: results,
        hasFailedServices: results.some(r => r.status === 'failed')
      };
    } catch (error) {
      logger.error(`Error processing scenes in parallel: ${error.message}`);
      return {
        sceneResults: [],
        hasFailedServices: true
      };
    }
  }

  async generateContent(prompt, parameters = {}, visualizationType = 'animation', userId = null, jobId) {
    // Require jobId parameter - it should no longer be optional
    if (!jobId) {
      throw new Error('Job ID is required for content generation');
    }
    
    // Use the getJobOutputPath method from the outputManager instance
    const jobOutputDir = outputManager.getJobOutputPath(jobId);
    
    try {
      logger.info(`Starting content generation job ${jobId} for prompt: ${prompt}`, { userId });
      
      // Process service configuration
      const { serviceConfig, visualizationType: outputType } = 
        serviceConfigManager.processServiceConfig(parameters, visualizationType, jobId);

      // Note: The job record is now created before this method is called via createInitialJob()

      // Step 1: Generate LLM content (blocking)
      logger.info('Starting LLM content generation...');
      const llmResult = await this.services.llm.process(
        parameters.llmGenParams,
        prompt,
        false,
        jobId
      );

      if (!llmResult?.content?.scenes?.length) {
        throw new Error('LLM service did not generate any scenes');
      }

      // Create output directories using the method from outputManager instance
      await outputManager.createOutputDirectories(jobId, llmResult.content.scenes.length);
      
      // Check if we're doing LLM-only processing (all other services skipped)
      const isLlmOnlyJob = serviceConfig.skipVoice && 
                          serviceConfig.skipImage && 
                          serviceConfig.skipMusic && 
                          serviceConfig.skipVisualization;
      
      if (isLlmOnlyJob) {
        logger.info(`Job ${jobId} is LLM-only (all other services skipped)`, { userId });
        
        // Create empty results for other services
        const emptySceneResults = {
          sceneResults: llmResult.content.scenes.map((_, i) => ({
            sceneId: i + 1,
            status: 'skipped'
          })),
          hasFailedServices: false
        };
        
        const emptyMusicResult = { status: 'skipped' };
        
        // Finalize the job as completed
        await this.finalizeJob(
          jobId, jobOutputDir, llmResult, emptySceneResults, emptyMusicResult, parameters
        );
        
        // Custom status info for LLM-only jobs
        const statusInfo = {
          status: 'completed',
          errorMessage: null,
          failedComponents: [],
          isLlmOnly: true
        };
        
        // Return the response immediately
        return this.prepareResponse(jobId, jobOutputDir, llmResult, emptySceneResults, emptyMusicResult, statusInfo, parameters);
      }

      // Process music in parallel with scenes
      const musicPromise = this.musicProcessor.generateMusic(
        jobId, llmResult, parameters, serviceConfig
      );

      // Process scenes in parallel
      const sceneResults = await this.processScenes(
        llmResult, jobId, jobOutputDir, serviceConfig, parameters, outputType
      );

      // Wait for music to complete
      const musicResult = await musicPromise;

      // Save metadata and finish up
      await this.finalizeJob(
        jobId, jobOutputDir, llmResult, sceneResults, musicResult, parameters
      );

      return this.prepareResponse(jobId, jobOutputDir, llmResult, sceneResults, musicResult, null, parameters);
    } catch (error) {
      await this.handleError(jobId, error);
      throw error;
    }
  }

  getSceneOutputPath(jobOutputDir, sceneIndex) {
    return path.join(jobOutputDir, `scene_${sceneIndex}`);
  }

  async ensureOutputDirectories(jobOutputDir, scenesCount) {
    try {
      // Create base job directory
      await fs.mkdir(jobOutputDir, { recursive: true });

      // Create scene directories
      for (let i = 1; i <= scenesCount; i++) {
        await fs.mkdir(this.getSceneOutputPath(jobOutputDir, i), { recursive: true });
      }
      logger.info(`Created output directories in ${jobOutputDir}`);
    } catch (error) {
      logger.error('Error creating output directories:', error);
      throw error;
    }
  }

  async getJobStatus(jobId) {
    try {
      const job = await this.jobDataAccess.getJob(jobId);
      if (!job) {
        throw new Error(`Job not found: ${jobId}`);
      }
      return job;
    } catch (error) {
      logger.error(`Error getting job status for ${jobId}:`, error);
      throw error;
    }
  }

  async getAllJobs(filters = {}) {
    try {
      return await this.jobDataAccess.getAllJobs(filters);
    } catch (error) {
      logger.error('Error getting all jobs:', error);
      throw error;
    }
  }

  async deleteJob(jobId) {
    try {
      return await this.jobDataAccess.deleteJob(jobId);
    } catch (error) {
      logger.error(`Error deleting job ${jobId}:`, error);
      throw error;
    }
  }

  async getJobsStats() {
    try {
      return await this.jobDataAccess.getJobsStats();
    } catch (error) {
      logger.error('Error getting jobs stats:', error);
      throw error;
    }
  }

  // Create a unique job ID
  createJobId() {
    return uuidv4();
  }

  // Create the initial job record
  async createInitialJobRecord(jobId, prompt, parameters = {}, visualizationType, userId = null) {
    try {
      // Check if this is an LLM-only job
      const isLlmOnlyJob = parameters.serviceConfig?.skipVoice && 
                           parameters.serviceConfig?.skipImage && 
                           parameters.serviceConfig?.skipMusic && 
                           parameters.serviceConfig?.skipVisualization;
                           
      if (isLlmOnlyJob) {
        logger.info(`Creating LLM-only job record for jobId: ${jobId}`, { userId });
      }

      // Process service configuration
      const { serviceConfig, visualizationType: outputType, serviceSequence } = 
        serviceConfigManager.processServiceConfig(parameters, visualizationType, jobId);

      // Calculate number of scenes or use default
      const llmGenParams = parameters.llmGenParams || {};
      const sceneAmount = llmGenParams.general?.sceneAmount || 5; // Default to 5 scenes if not specified

      // Initialize progress tracking
      progressTracker.initJobProgress(jobId, serviceConfig, sceneAmount);

      // Create initial job record with userId
      await this.jobDataAccess.createJob({
        jobId,
        prompt,
        status: 'in_progress',
        parameters,
        visualizationType: serviceConfig.visualizationType,
        serviceConfig,
        userId,
        serviceSequence,
        isLlmOnly: isLlmOnlyJob
      });

      /*logger.info(`Created job record for jobId: ${jobId}`, {
        userId,
        serviceConfig,
        visualizationType: serviceConfig.visualizationType,
        serviceSequence,
        sceneAmount,
        isLlmOnly: isLlmOnlyJob
      });*/

      return jobId;
    } catch (error) {
      logger.error('Error creating initial job record:', error);
      throw error;
    }
  }

  // Process job in the background
  async processJobInBackground(jobId, prompt, parameters = {}, visualizationType, userId = null) {
    try {
      // Start actual processing
      const result = await this.generateContent(
        prompt, 
        parameters, 
        visualizationType, 
        userId,
        jobId // Pass the job ID directly
      );
      
      // Update progress tracker with the final status
      progressTracker.setJobStatus(jobId, result.status);
      
      // Log appropriate message based on status
      if (result.status === 'failed') {
        logger.warn(`Job ${jobId} completed with status: failed`);
      } else if (result.status === 'incomplete') {
        logger.warn(`Job ${jobId} completed with status: incomplete - some content creation tasks had errors`);
      } else {
        logger.info(`Job ${jobId} completed successfully with status: ${result.status}`);
      }
      
      return result;
    } catch (error) {
      logger.error(`Background job processing error for job ${jobId}:`, error);
      
      // Update job status to failed in case of error
      try {
        // Prepare error metadata
        const errorMetadata = jobResultManager.prepareErrorMetadata(jobId, error);
        
        // Update job record
        await this.jobDataAccess.updateJob(jobId, {
          status: 'failed',
          error: error.message,
          metadata: JSON.stringify(errorMetadata)
        });
        
        // Update progress tracker with failed status
        progressTracker.setJobStatus(jobId, 'failed');
      } catch (updateError) {
        logger.error(`Error updating job status for failed job ${jobId}:`, updateError);
      }
      
      throw error;
    }
  }

  // Get job progress
  getJobProgress(jobId) {
    try {
      if (!jobId) {
        throw new Error('Job ID is required');
      }
      
      // Get progress from the progress tracker
      const progress = progressTracker.getJobProgress(jobId);
      
      // If no progress data is found, try to get data from the database
      if (!progress) {
        logger.info(`No progress data found in memory for job ${jobId}, checking database`);
        return this.getBasicJobProgress(jobId);
      }
      
      // Enhance progress data with additional information
      const enhancedProgress = {
        ...progress,
        timestamp: new Date().toISOString(),
        serviceStatuses: {
          llm: progress.serviceProgress?.llm?.status || 'unknown',
          music: progress.serviceProgress?.music?.status || 'unknown',
          voice: this._getServiceStatusForAllScenes(progress, 'voice'),
          image: this._getServiceStatusForAllScenes(progress, 'image'),
          video: this._getServiceStatusForAllScenes(progress, 'video'),
          animation: this._getServiceStatusForAllScenes(progress, 'animation')
        },
        sceneProgress: this._getSceneProgressSummary(progress),
        duration: progress.endTime ? 
          new Date(progress.endTime) - new Date(progress.startTime) : 
          Date.now() - new Date(progress.startTime)
      };
      
      // Log significant progress changes
      if (enhancedProgress.overallProgress % 25 === 0 || // Log at 0%, 25%, 50%, 75%, 100%
          enhancedProgress.status !== 'in_progress') {
        logger.info(`Job ${jobId} progress update:`, {
          status: enhancedProgress.status,
          progress: enhancedProgress.overallProgress,
          duration: enhancedProgress.duration,
          serviceStatuses: enhancedProgress.serviceStatuses,
          sceneProgress: enhancedProgress.sceneProgress
        });
      }
      
      return enhancedProgress;
    } catch (error) {
      logger.error(`Error getting job progress for ${jobId}:`, error);
      throw error;
    }
  }
  
  // Get basic job progress from the database if not in memory
  async getBasicJobProgress(jobId) {
    try {
      const job = await this.jobDataAccess.getJob(jobId);
      
      if (!job) {
        return null;
      }
      
      // Map database status to progress data
      const status = job.status;
      let overallProgress = 0;
      
      switch (status) {
        case 'completed':
          overallProgress = 100;
          break;
        case 'failed':
          overallProgress = 100; // Complete but with errors
          break;
        case 'in_progress':
          // Estimate progress from metadata if available
          const metadata = typeof job.metadata === 'string' 
            ? JSON.parse(job.metadata) 
            : job.metadata || {};
            
          if (metadata.progress) {
            overallProgress = metadata.progress;
          } else {
            // Default to 50% if in progress but no detailed progress info
            overallProgress = 50;
          }
          break;
        default:
          overallProgress = 0;
      }
      
      // Include error message if present
      const errorMessage = job.error || null;
      
      return {
        jobId,
        status,
        overallProgress,
        errorMessage,
        startTime: job.created_at,
        lastUpdated: job.updated_at,
        estimated: true // Flag to indicate this is estimated progress
      };
    } catch (error) {
      logger.error(`Error getting basic job progress for ${jobId}:`, error);
      return null;
    }
  }

  async finalizeJob(jobId, jobOutputDir, llmResult, sceneResults, musicResult, parameters, customStatusInfo = null) {
    // Extract service config from parameters
    const config = parameters?.serviceConfig || {};
    
    // Get status info from custom info or analyze results
    const jobStatusInfo = customStatusInfo || jobResultManager.analyzeResults(sceneResults, config, musicResult);
    
    // Ensure status is properly set
    if (jobStatusInfo.status !== 'completed' && jobStatusInfo.status !== 'failed') {
      jobStatusInfo.status = 'completed';
    }
    
    // Prepare metadata with the correct structure
    const jobMetadata = jobResultManager.prepareMetadata(
      jobId,
      llmResult,
      sceneResults,
      musicResult,
      parameters,
      jobStatusInfo
    );

    // Save metadata
    await outputManager.saveJobMetadata(jobOutputDir, jobMetadata);
    
    // Get progress tracker
    const progressTracker = require('./utils/progress-tracker');
    
    // Mark job as finalizing to prevent race conditions
    progressTracker.finalizingJobs.add(jobId);
    
    try {
      // Update job status in database
      await jobDataAccess.updateJob(jobId, {
        status: jobStatusInfo.status,
        metadata: JSON.stringify(jobMetadata),
        completed_at: new Date().toISOString()
      });
      
      // Remove from finalizing set
      progressTracker.finalizingJobs.delete(jobId);
      
      // Log completion
      logger.info(`Job ${jobId} finalized with status: ${jobStatusInfo.status}`);
      
      return jobMetadata;
    } catch (error) {
      // Remove from finalizing set even if there's an error
      progressTracker.finalizingJobs.delete(jobId);
      throw error;
    }
  }

  async handleError(jobId, error) {
    logger.error(`Error in job ${jobId}:`, error);
    try {
      // Prepare error metadata with enhanced details
      const errorMetadata = {
        ...jobResultManager.prepareErrorMetadata(jobId, error),
        errorDetails: {
          name: error.name,
          code: error.code,
          stack: error.stack,
          timestamp: new Date().toISOString(),
          type: this._categorizeError(error),
          context: {
            message: error.message,
            status: error.response?.status,
            statusText: error.response?.statusText,
            errorCode: error.response?.data?.error?.code,
            errorMessage: error.response?.data?.error?.message
          }
        }
      };
      
      // Update job record with enhanced error information
      await this.jobDataAccess.updateJob(jobId, {
        status: 'failed',
        error: error.message,
        error_type: this._categorizeError(error),
        error_code: error.code || error.response?.data?.error?.code,
        metadata: JSON.stringify(errorMetadata)
      });
      
      // Update progress tracker with failed status
      progressTracker.setJobStatus(jobId, 'failed');
      
      // Log the categorized error
      logger.error(`Job ${jobId} failed with error type: ${this._categorizeError(error)}`, {
        errorMessage: error.message,
        errorCode: error.code || error.response?.data?.error?.code,
        timestamp: new Date().toISOString()
      });
    } catch (updateError) {
      logger.error('Error updating job status:', updateError);
    }
  }

  /**
   * Categorize the error type for better error handling and reporting
   * @private
   * @param {Error} error - The error object
   * @returns {string} - The categorized error type
   */
  _categorizeError(error) {
    if (error.response) {
      // API/HTTP errors
      switch (error.response.status) {
        case 400:
          return 'BAD_REQUEST';
        case 401:
          return 'UNAUTHORIZED';
        case 403:
          return 'FORBIDDEN';
        case 404:
          return 'NOT_FOUND';
        case 429:
          return 'RATE_LIMIT';
        case 500:
          return 'SERVER_ERROR';
        default:
          return 'API_ERROR';
      }
    } else if (error.code) {
      // System errors
      switch (error.code) {
        case 'ENOENT':
          return 'FILE_NOT_FOUND';
        case 'EACCES':
          return 'PERMISSION_DENIED';
        case 'ECONNREFUSED':
          return 'CONNECTION_REFUSED';
        case 'ETIMEDOUT':
          return 'TIMEOUT';
        default:
          return 'SYSTEM_ERROR';
      }
    } else if (error.message) {
      // Business logic errors
      if (error.message.includes('validation')) return 'VALIDATION_ERROR';
      if (error.message.includes('timeout')) return 'TIMEOUT_ERROR';
      if (error.message.includes('rate limit')) return 'RATE_LIMIT';
      return 'BUSINESS_ERROR';
    }
    
    return 'UNKNOWN_ERROR';
  }

  prepareResponse(jobId, jobOutputDir, llmResult, sceneResults, musicResult, statusInfo = null, parameters = null) {
    // Extract service config from parameters or fallback to llmResult.parameters
    const serviceConfig = (parameters && parameters.serviceConfig) || 
                        (llmResult && llmResult.parameters && llmResult.parameters.serviceConfig) || 
                        {
                          skipVoice: false,
                          skipMusic: false,
                          skipImage: false,
                          skipVisualization: false
                        };
    
    // Add visualizationType to serviceConfig if it doesn't exist
    if (!serviceConfig.visualizationType) {
      serviceConfig.visualizationType = (parameters && parameters.visualizationType) || 
                                      (llmResult && llmResult.parameters && llmResult.parameters.visualizationType) ||
                                      'image';
    }
    
    // Log the scene results for debugging
    /*logger.info('Scene results passed to analyzeResults:', {
      jobId,
      hasSceneResults: !!sceneResults,
      sceneResultsCount: sceneResults?.sceneResults?.length,
      scenes: sceneResults?.sceneResults?.map(scene => ({
        sceneId: scene.sceneId,
        status: scene.status,
        hasImage: !!scene.image,
        imageStatus: scene.image?.status,
        imageFilePath: scene.image?.filePath,
        hasVoice: !!scene.voice,
        voiceStatus: scene.voice?.status
      })),
      hasMusicResult: !!musicResult,
      musicStatus: musicResult?.status
    }); */
    
    // Analyze results
    const statusInfoFromResults = jobResultManager.analyzeResults(sceneResults, serviceConfig, musicResult);
    
    // Prepare response with serviceConfig
    return jobResultManager.prepareResponse(
      jobId, jobOutputDir, llmResult, sceneResults, musicResult, statusInfo || statusInfoFromResults, serviceConfig
    );
  }

  /**
   * Get the status of a service across all scenes
   * @private
   * @param {Object} progress - The progress data
   * @param {string} service - The service name
   * @returns {Object} - Service status summary
   */
  _getServiceStatusForAllScenes(progress, service) {
    const sceneProgress = progress.sceneProgress || {};
    const statuses = Object.values(sceneProgress)
      .map(scene => scene[service]?.status)
      .filter(status => status !== undefined);
    
    if (statuses.length === 0) return 'unknown';
    
    const completed = statuses.filter(s => s === 'completed').length;
    const failed = statuses.filter(s => s === 'failed').length;
    const inProgress = statuses.filter(s => s === 'in_progress').length;
    
    return {
      total: statuses.length,
      completed,
      failed,
      inProgress,
      status: failed > 0 ? 'failed' : 
              inProgress > 0 ? 'in_progress' : 
              completed === statuses.length ? 'completed' : 'unknown'
    };
  }

  /**
   * Get a summary of scene progress
   * @private
   * @param {Object} progress - The progress data
   * @returns {Object} - Scene progress summary
   */
  _getSceneProgressSummary(progress) {
    const sceneProgress = progress.sceneProgress || {};
    const scenes = Object.values(sceneProgress);
    
    return {
      total: scenes.length,
      completed: scenes.filter(scene => 
        Object.values(scene).every(service => service?.status === 'completed')
      ).length,
      failed: scenes.filter(scene => 
        Object.values(scene).some(service => service?.status === 'failed')
      ).length,
      inProgress: scenes.filter(scene => 
        Object.values(scene).some(service => service?.status === 'in_progress')
      ).length
    };
  }
}

module.exports = JobPipelineService;

