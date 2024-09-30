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

  async initialize() {
    logger.info('Initializing ImageServiceInterface');
    await this.service.init();
    logger.info('ImageServiceInterface initialized');
  }

  async process(prompt, outputDir, sceneIndex) {
    logger.info(`Processing image generation request: ${prompt}`);
    return await this.service.generateImage(prompt, outputDir, sceneIndex);
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

// Start the server if this file is run directly
if (require.main === module) {
  startServer();
}

module.exports = { ImageServiceInterface, startServer };