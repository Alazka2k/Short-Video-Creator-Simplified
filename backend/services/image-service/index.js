const ImageGenService = require('./image-gen-service');
const createServer = require('./server');
const logger = require('../../shared/utils/logger');
const config = require('../../shared/utils/config');
require('dotenv').config();

class ImageServiceInterface {
  constructor() {
    logger.info('Constructing ImageServiceInterface');
    this.service = null;
    logger.info('ImageServiceInterface constructed');
  }

  async handleUnhandledRejection(reason, promise) {
    logger.error('Unhandled rejection at:', promise, 'reason:', reason);
    await this.handleUncaughtError(reason);
  }

  async initialize() {
    logger.info('Initializing ImageServiceInterface');
    this.service = new ImageGenService();
    logger.info('ImageServiceInterface initialized');
  }

  async generateContent(prompt, sceneIndex = null, jobId = null, isTest = false) {
    /*logger.info(`Generating image content: ${prompt}`, {
      sceneIndex,
      jobId,
      isTest
    });*/
    if (!this.service) {
      throw new Error('Image Service not initialized');
    }
    return await this.service.generateImage(prompt, sceneIndex, jobId, isTest);
  }

  async process(prompt, sceneIndex = null, jobId = null, isTest = false) {
    logger.info(`Processing image generation request: ${prompt}`);
    if (!this.service) {
      throw new Error('Image Service not initialized');
    }
    return await this.generateContent(prompt, sceneIndex, jobId, isTest);
  }

  async cleanup() {
    logger.info('Cleaning up ImageServiceInterface');
    if (this.service) {
      await this.service.close();
    }
  }

  startServer() {
    const env = process.env.NODE_ENV || 'development';
    const envPrefix = env.toUpperCase();
    
    // Get port from environment variables based on environment
    const port = process.env.PORT || 3002;

    const app = createServer(this);
    
    app.use((req, res, next) => {
      logger.info(`Received ${req.method} request on ${req.path}`, {
        environment: env,
        serviceUrl: process.env[`${envPrefix}_IMAGE_SERVICE_URL`]
      });
      next();
    });

    app.listen(port, () => {
      logger.info(`Image Service running in ${env} environment`, {
        port,
        serviceUrl: process.env[`${envPrefix}_IMAGE_SERVICE_URL`]
      });
    });
  }
}

// Create and export a singleton instance
const imageServiceInterface = new ImageServiceInterface();

// Initialize and start the server if this is the main module
if (require.main === module) {
  imageServiceInterface.initialize()
    .then(() => {
      imageServiceInterface.startServer();
    })
    .catch(error => {
      logger.error('Failed to start Image Service:', error);
      process.exit(1);
    });
}

module.exports = imageServiceInterface;