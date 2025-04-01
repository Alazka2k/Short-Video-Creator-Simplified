// backend/services/job-service/index.js

const JobPipelineService = require('./job-pipeline-service');
const createServer = require('./server');
const logger = require('../../shared/utils/logger');
const llmService = require('../llm-service');
const imageService = require('../image-service');
const { VoiceServiceInterface } = require('../voice-service');
const { MusicServiceInterface } = require('../music-service');
const { AnimationServiceInterface } = require('../animation-service');
const { VideoServiceInterface } = require('../video-service');
const progressTracker = require('./utils/progress-tracker');

class JobServiceInterface {
  constructor() {
    this.services = {};
  }

  async initialize() {
    logger.info('Initializing Job Service and dependencies...');

    try {
      // Initialize singleton services
      this.services.llm = llmService;
      await this.services.llm.initialize();

      this.services.image = imageService;
      await this.services.image.initialize();

      // Initialize services that need instantiation
      this.services.voice = new VoiceServiceInterface();
      await this.services.voice.initialize();

      this.services.music = new MusicServiceInterface();
      await this.services.music.initialize();

      this.services.animation = new AnimationServiceInterface();
      await this.services.animation.initialize();

      this.services.video = new VideoServiceInterface();
      await this.services.video.initialize();

      // Initialize job pipeline service
      this.jobPipeline = new JobPipelineService(this.services);

      logger.info('Job Service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Job Service:', error);
      throw error;
    }
  }

  // Create a unique job ID
  createJobId() {
    return this.jobPipeline.createJobId();
  }

  // Create the initial job record and return a job ID
  async createInitialJob(prompt, parameters = {}, visualizationType = 'image', userId = null) {
    try {
      // Create a job ID
      const jobId = this.createJobId();
      
      // Check if this is an LLM-only job for logging
      const isLlmOnlyJob = parameters.serviceConfig?.skipVoice && 
                          parameters.serviceConfig?.skipImage && 
                          parameters.serviceConfig?.skipMusic && 
                          parameters.serviceConfig?.skipVisualization;
                          
      logger.info(`Creating initial job record with ${isLlmOnlyJob ? 'LLM-only' : 'full'} processing`, {
        jobId,
        userId,
        isLlmOnly: isLlmOnlyJob
      });
      
      // Create the job record
      await this.jobPipeline.createInitialJobRecord(jobId, prompt, parameters, visualizationType, userId);
      
      // Return the job ID in an object for future expansion
      return { jobId };
    } catch (error) {
      logger.error('Error creating initial job record:', error);
      throw error;
    }
  }

  // Process job in the background
  async processJobInBackground(jobId, prompt, parameters = {}, visualizationType = 'image', userId = null) {
    try {
      // Check if this is an LLM-only job for logging
      const isLlmOnlyJob = parameters.serviceConfig?.skipVoice && 
                          parameters.serviceConfig?.skipImage && 
                          parameters.serviceConfig?.skipMusic && 
                          parameters.serviceConfig?.skipVisualization;
                          
      logger.info(`Starting background processing for job ${jobId} with ${isLlmOnlyJob ? 'LLM-only' : 'full'} processing`, {
        jobId,
        userId,
        visualizationType: isLlmOnlyJob ? 'none' : visualizationType,
        isLlmOnly: isLlmOnlyJob
      });
      
      return await this.jobPipeline.processJobInBackground(jobId, prompt, parameters, visualizationType, userId);
    } catch (error) {
      logger.error(`Background job processing error for job ${jobId}:`, error);
      throw error;
    }
  }

  async getJobStatus(jobId) {
    return await this.jobPipeline.getJobStatus(jobId);
  }

  async getAllJobs(filters = {}) {
    return await this.jobPipeline.getAllJobs(filters);
  }

  async cleanup() {
    logger.info('Cleaning up Job Service...');
    // Cleanup all services
    await Promise.all([
      this.services.image.cleanup(),
      this.services.voice.cleanup(),
      this.services.music.cleanup(),
      this.services.animation.cleanup(),
      this.services.video.cleanup()
    ]);
    logger.info('Job Service cleanup completed');
  }

  // Get job progress
  getJobProgress(jobId) {
    try {
      return this.jobPipeline.getJobProgress(jobId);
    } catch (error) {
      logger.error(`Error getting job progress for ${jobId}:`, error);
      throw error;
    }
  }
  
  // Get basic job progress from the database if not in memory
  async getBasicJobProgress(jobId) {
    try {
      return await this.jobPipeline.getBasicJobProgress(jobId);
    } catch (error) {
      logger.error(`Error getting basic job progress for ${jobId}:`, error);
      return null;
    }
  }
}

async function startServer() {
  try {
    logger.info('Starting Job Service');
    const jobService = new JobServiceInterface();
    await jobService.initialize();

    const PORT = process.env.JOB_SERVICE_PORT || 3008;
    const app = createServer(jobService);

    app.listen(PORT, () => {
      logger.info(`Job Service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start Job Service:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = { JobServiceInterface, startServer };

