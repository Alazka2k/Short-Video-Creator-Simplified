const LumaAI = require('lumaai');
const axios = require('axios');
const config = require('../../shared/utils/config');
const logger = require('../../shared/utils/logger');
const fs = require('fs').promises;
const fsSync = require('fs');
const FormData = require('form-data');
const path = require('path');

class VideoGenService {
  constructor() {
    this.client = new LumaAI({
      authToken: config.videoGen.apiKey,
    });
    this.supportedCameraMotions = [];
  }

  async initialize() {
    logger.info('Video Generation Service initializing...');
    logger.info(`Using Luma AI API Key: ${config.videoGen.apiKey.substring(0, 5)}...`);
    await this.fetchSupportedCameraMotions();
    logger.info('Video Generation Service initialized successfully');
  }

  async fetchSupportedCameraMotions() {
    try {
      const response = await axios.get('https://api.lumalabs.ai/dream-machine/v1/generations/camera_motion/list', {
        headers: {
          'accept': 'application/json',
          'authorization': `Bearer ${config.videoGen.apiKey}`
        }
      });
      this.supportedCameraMotions = response.data;
      logger.info(`Fetched supported camera motions: ${JSON.stringify(this.supportedCameraMotions)}`);
    } catch (error) {
      logger.error('Error fetching supported camera motions:', error);
      throw error;
    }
  }

  async uploadImageToPicsur(imagePath) {
    try {
      logger.info(`Uploading image to Picsur: ${imagePath}`);
      const imageBuffer = await fs.readFile(imagePath);
      const formData = new FormData();
      formData.append('image', imageBuffer, path.basename(imagePath));

      const response = await axios.post('https://picsur.org/api/image/upload', formData, {
        headers: {
          ...formData.getHeaders(),
        },
      });

      logger.info(`Picsur upload response: ${JSON.stringify(response.data)}`);

      if (response.data.success) {
        const imageId = response.data.data.id;
        const imageUrl = `https://picsur.org/i/${imageId}.jpg`;
        logger.info(`Image uploaded successfully. URL: ${imageUrl}`);
        return imageUrl;
      } else {
        throw new Error('Image upload failed');
      }
    } catch (error) {
      logger.error('Error uploading image to Picsur:', error);
      throw error;
    }
  }

  async generateVideo(imagePath, videoPrompt, cameraMovement, aspectRatio, outputPath) {
    try {
      logger.info(`Generating video with the following parameters:`);
      logger.info(`Image Path: ${imagePath}`);
      logger.info(`Video Prompt: ${videoPrompt}`);
      logger.info(`Camera Movement: ${cameraMovement}`);
      logger.info(`Aspect Ratio: ${aspectRatio}`);
      logger.info(`Output Path: ${outputPath}`);

      const imageUrl = await this.uploadImageToPicsur(imagePath);

      const requestPayload = {
        prompt: videoPrompt,
        aspect_ratio: aspectRatio,
        camera_motion: cameraMovement,
        keyframes: {
          frame0: {
            type: 'image',
            url: imageUrl,
          },
        },
      };

      logger.info(`Luma AI request payload: ${JSON.stringify(requestPayload, null, 2)}`);

      const generation = await this.client.generations.create(requestPayload);

      logger.info(`Video generation started. Full response: ${JSON.stringify(generation, null, 2)}`);

      const maxWaitTime = 15 * 60 * 1000; // 15 minutes
      const startTime = Date.now();
      let elapsedTime = 0;

      while (true) {
        elapsedTime = Date.now() - startTime;
        if (elapsedTime > maxWaitTime) {
          throw new Error('Video generation timed out after 15 minutes');
        }

        const videoGeneration = await this.client.generations.get(generation.id);
        logger.info(`Generation status update (${Math.floor(elapsedTime / 1000)}s elapsed): ${JSON.stringify(videoGeneration, null, 2)}`);

        if (videoGeneration.state === 'completed') {
          logger.info(`Video generation completed. Full response: ${JSON.stringify(videoGeneration, null, 2)}`);
          await this.downloadVideo(videoGeneration.assets.video, outputPath);
          logger.info(`Video downloaded successfully: ${outputPath}`);
          return outputPath;
        } else if (videoGeneration.state === 'failed') {
          throw new Error(`Video generation failed: ${videoGeneration.failure_reason}`);
        }

        // Wait for 20 seconds before checking again
        await new Promise(resolve => setTimeout(resolve, 20000));
      }
    } catch (error) {
      logger.error('Error generating video:', error);
      throw error;
    }
  }

  async downloadVideo(url, outputPath) {
    try {
      logger.info(`Downloading video from ${url} to ${outputPath}`);
      const response = await axios({
        method: 'get',
        url: url,
        responseType: 'stream'
      });

      const writer = fsSync.createWriteStream(outputPath);
      response.data.pipe(writer);

      return new Promise((resolve, reject) => {
        writer.on('finish', () => {
          logger.info(`Video download completed: ${outputPath}`);
          resolve();
        });
        writer.on('error', (err) => {
          logger.error(`Error writing video to file: ${err}`);
          reject(err);
        });
      });
    } catch (error) {
      logger.error('Error downloading video:', error);
      throw error;
    }
  }

  async cleanup() {
    // Add any cleanup logic if needed
    logger.info('Video Generation Service cleanup completed');
  }
}

module.exports = new VideoGenService();