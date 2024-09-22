const { Midjourney } = require('midjourney');
const config = require('../../shared/utils/config');
const logger = require('../../shared/utils/logger');
const fs = require('fs').promises;
const path = require('path');
const puppeteer = require('puppeteer');

class ImageGenService {
  constructor() {
    logger.info('Constructing ImageGenService');
    this.client = new Midjourney({
      ServerId: config.imageGen.serverId,
      ChannelId: config.imageGen.channelId,
      SalaiToken: config.imageGen.salaiToken,
      Debug: false,
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

  async generateImage(prompt, outputDir, sceneIndex) {
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
      const originalImageUrl = result.uri;
      
      const selectedVariationUrl = this.getRandomVariationUrl(originalImageUrl);
      logger.info(`Selected variation URL: ${selectedVariationUrl}`);

      const imageFileName = `scene_${sceneIndex + 1}_image.png`;
      const imageFilePath = path.join(outputDir, imageFileName);
      await this.downloadImageWithPuppeteer(selectedVariationUrl, imageFilePath);
      
      await this.saveImageMetadata(outputDir, sceneIndex, originalImageUrl, selectedVariationUrl, imageFileName);

      return {
        originalUrl: originalImageUrl,
        imageUrl: selectedVariationUrl,
        filePath: imageFilePath,
        fileName: imageFileName
      };
    } catch (error) {
      logger.error('Error generating image:', error);
      throw error;
    }
  }

  getRandomVariationUrl(originalUrl) {
    const urlParts = originalUrl.split('/');
    const filename = urlParts[urlParts.length - 1].split('?')[0];
    const match = filename.match(/.*_([a-f0-9-]+)\.png$/);
    if (!match) {
      throw new Error('Unable to extract identifier from URL');
    }
    const identifier = match[1];
    const randomVariation = Math.floor(Math.random() * 4); // 0, 1, 2, or 3
    return `https://cdn.midjourney.com/${identifier}/0_${randomVariation}.png`;
  }

  async downloadImageWithPuppeteer(url, outputPath) {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    
    try {
      await page.goto(url, { waitUntil: 'networkidle2' });
      await page.waitForSelector('img');
      const viewSource = await page.goto(url);
      const buffer = await viewSource.buffer();
      await fs.writeFile(outputPath, buffer);
      logger.info(`Image downloaded successfully to ${outputPath}`);
    } catch (error) {
      logger.error('Error downloading image:', error);
      throw error;
    } finally {
      await browser.close();
    }
  }

  async saveImageMetadata(outputDir, sceneIndex, originalUrl, imageUrl, fileName) {
    const metadataPath = path.join(outputDir, 'metadata.json');
    let metadata = {};

    try {
      const data = await fs.readFile(metadataPath, 'utf8');
      metadata = JSON.parse(data);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        logger.error('Error reading metadata:', error);
      }
    }

    metadata[`scene_${sceneIndex + 1}`] = { 
      originalUrl, 
      imageUrl,
      fileName
    };

    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
    logger.info(`Metadata saved for scene ${sceneIndex + 1}`);
  }

  async close() {
    if (this.initialized) {
      await this.client.Close();
      this.initialized = false;
      logger.info('Midjourney connection closed');
    }
  }
}

module.exports = new ImageGenService();