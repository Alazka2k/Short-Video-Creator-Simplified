const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const logger = require('../../shared/utils/logger');
const config = require('../../shared/utils/config');
const SceneProcessor = require('./processors/scene-processor');
const MusicProcessor = require('./processors/music-processor');
const MetadataManager = require('./utils/metadata-manager');

// Import new utility classes
const serviceConfigManager = require('./utils/service-config-manager');
const jobResultManager = require('./utils/job-result-manager');
const outputManager = require('./utils/output-manager');

class JobPipelineService {
  constructor(services, jobDataAccess, progressTracker) {
    this.services = services;
    this.jobDataAccess = jobDataAccess;
    this.progressTracker = progressTracker;
    this.sceneProcessor = new SceneProcessor(services, this.jobDataAccess, this.progressTracker);
    this.musicProcessor = new MusicProcessor(services.music, this.jobDataAccess, this.progressTracker);
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
        // The error is already logged in the scene processor. We just need to avoid crashing Promise.all.
        // We'll log it here again for context in the pipeline.
        logger.error(`Error initiating processing for scene ${sceneId} in pipeline: ${error.message}`);
        // A failure in one scene shouldn't stop others from being initiated.
        // The job status will be marked as 'failed' by the progress tracker.
      });
    });

    // We just need to wait for all the scene processing requests to be initiated.
    // We don't need to inspect the results here, as they are handled asynchronously.
    await Promise.all(scenePromises);
    logger.info(`All scene processing requests have been initiated for job ${jobId}.`);
    // No return value is needed as the caller doesn't use it.
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

      // --- Persist LLM Result ---
      const job = await this.jobDataAccess.getJob(jobId);
      const metadata = job.metadata || {};
      metadata.llmResult = llmResult.content;
      await this.jobDataAccess.updateJob(jobId, { metadata: JSON.stringify(metadata) });
      logger.info(`Persisted llmResult to metadata for job ${jobId}`);
      // --- End Persist ---

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
        await this.jobDataAccess.finalizeJob(jobId);
        
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
      const sceneProcessingPromise = this.processScenes(
        llmResult, jobId, jobOutputDir, serviceConfig, parameters, outputType
      );

      // Wait for the initial scene processing requests to be sent
      await sceneProcessingPromise;

      // Wait for music to complete
      const musicResult = await musicPromise;

      // NEW: Wait for all asynchronous scene services (image, video, etc.) to complete via webhooks
      const allScenesCompleted = await this._waitForSceneCompletion(jobId, llmResult.content.scenes.length, serviceConfig);

      if (!allScenesCompleted) {
        const timeoutError = new Error(`Job timed out waiting for scene completion.`);
        logger.error(`Job ${jobId} failed: ${timeoutError.message}`);
        await this.handleError(jobId, timeoutError);
        return; // Explicitly stop processing
      }

      // Finalize job if all scenes completed
      logger.info(`All services for job ${jobId} have reported completion. Finalizing job.`);
      await this.jobDataAccess.finalizeJob(jobId);

    } catch (error) {
      await this.handleError(jobId, error);
      // Do not re-throw error to the caller (e.g., the API route)
      // The error has been handled and logged.
    }
  }

  /**
   * Waits for all scene-related services to report a final status (completed, failed, or skipped).
   * @param {string} jobId The ID of the job to monitor.
   * @param {number} scenesCount The number of scenes in the job.
   * @param {object} serviceConfig The configuration of active services.
   * @returns {Promise<boolean>} A promise that resolves to true if all scenes complete, false on timeout/failure.
   */
  async _waitForSceneCompletion(jobId, scenesCount, serviceConfig) {
    const checkInterval = 5000; // Check every 5 seconds
    const timeout = 10 * 60 * 1000; // 10-minute timeout
    const startTime = Date.now();

    const servicesToTrack = [];
    if (!serviceConfig.skipImage) servicesToTrack.push('image');
    if (!serviceConfig.skipVisualization) {
      servicesToTrack.push(serviceConfig.visualizationType || 'animation');
    }

    if (servicesToTrack.length === 0) {
      logger.info(`No asynchronous scene services to track for job ${jobId}.`);
      return true; // Nothing to wait for
    }

    return new Promise(async (resolve) => {
      const intervalId = setInterval(async () => {
        if (Date.now() - startTime > timeout) {
          clearInterval(intervalId);
          logger.error(`Timeout waiting for scene completion for job ${jobId}`);
          resolve(false);
          return;
        }

        const progress = this.progressTracker.getJobProgress(jobId);
        if (!progress || progress.status === 'failed') {
          clearInterval(intervalId);
          logger.info(`Job ${jobId} failed or was cancelled, stopping wait.`);
          resolve(false);
          return;
        }

        let allDone = true;
        for (let i = 1; i <= scenesCount; i++) {
          for (const service of servicesToTrack) {
            const sceneServiceStatus = progress.sceneProgress?.[i]?.[service]?.status;
            if (!['completed', 'failed', 'skipped'].includes(sceneServiceStatus)) {
              allDone = false;
              break;
            }
          }
          if (!allDone) break;
        }

        if (allDone) {
          clearInterval(intervalId);
          resolve(true);
        }
      }, checkInterval);
    });
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
      this.progressTracker.initJobProgress(jobId, serviceConfig, sceneAmount);

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
      await this.generateContent(
        prompt, 
        parameters, 
        visualizationType, 
        userId,
        jobId // Pass the job ID directly
      );
      
      // If the pipeline returns no result (e.g., from a handled timeout), stop here.
      // The generateContent function now handles its own logging and status updates.
    } catch (error) {
      logger.error(`Background job processing error for job ${jobId}`, {
        message: error.message,
        stack: error.stack,
        status: error.response?.status,
        data: error.response?.data
      });
      
      // Update job status to failed in case of error
      await this.handleError(jobId, error);
    }
  }

  // Get job progress
  getJobProgress(jobId) {
    try {
      if (!jobId) {
        throw new Error('Job ID is required');
      }
      
      // Get progress from the progress tracker
      const progress = this.progressTracker.getJobProgress(jobId);
      
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

  async handleError(jobId, error) {
    logger.error(`Error in job ${jobId}: ${error.message}`);
    try {
      // First, update the tracker with a failed status.
      // This immediately stops any polling loops that depend on it.
      const progressData = this.progressTracker.setJobStatus(jobId, 'failed');
      
      // Persist this final failed state to the database, which also sets the completed_at timestamp
      if (progressData) {
        await this.jobDataAccess.updateJobProgress(jobId, progressData);
      }
      
      // Log the categorized error
      const simplifiedError = {
        message: error.message,
        stack: error.stack,
        status: error.response?.status,
        data: error.response?.data
      };
      logger.error(`Job ${jobId} failed with categorized error:`, { 
        type: this._categorizeError(error),
        details: simplifiedError 
      });
    } catch (updateError) {
      logger.error('Error updating job status during error handling:', updateError);
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
}

module.exports = JobPipelineService;

