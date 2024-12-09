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

  async generateContent(prompt, parameters = {}) {
    const jobId = uuidv4();
    const jobOutputDir = this.getJobOutputPath(jobId);
    
    try {
      logger.info(`Starting content generation job ${jobId} for prompt: ${prompt}`);
      
      // Get and validate service configuration
      const serviceConfig = {
        skipVoice: parameters.serviceConfig?.skipVoice ?? false,
        skipMusic: parameters.serviceConfig?.skipMusic ?? false,
        skipImage: parameters.serviceConfig?.skipImage ?? false,
        skipVisualization: parameters.serviceConfig?.skipVisualization ?? false
      };

      // Use visualization type from parameters if available, otherwise use the provided one
      const finalVisualizationType = parameters.visualizationType;

      // Validate visualization type if visualization is not skipped
      if (!serviceConfig.skipVisualization) {
        if (!finalVisualizationType) {
          throw new Error('visualizationType is required when visualization is not skipped');
        }
        if (!['video', 'animation'].includes(finalVisualizationType)) {
          throw new Error('visualizationType must be either "video" or "animation"');
        }
        logger.info(`Using visualization type: ${finalVisualizationType}`);
      }

      // Create initial job record
      await this.jobDataAccess.createJob({
        jobId,
        prompt,
        status: 'in_progress',
        parameters,
        visualizationType: finalVisualizationType,
        startTime: new Date().toISOString()
      });
      logger.info(`Created job record with ID: ${jobId}`);

      // Step 1: Generate LLM content
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

      // Process music in parallel
      const musicResult = await this.musicProcessor.generateMusic(
        jobId, llmResult, parameters, serviceConfig
      );

      // Process scenes
      const sceneResults = await this.processScenes(
        llmResult, jobId, jobOutputDir, serviceConfig, parameters, finalVisualizationType
      );

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

  async processScenes(llmResult, jobId, jobOutputDir, serviceConfig, parameters, visualizationType) {
    const sceneResults = [];
    let hasFailedServices = false;

    for (let i = 0; i < llmResult.content.scenes.length; i++) {
      const sceneId = i + 1;
      const scene = llmResult.content.scenes[i];
      const sceneDir = this.getSceneOutputPath(jobOutputDir, sceneId);

      try {
        const sceneResult = await this.sceneProcessor.processScene(
          scene, sceneId, jobId, sceneDir, serviceConfig, parameters, visualizationType
        );
        sceneResults.push(sceneResult);
      } catch (error) {
        hasFailedServices = true;
        logger.error(`Error processing scene ${sceneId}:`, error);
        await this.jobDataAccess.updateJobProgress(jobId, 'scene', 'failed', {
          sceneId,
          error: error.message
        });
      }
    }

    return { sceneResults, hasFailedServices };
  }

  async finalizeJob(jobId, jobOutputDir, llmResult, sceneResults, musicResult, parameters) {
    const metadata = {
      jobId,
      status: sceneResults.hasFailedServices ? 'failed' : 'completed',
      llmResult: llmResult.content,
      scenes: sceneResults.sceneResults,
      music: musicResult,
      parameters,
      endTime: new Date().toISOString()
    };

    await MetadataManager.saveProjectMetadata(jobOutputDir, metadata);
    await this.jobDataAccess.updateJob(jobId, {
      status: metadata.status,
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
    return {
      jobId,
      status: sceneResults.hasFailedServices ? 'failed' : 'completed',
      outputDir: jobOutputDir,
      content: {
        llm: llmResult.content,
        scenes: sceneResults.sceneResults,
        music: musicResult
      }
    };
  }
}

module.exports = JobPipelineService;

