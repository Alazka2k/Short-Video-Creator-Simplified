const { Midjourney } = require('midjourney');
const config = require('../utils/config');
const logger = require('../utils/logger');

class ImageGenService {
  constructor() {
    logger.info('Constructing ImageGenService');
    this.client = new Midjourney({
      ServerId: config.imageGen.serverId,
      ChannelId: config.imageGen.channelId,
      SalaiToken: config.imageGen.salaiToken,
      Debug: false, // Set to false to reduce logging
      Ws: config.imageGen.ws
    });
    this.initialized = false;
  }

  async init() {
    try {
      logger.info('Initializing Midjourney client...');
      await this.client.init();
      this.initialized = true;
      logger.info('Midjourney client initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Midjourney client:', error);
      throw error;
    }
  }

  async generateImage(prompt) {
    if (!this.initialized) {
      throw new Error('ImageGenService not initialized. Call init() first.');
    }

    try {
      logger.info(`Generating image for prompt: "${prompt}"`);
      const result = await this.client.Imagine(prompt, (uri, progress) => {
        logger.info(`Image generation progress: ${progress}%`);
      });
      
      if (!result) {
        throw new Error('No image generated');
      }

      logger.info('Image generated successfully');
      return result.uri;
    } catch (error) {
      logger.error('Error generating image:', error);
      throw error;
    } finally {
      // Close the Midjourney connection
      await this.client.Close();
      logger.info('Midjourney connection closed');
    }
  }
}

module.exports = new ImageGenService();