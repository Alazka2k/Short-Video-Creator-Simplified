const AnimationGenService = require('./animation-gen-service');
const createServer = require('./server');
const logger = require('../../shared/utils/logger');
const config = require('../../shared/utils/config');

class AnimationServiceInterface {
  constructor() {
    logger.info('Initializing AnimationServiceInterface');
    this.service = new AnimationGenService();
    logger.info('AnimationGenService instance created');
  }

  async initialize() {
    try {
      logger.info('Initializing AnimationServiceInterface...');
      await this.service.init();
      logger.info('AnimationServiceInterface initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize AnimationServiceInterface:', error);
      throw error;
    }
  }

  async process(imagePath, promptOrTestFolder, sceneIndex, jobId = null, options = {}, isTest = false) {
    try {
      logger.info(`Processing animation request for ${isTest ? 'test' : 'production'}`);
      logger.info(`Prompt or TestFolder: "${promptOrTestFolder}", scene: ${sceneIndex}, jobId: ${jobId}`);
      logger.info(`Image path: ${imagePath}`);
      logger.info('Animation options:', JSON.stringify(options));

      if (!options.videoPrompt) {
        throw new Error('Video prompt is required for animation generation');
      }

      if (!isTest && !jobId) {
        throw new Error('jobId is required for production mode');
      }

      logger.info('Starting animation generation');
      const result = await this.service.generateAnimation(
        imagePath,
        promptOrTestFolder,
        sceneIndex,
        jobId,
        options,
        isTest
      );

      logger.info('Animation generation completed successfully');
      logger.info(`Animation saved to: ${result.filePath}`);
      return result;
    } catch (error) {
      logger.error('Error processing animation:', error);
      throw error;
    }
  }

  // Database access methods
  async getAnimationsForJob(jobId) {
    return await this.service.getAnimationsForJob(jobId);
  }

  async getAnimationForScene(sceneId) {
    return await this.service.getAnimationForScene(sceneId);
  }

  async updateAnimationMetadata(animationId, metadata) {
    return await this.service.updateAnimationMetadata(animationId, metadata);
  }

  async deleteAnimation(animationId) {
    return await this.service.deleteAnimation(animationId);
  }

  async cleanup() {
    try {
      logger.info('Cleaning up AnimationServiceInterface...');
      await this.service.cleanup();
      logger.info('AnimationServiceInterface cleanup completed');
    } catch (error) {
      logger.error('Error during AnimationServiceInterface cleanup:', error);
      throw error;
    }
  }
}

async function startServer() {
  try {
    logger.info('Starting Animation Service');
    const animationServiceInterface = new AnimationServiceInterface();
    await animationServiceInterface.initialize();

    const PORT = process.env.ANIMATION_SERVICE_PORT || 3004;
    const app = createServer(animationServiceInterface);

    app.listen(PORT, () => {
      logger.info(`Animation Service running on port ${PORT}`);
      logger.info(`http://localhost:${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start Animation Service:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = { AnimationServiceInterface, startServer };