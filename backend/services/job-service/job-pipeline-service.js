const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const logger = require('../../shared/utils/logger');
const jobDataAccess = require('./data/jobDataAccess');
const config = require('../../shared/utils/config');
const SceneProcessor = require('./processors/scene-processor');
const MusicProcessor = require('./processors/music-processor');
const MetadataManager = require('./utils/metadata-manager');

class JobPipelineService {
  constructor(services) {
    this.services = services;
    this.jobDataAccess = jobDataAccess;
    this.sceneProcessor = new SceneProcessor(services, jobDataAccess);
    this.musicProcessor = new MusicProcessor(services.music, jobDataAccess);
    this.baseOutputPath = path.join(config.output.directory, 'integration');
    logger.info('JobPipelineService initialized with JobDataAccess');
  }

  getJobOutputPath(jobId, date = new Date()) {
    const dateString = date.toISOString().split('T')[0];
    return path.join(this.baseOutputPath, dateString, jobId);
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
    
    const jobOutputDir = this.getJobOutputPath(jobId);
    
    try {
      logger.info(`Starting content generation job ${jobId} for prompt: ${prompt}`, { userId });
      
      // Get and validate service configuration
      const serviceConfig = {
        skipVoice: parameters.serviceConfig?.skipVoice ?? false,
        skipMusic: parameters.serviceConfig?.skipMusic ?? false,
        skipImage: parameters.serviceConfig?.skipImage ?? false,
        skipVisualization: parameters.serviceConfig?.skipVisualization ?? false
      };

      // Use visualization type from parameters if available
      const visualizationType = parameters.visualizationType;

      // Validate visualization type if visualization is not skipped
      if (!serviceConfig.skipVisualization) {
        if (!visualizationType) {
          throw new Error('visualizationType is required when visualization is not skipped');
        }
        if (!['video', 'animation'].includes(visualizationType)) {
          throw new Error('visualizationType must be either "video" or "animation"');
        }
        logger.info(`Using visualization type: ${visualizationType}`);
      }

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

      // Create output directories
      await this.ensureOutputDirectories(jobOutputDir, llmResult.content.scenes.length);

      // Process music in parallel with scenes
      const musicPromise = this.musicProcessor.generateMusic(
        jobId, llmResult, parameters, serviceConfig
      );

      // Process scenes in parallel
      const sceneResults = await this.processScenes(
        llmResult, jobId, jobOutputDir, serviceConfig, parameters, visualizationType
      );

      // Wait for music to complete
      const musicResult = await musicPromise;

      // Save metadata and finish up
      await this.finalizeJob(
        jobId, jobOutputDir, llmResult, sceneResults, musicResult, parameters
      );

      return this.prepareResponse(jobId, jobOutputDir, llmResult, sceneResults, musicResult);
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

  async finalizeJob(jobId, jobOutputDir, llmResult, sceneResults, musicResult, parameters) {
    // Count how many scenes have complete failures vs partial successes
    const totalScenes = sceneResults.sceneResults.length;
    const completelyFailedScenes = sceneResults.sceneResults.filter(
      scene => scene.status === 'failed' && !scene.voice && !scene.image
    ).length;

    // Only mark job as failed if all scenes completely failed
    const jobStatus = completelyFailedScenes === totalScenes ? 'failed' : 'completed_with_errors';

    const metadata = {
      jobId,
      status: jobStatus,
      llmResult: llmResult.content,
      scenes: sceneResults.sceneResults.map(scene => ({
        sceneId: scene.sceneId,
        voice: scene.voice,
        image: scene.image,
        video: scene.video,
        animation: scene.animation,
        ...(scene.status === 'failed' ? { error: scene.error, status: 'failed' } : {})
      })),
      music: musicResult,
      parameters,
      endTime: new Date().toISOString()
    };

    await MetadataManager.saveProjectMetadata(jobOutputDir, metadata);
    await this.jobDataAccess.updateJob(jobId, {
      status: jobStatus,
      metadata: JSON.stringify(metadata)
    });
  }

  async handleError(jobId, error) {
    logger.error(`Error in job ${jobId}:`, error);
    try {
      await this.jobDataAccess.updateJob(jobId, {
        status: 'failed',
        metadata: JSON.stringify({
          error: error.message,
          errorStack: error.stack,
          endTime: new Date().toISOString()
        })
      });
    } catch (updateError) {
      logger.error('Error updating job status:', updateError);
    }
  }

  prepareResponse(jobId, jobOutputDir, llmResult, sceneResults, musicResult) {
    // Use the same logic as finalizeJob for consistency
    const totalScenes = sceneResults.sceneResults.length;
    const completelyFailedScenes = sceneResults.sceneResults.filter(
      scene => scene.status === 'failed' && !scene.voice && !scene.image
    ).length;
    const jobStatus = completelyFailedScenes === totalScenes ? 'failed' : 'completed_with_errors';

    return {
      jobId,
      status: jobStatus,
      outputDir: jobOutputDir,
      content: {
        llm: llmResult.content,
        scenes: sceneResults.sceneResults.map(scene => ({
          sceneId: scene.sceneId,
          voice: scene.voice,
          image: scene.image,
          video: scene.video,
          animation: scene.animation,
          ...(scene.status === 'failed' ? { error: scene.error, status: 'failed' } : {})
        })),
        music: musicResult
      }
    };
  }
}

module.exports = JobPipelineService;

