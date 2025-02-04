const logger = require('../../shared/utils/logger');
const MidjourneyClient = require('./clients/midjourney-client');
const ImageDownloader = require('./utils/image-downloader');
const FileManager = require('./utils/file-manager');
const ImageDataAccess = require('./data/imageDataAccess');
const storageService = require('../../shared/utils/storage');
const path = require('path');

class ImageGenService {
  constructor() {
    logger.info('Constructing ImageGenService');
    this.client = new MidjourneyClient();
    this.downloader = new ImageDownloader();
    this.fileManager = new FileManager();
    this.imageDataAccess = ImageDataAccess;
  }

  async init() {
    await this.client.init();
  }

  async isHealthy() {
    return await this.client.isConnected();
  }

  async generateImage(prompt, sceneIndex = null, jobId = null) {
    try {
      logger.info(`Generating image for prompt: "${prompt}"`, {
        sceneIndex,
        jobId
      });
      
      // Validate required parameters
      if (!prompt) {
        throw new Error('Prompt is required for image generation');
      }

      if (!sceneIndex) {
        sceneIndex = 1; // Default to scene 1 if not provided
      }

      if (!jobId) {
        jobId = Date.now().toString(); // Generate a timestamp-based ID if not provided
      }
      
      const result = await this.client.generateImage(prompt, (uri, progress) => {
        logger.info(`Image generation progress: ${progress}%`);
      });

      if (!result) {
        throw new Error('No image generated');
      }

      return await this.processGeneratedImage(result, prompt, sceneIndex, jobId);
    } catch (error) {
      logger.error('Error generating image:', error);
      throw error;
    }
  }

  async processGeneratedImage(result, prompt, sceneIndex, jobId) {
    const originalImageUrl = result.uri;
    const selectedVariationUrl = this.downloader.getRandomVariationUrl(originalImageUrl);
    
    const { imageFilePath, metadataPath } = this.fileManager.getOutputPaths(sceneIndex, jobId);
    
    await this.downloader.downloadImage(selectedVariationUrl, imageFilePath);
    
    const storageResult = await storageService.uploadFile(imageFilePath, 'image');
    
    await this.fileManager.saveMetadata(metadataPath, sceneIndex, {
      prompt,
      originalUrl: originalImageUrl,
      selectedUrl: selectedVariationUrl,
      generatedAt: new Date().toISOString()
    });

    const imageData = this.prepareImageData(imageFilePath, originalImageUrl, selectedVariationUrl, storageResult, prompt);
    const imageRecord = await this.imageDataAccess.createImageOutput(jobId, sceneIndex, imageData);

    return this.prepareResponse(imageFilePath, originalImageUrl, selectedVariationUrl, storageResult, imageRecord);
  }

  prepareImageData(imageFilePath, originalUrl, imageUrl, storageResult, prompt) {
    return {
      tempFilePath: imageFilePath,
      originalUrl,
      imageUrl,
      storageKey: storageResult.storageKey,
      publicUrl: storageResult.url,
      metadata: {
        prompt,
        generatedAt: new Date().toISOString()
      }
    };
  }

  prepareResponse(imageFilePath, originalUrl, imageUrl, storageResult, imageRecord) {
    return {
      filePath: imageFilePath,
      fileName: path.basename(imageFilePath),
      originalUrl,
      imageUrl,
      storageKey: storageResult.storageKey,
      publicUrl: storageResult.url,
      metadata: typeof imageRecord.metadata === 'string' 
        ? JSON.parse(imageRecord.metadata) 
        : imageRecord.metadata
    };
  }

  async close() {
    await this.client.close();
  }
}

module.exports = ImageGenService;