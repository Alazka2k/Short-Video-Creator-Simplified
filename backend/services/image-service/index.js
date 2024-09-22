// backend/services/image-service/index.js

const ImageGenService = require('./image-gen-service');

class ImageServiceInterface {
  constructor() {
    this.service = ImageGenService;
  }

  async initialize() {
    await this.service.init();
  }

  async process(prompt, outputDir, sceneIndex) {
    return await this.service.generateImage(prompt, outputDir, sceneIndex);
  }

  async cleanup() {
    await this.service.close();
  }
}

module.exports = new ImageServiceInterface();