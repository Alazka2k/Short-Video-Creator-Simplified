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

  sanitizeVideoPrompt(prompt) {
    const sanitizationRules = [
      { regex: /\b(lifeline)\b/gi, replacement: "core" },
      // Add more rules as needed
    ];

    let sanitizedPrompt = prompt;
    sanitizationRules.forEach(rule => {
      sanitizedPrompt = sanitizedPrompt.replace(rule.regex, rule.replacement);
    });

    return sanitizedPrompt;
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

  getOutputPaths(promptOrTestFolder, sceneIndex, isTest) {
    let videoFilePath, metadataPath;

    if (isTest) {
      const testOutputDir = path.join(__dirname, '..', '..', '..', 'tests', 'test_output', 'video', promptOrTestFolder);
      videoFilePath = path.join(testOutputDir, `video_scene_${sceneIndex}.mp4`);
      metadataPath = path.join(testOutputDir, 'metadata.json');
    } else {
      const currentDate = new Date();
      const dateString = currentDate.toISOString().split('T')[0];
      const timeString = currentDate.toTimeString().split(' ')[0].replace(/:/g, '-');
      const promptDir = path.join(config.output.directory, 'video', `${dateString}_${timeString}`, promptOrTestFolder);
      videoFilePath = path.join(promptDir, `video_scene_${sceneIndex}.mp4`);
      metadataPath = path.join(promptDir, 'metadata.json');
    }

    return { videoFilePath, metadataPath };
  }

  async generateVideo(imagePath, videoPrompt, cameraMovement, aspectRatio, sceneIndex, promptOrTestFolder, isTest = false) {
    try {
      logger.info(`Generating video with the following parameters:`);
      logger.info(`Image Path: ${imagePath}`);
      logger.info(`Video Prompt: ${videoPrompt}`);
      logger.info(`Camera Movement: ${cameraMovement}`);
      logger.info(`Aspect Ratio: ${aspectRatio}`);
      logger.info(`Scene Index: ${sceneIndex}`);
      logger.info(`Is Test: ${isTest}`);

      const sanitizedPrompt = this.sanitizeVideoPrompt(videoPrompt);
      logger.info(`Sanitized Video Prompt: ${sanitizedPrompt}`);

      const imageUrl = await this.uploadImageToPicsur(imagePath);

      const requestPayload = {
        prompt: sanitizedPrompt,
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
          const { videoFilePath, metadataPath } = this.getOutputPaths(promptOrTestFolder, sceneIndex, isTest);
          await this.downloadVideo(videoGeneration.assets.video, videoFilePath);
          await this.saveVideoMetadata(metadataPath, sceneIndex, {
            videoPrompt: sanitizedPrompt,
            cameraMovement,
            aspectRatio,
            fileName: path.basename(videoFilePath)
          });
          logger.info(`Video downloaded successfully: ${videoFilePath}`);
          return {
            filePath: videoFilePath,
            fileName: path.basename(videoFilePath)
          };
        } else if (videoGeneration.state === 'failed') {
          throw new Error(`Video generation failed: ${videoGeneration.failure_reason}`);
        }

        // Wait for 20 seconds before checking again
        await new Promise(resolve => setTimeout(resolve, 20000));
      }
    } catch (error) {
      logger.error('Error generating video:', error);
      return { error: 'Video generation failed', details: error.message };
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

      await fs.mkdir(path.dirname(outputPath), { recursive: true });
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

  async saveVideoMetadata(metadataPath, sceneIndex, data) {
    let metadata = {};
    try {
      const existingData = await fs.readFile(metadataPath, 'utf8');
      metadata = JSON.parse(existingData);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        logger.error('Error reading metadata:', error);
      }
    }

    metadata[`scene_${sceneIndex}`] = data;

    await fs.mkdir(path.dirname(metadataPath), { recursive: true });
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
    logger.info(`Metadata saved to ${metadataPath}`);
  }

  async cleanup() {
    // Add any cleanup logic if needed
    logger.info('Video Generation Service cleanup completed');
  }
}

module.exports = VideoGenService;