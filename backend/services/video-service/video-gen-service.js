const LumaAI = require('lumaai');
const axios = require('axios');
const config = require('../../shared/utils/config');
const logger = require('../../shared/utils/logger');
const fs = require('fs').promises;
const fsSync = require('fs');
const FormData = require('form-data');
const path = require('path');
const VideoDataAccess = require('./data/videoDataAccess');
const storageService = require('../../shared/utils/storage');
const StorageUrlHelper = require('../../shared/utils/storage-url-helper');

class VideoGenService {
  constructor() {
    this.client = new LumaAI({
      authToken: config.videoGen.apiKey,
    });
    this.supportedCameraMotions = [];
    this.dataAccess = VideoDataAccess;
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
    if (!prompt) return '';

    // List of sensitive terms and their replacements
    const sensitiveTerms = {
      'Donald Trump': 'person',
      'Trump': 'person',
      'Biden': 'person',
      'Putin': 'person',
      'Hitler': 'historical figure',
      'Stalin': 'historical figure',
      'lifeline': 'core',  // Keep this replacement
      // Add other sensitive terms as needed
    };

    let sanitizedPrompt = prompt;

    // Replace sensitive terms
    for (const [term, replacement] of Object.entries(sensitiveTerms)) {
      const regex = new RegExp(term, 'gi');
      sanitizedPrompt = sanitizedPrompt.replace(regex, replacement);
    }

    // Remove any remaining potentially problematic content
    sanitizedPrompt = sanitizedPrompt
      .replace(/[^\w\s.,;:!?()'"]/g, '') // Remove special characters
      .trim();

    logger.info('Sanitized video prompt:', {
      original: prompt,
      sanitized: sanitizedPrompt
    });

    return sanitizedPrompt;
  }

  async downloadImageFromUrl(imageUrl) {
    try {
      logger.info(`Downloading image from URL: ${imageUrl}`);
      const response = await axios({
        method: 'get',
        url: imageUrl,
        responseType: 'arraybuffer'
      });
      return Buffer.from(response.data);
    } catch (error) {
      logger.error('Error downloading image from URL:', error);
      throw error;
    }
  }

  async uploadImageToPicsur(imageBuffer, fileName) {
    try {
      logger.info('Uploading image to Picsur');
      const formData = new FormData();
      formData.append('image', imageBuffer, fileName);

      const response = await axios.post('https://picsur.org/api/image/upload', formData, {
        headers: {
          ...formData.getHeaders(),
        },
      });

      if (response.data.success) {
        const imageId = response.data.data.id;
        const imageUrl = `https://picsur.org/i/${imageId}.jpg`;
        logger.info(`Image uploaded successfully to Picsur. URL: ${imageUrl}`);
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
      const promptDir = path.join(config.output.directory, 'video', dateString, promptOrTestFolder, `scene_${sceneIndex}`);
      videoFilePath = path.join(promptDir, `video_scene_${sceneIndex}.mp4`);
      metadataPath = path.join(promptDir, 'metadata.json');
    }

    return { videoFilePath, metadataPath };
  }

  async generateVideo(imageUrl, videoPrompt, cameraMovement, aspectRatio, sceneIndex, promptOrTestFolder, isTest = false) {
    try {
      logger.info(`Generating video with the following parameters:`);
      logger.info(`Image URL: ${imageUrl}`);
      logger.info(`Video Prompt: ${videoPrompt}`);
      logger.info(`Camera Movement: ${cameraMovement}`);
      logger.info(`Aspect Ratio: ${aspectRatio}`);
      logger.info(`Scene Index: ${sceneIndex}`);
      logger.info(`Is Test: ${isTest}`);

      const freshImageUrl = await StorageUrlHelper.getFreshUrl(imageUrl);
      const imageBuffer = await this.downloadImageFromUrl(freshImageUrl);
      
      const picsurUrl = await this.uploadImageToPicsur(imageBuffer, `scene_${sceneIndex}.jpg`);
      logger.info(`Image uploaded to Picsur: ${picsurUrl}`);

      const sanitizedPrompt = this.sanitizeVideoPrompt(videoPrompt);
      logger.info(`Sanitized Video Prompt: ${sanitizedPrompt}`);

      const requestPayload = {
        prompt: sanitizedPrompt,
        aspect_ratio: aspectRatio,
        camera_motion: cameraMovement,
        keyframes: {
          frame0: {
            type: 'image',
            url: picsurUrl,
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
          const videoUrl = videoGeneration.assets.video;
          const { videoFilePath, metadataPath } = this.getOutputPaths(promptOrTestFolder, sceneIndex, isTest);
          await this.downloadVideo(videoUrl, videoFilePath);

          let storageResult;  // Declare storageResult at the top of the block
          let result;         // Declare result to store what we'll return

          if (isTest) {
            // For test mode, save metadata directly to file
            await this.saveVideoMetadata(metadataPath, sceneIndex, {
              videoPrompt: sanitizedPrompt,
              cameraMovement,
              aspectRatio,
              fileName: path.basename(videoFilePath)
            });

            result = {
              filePath: videoFilePath,
              fileName: path.basename(videoFilePath),
              metadata: {
                generationId: generation.id,
                sourceImageUrl: freshImageUrl,
                generationDuration: elapsedTime,
                generatedAt: new Date().toISOString()
              }
            };
          } else {
            // Upload to storage and save to database
            storageResult = await storageService.uploadFile(videoFilePath, 'video');
            logger.info('Video uploaded to storage successfully');

            await this.dataAccess.createVideoOutput(
              promptOrTestFolder,
              sceneIndex,
              {
                fileName: path.basename(videoFilePath),
                tempFilePath: videoFilePath,
                videoPrompt: sanitizedPrompt,
                cameraMovement,
                aspectRatio,
                storage_key: storageResult.storageKey,
                public_url: storageResult.url,
                metadata: {
                  generationId: generation.id,
                  sourceImageUrl: freshImageUrl,
                  generationDuration: elapsedTime,
                  generatedAt: new Date().toISOString()
                }
              }
            );

            result = {
              filePath: videoFilePath,
              fileName: path.basename(videoFilePath),
              storage_key: storageResult.storageKey,
              public_url: storageResult.url,
              metadata: {
                generationId: generation.id,
                sourceImageUrl: freshImageUrl,
                generationDuration: elapsedTime,
                generatedAt: new Date().toISOString()
              }
            };
          }

          logger.info(`Video downloaded successfully: ${videoFilePath}`);
          return result;
        } else if (videoGeneration.state === 'failed') {
          const errorMessage = `Video generation failed: ${videoGeneration.failure_reason || 'Unknown error'}`;
          logger.error(errorMessage);
          return {
            error: true,
            details: errorMessage,
            generationId: generation.id,
            state: videoGeneration.state,
            failure_reason: videoGeneration.failure_reason
          };
        }

        // Wait for 20 seconds before checking again
        await new Promise(resolve => setTimeout(resolve, 20000));
      }
    } catch (error) {
      const errorMessage = error.message || 'Unknown error occurred';
      logger.error('Error in video generation:', {
        error: errorMessage,
        stack: error.stack,
        details: error.response?.data || error
      });
      return {
        error: true,
        details: errorMessage,
        originalError: error
      };
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

  // Database access methods (only used in production mode)
  async getVideosByJobId(jobId) {
    return await this.dataAccess.getVideosByJobId(jobId);
  }

  async getVideoBySceneId(sceneId) {
    return await this.dataAccess.getVideoBySceneId(sceneId);
  }

  async updateVideoMetadata(videoId, metadata) {
    return await this.dataAccess.updateVideoMetadata(videoId, metadata);
  }

  async deleteVideo(videoId) {
    return await this.dataAccess.deleteVideo(videoId);
  }

  async cleanup() {
    // Add any cleanup logic if needed
    logger.info('Video Generation Service cleanup completed');
  }
}

module.exports = VideoGenService;