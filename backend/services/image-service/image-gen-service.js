const { Midjourney } = require('midjourney');
const config = require('../../shared/utils/config');
const logger = require('../../shared/utils/logger');
const fs = require('fs').promises;
const path = require('path');
const puppeteer = require('puppeteer');
const ImageDataAccess = require('./data/imageDataAccess');

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
    this.imageDataAccess = ImageDataAccess;
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

  async generateImage(prompt, sceneIndex = null, jobId = null) {
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

      const { imageFilePath, metadataPath } = this.getOutputPaths(sceneIndex, jobId);
      await fs.mkdir(path.dirname(imageFilePath), { recursive: true });

      await this.downloadImageWithPuppeteer(selectedVariationUrl, imageFilePath);

      await this.saveImageMetadata(metadataPath, sceneIndex, originalImageUrl, selectedVariationUrl, path.basename(imageFilePath), {
        prompt,
        size: '512x512',
        generatedAt: new Date().toISOString()
      });

      const imageData = {
        tempFilePath: imageFilePath,
        originalUrl: originalImageUrl,
        imageUrl: selectedVariationUrl,
        metadata: {
          prompt,
          size: '512x512',
          generatedAt: new Date().toISOString()
        }
      };

      const imageRecord = await this.imageDataAccess.createImageOutput(jobId, sceneIndex, imageData);

      return {
        filePath: imageFilePath,
        fileName: path.basename(imageFilePath),
        originalUrl: originalImageUrl,
        imageUrl: selectedVariationUrl,
        metadata: typeof imageRecord.metadata === 'string' 
          ? JSON.parse(imageRecord.metadata) 
          : imageRecord.metadata
      };

    } catch (error) {
      logger.error('Error generating image:', error);
      throw error;
    }
  }

  getOutputPaths(sceneIndex, jobId) {
    const currentDate = new Date();
    const dateString = currentDate.toISOString().split('T')[0];
    const folderPath = path.join(config.output.directory, 'image', dateString, jobId, `scene_${sceneIndex}`);
    const imageFilePath = path.join(folderPath, `image_scene_${sceneIndex}.png`);
    const metadataPath = path.join(folderPath, 'metadata.json');

    return { imageFilePath, metadataPath };
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

  async saveImageMetadata(metadataPath, sceneIndex, originalUrl, imageUrl, fileName, metadata) {
    try {
      await fs.mkdir(path.dirname(metadataPath), { recursive: true });
      const metadataContent = {
        [`scene_${sceneIndex}`]: {
          originalUrl,
          imageUrl,
          fileName,
          ...metadata
        }
      };
      await fs.writeFile(metadataPath, JSON.stringify(metadataContent, null, 2));
      logger.info(`Metadata saved to ${metadataPath}`);
    } catch (error) {
      logger.error('Error saving metadata:', error);
      throw error;
    }
  }

  async getImageOutputsForJob(jobId) {
    return await this.imageDataAccess.getImagesByJobId(jobId);
  }

  async getImageOutputForScene(sceneId) {
    return await this.imageDataAccess.getImageBySceneId(sceneId);
  }

  async updateImageMetadata(imageId, metadata) {
    return await this.imageDataAccess.updateImageMetadata(imageId, metadata);
  }

  async deleteImage(imageId) {
    return await this.imageDataAccess.deleteImage(imageId);
  }

  async close() {
    if (this.initialized) {
      await this.client.Close();
      this.initialized = false;
      logger.info('Midjourney connection closed');
    }
  }
}

module.exports = ImageGenService;