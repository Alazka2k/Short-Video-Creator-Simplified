const VideoGenService = require('./video-gen-service');
const createServer = require('./server');
const logger = require('../../shared/utils/logger');
const config = require('../../shared/utils/config');

class VideoServiceInterface {
  constructor() {
    logger.info('Initializing VideoServiceInterface');
    this.service = new VideoGenService();
  }

  async initialize() {
    logger.info('VideoServiceInterface initializing');
    await this.service.initialize();
    logger.info('VideoServiceInterface initialized');
  }

  async process(imagePath, videoPrompt, cameraMovement, aspectRatio, sceneIndex, isTest = false) {
    logger.info('Processing video generation request', { imagePath, videoPrompt, cameraMovement, aspectRatio, sceneIndex, isTest });
    return await this.service.generateVideo(imagePath, videoPrompt, cameraMovement, aspectRatio, sceneIndex, isTest);
  }

  async cleanup() {
    logger.info('Cleaning up VideoServiceInterface');
    await this.service.cleanup();
  }
}

async function startServer() {
  try {
    logger.info('Starting Video Service');
    const videoServiceInterface = new VideoServiceInterface();
    await videoServiceInterface.initialize();

    const PORT = process.env.VIDEO_SERVICE_PORT || 3006;
    const app = createServer(videoServiceInterface);

    app.listen(PORT, () => {
      logger.info(`Video Service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start Video Service:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = { VideoServiceInterface, startServer };