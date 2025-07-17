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
const ImageHelper = require('../../shared/utils/image-helper');
const os = require('os');

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
    logger.info(`Using Luma AI Model: ${config.videoGen.model}`);
    logger.info(`Using Luma AI Resolution: ${config.videoGen.resolution}`);
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
      //logger.info(`Fetched supported camera motions: ${JSON.stringify(this.supportedCameraMotions)}`);
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
      const safeError = {
        message: error.message,
        code: error.code,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data ? (
          typeof error.response.data === 'string' 
            ? error.response.data.substring(0, 500) 
            : 'Binary data not shown'
        ) : undefined
      };
      logger.error('Error downloading image from URL:', safeError);
      throw new Error(`Failed to download image: ${error.message}`);
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

  getOutputPaths(jobId, sceneId, isTest) {
    let videoFilePath, metadataPath;
    const jobIdentifier = String(isTest ? 'test' : jobId);

    if (isTest) {
      const testOutputDir = path.join(__dirname, '..', '..', '..', 'tests', 'test_output', 'video', jobIdentifier);
      videoFilePath = path.join(testOutputDir, `video_scene_${sceneId}.mp4`);
      metadataPath = path.join(testOutputDir, 'metadata.json');
    } else {
      const currentDate = new Date();
      const dateString = currentDate.toISOString().split('T')[0];
      // Use a job-specific directory to organize outputs
      const jobDir = path.join(config.output.directory, 'video', dateString, jobIdentifier);
      const sceneDir = path.join(jobDir, `scene_${sceneId}`);
      videoFilePath = path.join(sceneDir, `video_scene_${sceneId}.mp4`);
      metadataPath = path.join(sceneDir, 'metadata.json');
    }

    return { videoFilePath, metadataPath };
  }

  async reportProgress(jobId, sceneId, status, progress, metadata = {}) {
    try {
      await axios.post(`${config.services.job.url}/progress/update`, {
        jobId,
        sceneId,
        service: 'video',
        status,
        progress,
        metadata
      });
    } catch (error) {
      logger.error(`Failed to report video progress to job service for job ${jobId}, scene ${sceneId}:`, {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      // This is non-fatal, so we don't re-throw.
    }
  }

  async generateVideo(imageUrl, videoPrompt, cameraMovement, aspectRatio, sceneId, jobId, isTest = false) {
    let tempFiles = [];
    try {
      // Report that the service has started
      await this.reportProgress(jobId, sceneId, 'in_progress', 5);

      logger.info(`Generating video with the following parameters:`);
      logger.info(`Model: ${config.videoGen.model}`);
      logger.info(`Resolution: ${config.videoGen.resolution}`);
      logger.info(`Image URL: ${imageUrl}`);
      
      // Only log these parameters for ray-1.5
      if (config.videoGen.model === 'ray-1.5') {
        logger.info(`Video Prompt: ${videoPrompt}`);
        logger.info(`Camera Movement: ${cameraMovement}`);
        logger.info(`Aspect Ratio: ${aspectRatio}`);
      }
      
      logger.info(`Scene ID: ${sceneId}`);
      logger.info(`Is Test: ${isTest}`);

      // Get fresh URL if it's an S3 URL
      const freshImageUrl = await StorageUrlHelper.getFreshUrl(imageUrl);
      logger.info(`Using fresh image URL: ${freshImageUrl}`);

      // Download the image using ImageHelper
      let tempImagePath;
      try {
        const imageBuffer = await ImageHelper.downloadImageFromUrl(freshImageUrl);
        
        // Create temp file for the image
        const tempDir = path.join(os.tmpdir(), 'video-service', 'temp');
        await fs.mkdir(tempDir, { recursive: true });
        tempImagePath = path.join(tempDir, `scene_${sceneId}_input.jpg`);
        await fs.writeFile(tempImagePath, imageBuffer);
        tempFiles.push(tempImagePath);
      } catch (error) {
        logger.error('Failed to download image:', {
          url: freshImageUrl,
          error: error.message
        });
        throw new Error(`Failed to download image: ${error.message}`);
      }

      // Upload to our S3 storage and get a fresh URL
      logger.info('Uploading image to storage...');
      const uploadResult = await storageService.uploadFile(tempImagePath, 'video-input');
      const lumaImageUrl = await storageService.getSignedUrl(uploadResult.storageKey, 3600); // 1 hour expiry
      logger.info(`Image uploaded successfully, URL: ${lumaImageUrl}`);

      let requestPayload = {
        model: config.videoGen.model,
        resolution: config.videoGen.resolution,
        keyframes: {
          frame0: {
            type: 'image',
            url: lumaImageUrl,
          },
        },
      };

      // Add additional parameters only for ray-1.5
      if (config.videoGen.model === 'ray-1.5') {
        const sanitizedPrompt = this.sanitizeVideoPrompt(videoPrompt);
        logger.info(`Sanitized Video Prompt: ${sanitizedPrompt}`);
        
        requestPayload = {
          ...requestPayload,
          prompt: sanitizedPrompt,
          aspect_ratio: aspectRatio,
          camera_motion: cameraMovement,
        };
      }

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

        logger.info(`Generation status update (${Math.floor(elapsedTime / 1000)}s elapsed):`, {
          id: videoGeneration.id,
          state: videoGeneration.state,
        });

        if (videoGeneration.state === 'completed') {
          await this.reportProgress(jobId, sceneId, 'completed', 100);
          const videoUrl = videoGeneration.assets.video;
          const { videoFilePath } = this.getOutputPaths(jobId, sceneId, isTest);
          await this.downloadVideo(videoUrl, videoFilePath);
          tempFiles.push(videoFilePath);

          const storageResult = await storageService.uploadFile(videoFilePath, 'video');
          logger.info('Video uploaded to storage successfully');

          const videoRecord = await this.dataAccess.createVideoOutput(jobId, sceneId, {
            videoPath: videoFilePath,
            videoUrl: storageResult.url,
            storageKey: storageResult.storageKey,
            publicUrl: storageResult.url,
            metadata: {
              prompt: videoPrompt,
              lumaGenerationId: generation.id,
              generatedAt: new Date().toISOString()
            }
          });

          const result = {
            filePath: videoFilePath,
            fileName: path.basename(videoFilePath),
            videoUrl: storageResult.url,
            storageKey: storageResult.storageKey,
            publicUrl: storageResult.url,
            status: 'completed',
            metadata: typeof videoRecord.metadata === 'string' 
              ? JSON.parse(videoRecord.metadata) 
              : videoRecord.metadata
          };

          // --- Report video completion back to job-service ---
          try {
            logger.info(`Reporting final video result back to job-service for job ${jobId}, scene ${sceneId}`);
            await axios.post(`${config.services.job.url}/internal/job/${jobId}/scene/${sceneId}/result`, {
              service: 'video',
              status: 'completed',
              data: result
            });
            logger.info(`Successfully reported video completion for job ${jobId}, scene ${sceneId}`);
          } catch (reportError) {
            logger.error(`Failed to report video completion back to job-service for job ${jobId}, scene ${sceneId}:`, reportError);
            // Non-fatal, as the video is generated and saved.
          }
          // --- End Reporting ---

          return result;
        } else if (videoGeneration.state === 'failed') {
          const failureReason = videoGeneration.failure_reason || 'Video generation failed without a specific reason.';
          await this.reportProgress(jobId, sceneId, 'failed', 100, { error: failureReason });
          throw new Error(failureReason);
        }

        // Wait before checking again
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    } catch (error) {
      logger.error(`Error in video generation for job ${jobId}, scene ${sceneId}:`, {
        message: error.message,
        stack: error.stack?.substring(0, 1000) // Log a portion of the stack
      });

      // Report failure back to job-service
      try {
        // We still report the final result for stitching, even on failure
        await axios.post(`${config.services.job.url}/internal/job/${jobId}/scene/${sceneId}/result`, {
          service: 'video',
          status: 'failed',
          data: { error: error.message }
        });
        logger.info(`Successfully reported video failure back to job-service for job ${jobId}, scene ${sceneId}`);
      } catch (reportError) {
        logger.error(`Failed to report video failure back to job-service for job ${jobId}, scene ${sceneId}:`, reportError);
      }
      
      // Do not re-throw, which prevents the service from crashing.
    } finally {
      // Clean up all temp files
      for (const file of tempFiles) {
        try {
          await fs.unlink(file);
          logger.info(`Temporary file removed: ${file}`);
        } catch (unlinkError) {
          logger.warn(`Failed to remove temporary file: ${file}`, unlinkError);
        }
      }
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

  async saveVideoMetadata(metadataPath, sceneId, data) {
    let metadata = {};
    try {
      const existingData = await fs.readFile(metadataPath, 'utf8');
      metadata = JSON.parse(existingData);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        logger.error('Error reading metadata:', error);
      }
    }

    metadata[`scene_${sceneId}`] = data;

    await fs.mkdir(path.dirname(metadataPath), { recursive: true });
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
    //logger.info(`Metadata saved to ${metadataPath}`);
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