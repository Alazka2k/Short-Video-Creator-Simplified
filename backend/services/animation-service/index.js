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

  async process(imageUrl, videoPrompt, sceneIndex, jobId = null, parameters = {}, isTest = false) {
    try {
      logger.info('Animation service: Starting process...', {
        imageUrl,
        sceneIndex,
        jobId,
        parameters: JSON.stringify(parameters),
        isTest
      });

      // Validate inputs
      if (!videoPrompt) {
        logger.error('Animation service: Missing video prompt');
        throw new Error('Video prompt is required for animation generation');
      }

      if (!imageUrl) {
        logger.error('Animation service: Missing image URL');
        throw new Error('Image URL is required for animation generation');
      }

      if (!jobId && !isTest) {
        throw new Error('jobId is required for production mode');
      }

      logger.info('Starting animation generation');
      const result = await this.service.generateAnimation(
        imageUrl,
        videoPrompt,
        sceneIndex,
        jobId,
        parameters,
        isTest
      );

      const transformedResult = {
        ...result,
        url: result.publicUrl || result.filePath
      };

      logger.info('Animation generation completed successfully');
      logger.info(`Animation saved to: ${transformedResult.url}`);
      return transformedResult;
    } catch (error) {
      logger.error('Animation service: Process failed', {
        error: error.message,
        stack: error.stack
      });
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