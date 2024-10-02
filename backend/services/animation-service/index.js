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

  async process(imagePath, testFolder, sceneNumber, options = {}, isTest = false) {
    try {
      logger.info(`Processing animation request for scene ${sceneNumber}`);
      logger.info(`Image path: ${imagePath}`);
      logger.info(`Test folder: ${testFolder}`);
      logger.info('Animation options:', JSON.stringify(options));

      if (!options.animationPrompt) {
        throw new Error('Video prompt is required for animation generation');
      }

      // The pattern generation is now handled internally by AnimationGenService
      logger.info('Starting animation generation');
      const result = await this.service.generateAnimation(imagePath, testFolder, sceneNumber, options, isTest);
      logger.info('Animation generation completed successfully');
      logger.info(`Animation saved to: ${result.filePath}`);
      return result;
    } catch (error) {
      logger.error('Error processing animation:', error);
      throw error;
    }
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

    const PORT = process.env.ANIMATION_SERVICE_PORT || 3005;
    const app = createServer(animationServiceInterface);

    app.listen(PORT, () => {
      logger.info(`Animation Service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start Animation Service:', error);
    process.exit(1);
  }
}

module.exports = { AnimationServiceInterface, startServer };