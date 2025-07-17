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
const JobDataAccess = require('./data/jobDataAccess');

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

      // Corrected Initialization Order
      this.jobDataAccess = JobDataAccess;
      this.jobPipelineService = new JobPipelineService(this.services, this.jobDataAccess, progressTracker);

      logger.info('Job Service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Job Service:', error);
      throw error;
    }
  }

  // Create a unique job ID
  createJobId() {
    return this.jobPipelineService.createJobId();
  }

  // Create the initial job record and return a job ID
  async createInitialJob(prompt, parameters = {}, visualizationType = 'image', userId = null) {
    try {
      const jobId = this.createJobId();
      
      const isLlmOnlyJob = parameters.serviceConfig?.skipVoice && 
                          parameters.serviceConfig?.skipImage && 
                          parameters.serviceConfig?.skipMusic && 
                          parameters.serviceConfig?.skipVisualization;
                          
      logger.info(`Creating initial job record with ${isLlmOnlyJob ? 'LLM-only' : 'full'} processing`, {
        jobId,
        userId,
        isLlmOnly: isLlmOnlyJob
      });
      
      await this.jobPipelineService.createInitialJobRecord(jobId, prompt, parameters, visualizationType, userId);
      
      return { jobId };
    } catch (error) {
      logger.error('Error creating initial job record:', error);
      throw error;
    }
  }

  // Process job in the background
  async processJobInBackground(jobId, prompt, parameters = {}, visualizationType = 'image', userId = null) {
    try {
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
      
      // Note the change to use jobPipelineService
      this.jobPipelineService.processJobInBackground(jobId, prompt, parameters, visualizationType, userId);
    } catch (error) {
      logger.error(`Background job processing error for job ${jobId}:`, error);
      // We don't re-throw here because this is an async background process
    }
  }

  async getJobStatus(jobId) {
    return await this.jobPipelineService.getJobStatus(jobId);
  }

  async getAllJobs(filters = {}) {
    return await this.jobDataAccess.getAllJobs(filters);
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
      return this.jobPipelineService.getJobProgress(jobId);
    } catch (error) {
      logger.error(`Error getting job progress for ${jobId}:`, error);
      throw error;
    }
  }
  
  // Get basic job progress from the database if not in memory
  async getBasicJobProgress(jobId) {
    try {
      return await this.jobPipelineService.getBasicJobProgress(jobId);
    } catch (error) {
      logger.error(`Error getting basic job progress for ${jobId}:`, error);
      return null;
    }
  }

  async addResultToScene(jobId, sceneId, service, status, data) {
    if (!this.jobDataAccess) {
      throw new Error('JobDataAccess not initialized');
    }
    await this.jobDataAccess.addResultToScene(jobId, sceneId, service, status, data);
  }

  async getJob(jobId, userId) {
    return await this.jobDataAccess.getJobByIdAndUser(jobId, userId);
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

module.exports = jobService = new JobServiceInterface();

