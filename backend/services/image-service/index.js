const ImageGenService = require('./image-gen-service');
const createServer = require('./server');
const logger = require('../../shared/utils/logger');
const config = require('../../shared/utils/config');

class ImageServiceInterface {
  constructor() {
    logger.info('Constructing ImageServiceInterface');
    this.service = new ImageGenService();
    logger.info('ImageGenService instance created');
  }

  async handleUnhandledRejection(reason, promise) {
    logger.error('Unhandled rejection at:', promise, 'reason:', reason);
    // Handle similar to uncaught exceptions
    await this.handleUncaughtError(reason);
  }

  async initialize() {
    logger.info('Initializing ImageServiceInterface');
    await this.service.init();
    logger.info('ImageServiceInterface initialized');
  }

  async generateContent(prompt, sceneIndex = null, jobId = null, isTest = false) {
    logger.info(`Generating image content: ${prompt}`);
    return await this.service.generateImage(prompt, sceneIndex, jobId, isTest);
  }

  async process(prompt, sceneIndex = null, jobId = null, isTest = false) {
    logger.info(`Processing image generation request: ${prompt}`);
    return await this.generateContent(prompt, sceneIndex, jobId, isTest);
  }

  async cleanup() {
    logger.info('Cleaning up ImageServiceInterface');
    await this.service.close();
  }
}

async function startServer() {
  try {
    logger.info('Starting Image Service');
    const imageServiceInterface = new ImageServiceInterface();
    await imageServiceInterface.initialize();

    const PORT = process.env.IMAGE_SERVICE_PORT || 3002;
    const app = createServer(imageServiceInterface);

    app.listen(PORT, () => {
      logger.info(`Image Service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start Image Service:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = { ImageServiceInterface, startServer };