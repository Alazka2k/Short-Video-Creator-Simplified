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

  async process(prompt, parameters = {}, visualizationType = 'animation', userId = null) {
    try {
      const result = await this.jobPipeline.generateContent(prompt, parameters, visualizationType, userId);
      
      // Log appropriate message based on status
      if (result.status === 'failed') {
        logger.warn(`Job ${result.jobId} completed with service failures`);
      } else {
        logger.info(`Job ${result.jobId} completed successfully`);
      }
      
      return result;
    } catch (error) {
      logger.error('Job Service: Error generating content:', error);
      error.jobId = error.jobId || 'unknown'; // Ensure jobId is available
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

