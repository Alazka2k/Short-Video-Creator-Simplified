const VideoGenService = require('./video-gen-service');

class VideoServiceInterface {
  constructor() {
    this.service = VideoGenService;
  }

  async initialize() {
    await this.service.initialize();
  }

  async generateVideo(imagePath, videoPrompt, cameraMovement, aspectRatio, outputPath) {
    return await this.service.generateVideo(imagePath, videoPrompt, cameraMovement, aspectRatio, outputPath);
  }

  async cleanup() {
    await this.service.cleanup();
  }
}

module.exports = new VideoServiceInterface();