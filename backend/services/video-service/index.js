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

  async process(imageUrl, videoPrompt, cameraMovement, aspectRatio, sceneIndex, jobId, isTest = false, model = config.videoGen.model) {
    logger.info('Processing video generation request', {
      imageUrl,
      videoPrompt,
      cameraMovement,
      aspectRatio,
      sceneIndex,
      jobId,
      isTest,
      model
    });

    return await this.service.generateVideo(
      imageUrl,
      videoPrompt,
      cameraMovement,
      aspectRatio,
      sceneIndex,
      jobId,
      isTest,
      model
    );
  }

  // Database access methods
  async getVideosByJobId(jobId) {
    return await this.service.getVideosByJobId(jobId);
  }

  async getVideoBySceneId(sceneId) {
    return await this.service.getVideoBySceneId(sceneId);
  }

  async updateVideoMetadata(videoId, metadata) {
    return await this.service.updateVideoMetadata(videoId, metadata);
  }

  async deleteVideo(videoId) {
    return await this.service.deleteVideo(videoId);
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

    const PORT = process.env.VIDEO_SERVICE_PORT || 3005;
    const app = createServer(videoServiceInterface);

    app.listen(PORT, () => {
      logger.info(`Video Service running on port ${PORT}`);
      logger.info(`http://localhost:${PORT}`);
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