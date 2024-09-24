const AnimationGenService = require('./animation-gen-service');

class AnimationServiceInterface {
  constructor() {
    this.service = AnimationGenService;
  }

  async initialize() {
    await this.service.init();
  }

  async process(imagePath, outputPath, options = {}) {
    return await this.service.generateAnimation(imagePath, outputPath, options);
  }

  async cleanup() {
    // Add any cleanup logic here if needed
  }
}

module.exports = new AnimationServiceInterface();