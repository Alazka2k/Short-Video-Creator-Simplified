const logger = require('../../shared/utils/logger');
const axios = require('axios');
const sharp = require('sharp');
const fs = require('fs').promises;
const MidjourneyClient = require('./clients/midjourney-client');
const ImageDownloader = require('./utils/image-downloader');
const FileManager = require('./utils/file-manager');
const ImageDataAccess = require('./data/imageDataAccess');
const storageService = require('../../shared/utils/storage');
const path = require('path');
const config = require('../../shared/utils/config');

// By moving pendingJobs to the module scope, its state is no longer tied to
// a specific instance of ImageGenService. This prevents a re-initialization
// from one request wiping out the state of other in-flight requests.
const pendingJobs = new Map();

class ImageGenService {
  constructor() {
    logger.info('Constructing ImageGenService');
    this.client = new MidjourneyClient();
    this.downloader = new ImageDownloader();
    this.fileManager = new FileManager();
    this.imageDataAccess = ImageDataAccess;
  }

  async isHealthy() {
    return await this.client.isConnected();
  }

  async generateImage(prompt, sceneIndex = null, jobId = null, userId = null) {
    if (!jobId) throw new Error('jobId is required for asynchronous image generation');
    if (!prompt) throw new Error('Prompt is required for image generation');

    const jobKey = `${jobId}_${sceneIndex}`;
    logger.info(`Queueing image generation for: ${jobKey}`);

    return new Promise(async (resolve, reject) => {
      // Store the video prompt and parameters along with the promise
      pendingJobs.set(jobKey, { resolve, reject, sceneIndex, jobId, videoPrompt: prompt.video_prompt, parameters: prompt.parameters });

      try {
        await this.client.generateImage(prompt.image_prompt, jobId, sceneIndex);
      } catch (error) {
        logger.error(`[ImageGenService] Error starting image generation for ${jobKey}:`, error);
        pendingJobs.delete(jobKey);
        reject(error);
      }
    });
  }

  async handleWebhook(jobId, sceneId, payload) {
    const jobKey = `${jobId}_${sceneId}`;
    const jobPromise = pendingJobs.get(jobKey);

    if (!jobPromise) {
      logger.warn(`Received webhook for an unknown or completed job: ${jobKey}`);
      return;
    }

    try {
      // Forward progress to job-service
      await axios.post(`${config.services.job.url}/progress/update`, {
        jobId,
        sceneId,
        service: 'image',
        status: payload.progress < 100 ? 'in_progress' : 'completed',
        progress: payload.progress,
        metadata: { imageUrl: payload.image_url }
      });

      if (payload.success === false) {
        throw new Error(payload.error?.message || 'Image generation failed in webhook.');
      }

      if (payload.progress === 100) {
        logger.info(`Generation complete for ${jobKey}. Processing final image.`);
        //logger.info(`[DEBUG] Received full payload from AceData for ${jobKey}:`, payload);
        
        // With split_images: false, we use image_url for the grid.
        const gridImageUrl = payload.image_url;

        if (!gridImageUrl) {
          throw new Error('Could not determine a valid grid image URL from the webhook payload.');
        }

        logger.info(`Grid image URL '${gridImageUrl}' will be used for download and cropping.`);
        
        const result = {
          uri: gridImageUrl,
          id: payload.image_id,
          actions: payload.actions,
          prompt: payload.prompt, 
        };
        
        const finalResult = await this.processGeneratedImage(result, sceneId, jobId);

        // --- Report image completion back to job-service ---
        try {
          logger.info(`Reporting final image result back to job-service for ${jobKey}`);
          await axios.post(`${config.services.job.url}/internal/job/${jobId}/scene/${sceneId}/result`, {
            service: 'image',
            status: 'completed',
            data: finalResult
          });
          logger.info(`Successfully reported image completion for ${jobKey}`);
        } catch (reportError) {
          logger.error(`Failed to report image completion back to job-service for ${jobKey}:`, reportError);
          // Do not re-throw; we have the image, the job can technically continue.
        }
        // --- End Reporting ---

        jobPromise.resolve(finalResult);

        // --- Trigger Visualization ---
        if (jobPromise.parameters && !jobPromise.parameters.serviceConfig.skipVisualization) {
          const visualizationType = jobPromise.parameters.visualizationType;
          logger.info(`[ImageGenService] Triggering '${visualizationType}' generation for completed image job: ${jobKey}`);

          try {
            if (visualizationType === 'video') {
              await axios.post(`${config.services.video.url}/generate`, {
                imageUrl: finalResult.publicUrl,
                videoPrompt: jobPromise.videoPrompt,
                sceneId: sceneId,
                jobId: jobId,
                parameters: jobPromise.parameters.videoGenParams
              });
            } else if (visualizationType === 'animation') {
              await axios.post(`${config.services.animation.url}/process`, {
                imageUrl: finalResult.publicUrl,
                prompt: jobPromise.videoPrompt, // Animation service uses 'prompt'
                sceneId: sceneId,
                jobId: jobId,
                parameters: jobPromise.parameters.animationGenParams
              });
            }
            logger.info(`[ImageGenService] Successfully requested ${visualizationType} generation for ${jobKey}`);
          } catch (visError) {
            logger.error(`[ImageGenService] Failed to trigger ${visualizationType} generation for ${jobKey}:`, visError);
            // Report the visualization failure back to the job service
            await axios.post(`${config.services.job.url}/internal/job/${jobId}/scene/${sceneId}/result`, {
              service: visualizationType,
              status: 'failed',
              data: { error: visError.message }
            });
          }
        }
        // --- End Trigger Visualization ---

        pendingJobs.delete(jobKey);
      }
    } catch (error) {
      logger.error(`[ImageGenService] Error processing webhook for ${jobKey}:`, {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });

      await axios.post(`${config.services.job.url}/progress/update`, {
        jobId,
        sceneId,
        service: 'image',
        status: 'failed',
        progress: 100,
        metadata: { error: error.message }
      }).catch(e => logger.error(`Failed to report failure to job service for ${jobKey}`, e));
      
      jobPromise.reject(error);
      pendingJobs.delete(jobKey);
    }
  }

  async processGeneratedImage(result, sceneIndex, jobId) {
    const gridImageUrl = result.uri;
    const prompt = result.prompt;
    const gridId = result.id;

    const { imageFilePath, metadataPath } = this.fileManager.getOutputPaths(sceneIndex, jobId);
    
    // Download grid to a temporary path to avoid overwriting issues
    const tempGridPath = `${imageFilePath}.grid.png`;
    await this.downloader.downloadImage(gridImageUrl, tempGridPath);

    // --- Start Cropping Logic ---
    logger.info(`Cropping grid image for job ${jobId}, scene ${sceneIndex}`);
    const image = sharp(tempGridPath);
    const metadata = await image.metadata();
    const { width, height } = metadata;

    const quadrantWidth = Math.floor(width / 2);
    const quadrantHeight = Math.floor(height / 2);

    const quadrants = [
        { left: 0,               top: 0,                width: quadrantWidth, height: quadrantHeight }, // Top-left
        { left: quadrantWidth,   top: 0,                width: quadrantWidth, height: quadrantHeight }, // Top-right
        { left: 0,               top: quadrantHeight,   width: quadrantWidth, height: quadrantHeight }, // Bottom-left
        { left: quadrantWidth,   top: quadrantHeight,   width: quadrantWidth, height: quadrantHeight }  // Bottom-right
    ];

    const quadrantIndex = Math.floor(Math.random() * 4);
    const selectedQuadrant = quadrants[quadrantIndex];
    logger.info(`Selected quadrant ${quadrantIndex + 1}/4 for cropping.`);

    await image.extract(selectedQuadrant).toFile(imageFilePath);
    await fs.unlink(tempGridPath);
    logger.info(`Cropped image saved to ${imageFilePath}`);
    // --- End Cropping Logic ---
    
    const storageResult = await storageService.uploadFile(imageFilePath, 'image');
    
    await this.fileManager.saveMetadata(metadataPath, sceneIndex, {
      prompt,
      gridId,
      gridImageUrl: gridImageUrl,
      croppedImageUrl: storageResult.url,
      generatedAt: new Date().toISOString()
    });

    const imageData = this.prepareImageData(imageFilePath, storageResult.url, storageResult, prompt);
    const imageRecord = await this.imageDataAccess.createImageOutput(jobId, sceneIndex, imageData);

    return this.prepareResponse(imageFilePath, storageResult.url, storageResult, imageRecord);
  }

  prepareImageData(imageFilePath, imageUrl, storageResult, prompt) {
    return {
      tempFilePath: imageFilePath,
      imageUrl,
      storageKey: storageResult.storageKey,
      publicUrl: storageResult.url,
      metadata: {
        prompt,
        generatedAt: new Date().toISOString()
      }
    };
  }

  prepareResponse(imageFilePath, imageUrl, storageResult, imageRecord) {
    return {
      filePath: imageFilePath,
      fileName: path.basename(imageFilePath),
      imageUrl: imageUrl, // Pass the cropped image URL
      storageKey: storageResult.storageKey,
      publicUrl: storageResult.url,
      status: 'completed',
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