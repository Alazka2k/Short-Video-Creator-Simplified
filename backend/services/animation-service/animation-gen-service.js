const axios = require('axios');
const config = require('../../shared/utils/config');
const logger = require('../../shared/utils/logger');
const fs = require('fs').promises;
const path = require('path');
const sharp = require('sharp');
const FormData = require('form-data');
const AnimationPatternManager = require('../../shared/utils/pattern/animation-pattern-manager');
const AnimationDataAccess = require('./data/animationDataAccess');
const storageService = require('../../shared/utils/storage');
const StorageUrlHelper = require('../../shared/utils/storage-url-helper');
const ImageHelper = require('../../shared/utils/image-helper');
const os = require('os');

class AnimationGenService {
  constructor() {
    this.baseUrl = 'https://api.immersity.ai';
    this.authUrl = 'https://auth.immersity.ai/auth/realms/immersity/protocol/openid-connect/token';
    this.clientId = config.animationGen.clientId;
    this.clientSecret = config.animationGen.clientSecret;
    this.animationLength = config.animationGen.animationLength;
    this.accessToken = null;
    this.patternManager = new AnimationPatternManager();
    this.dataAccess = AnimationDataAccess;
    logger.info('AnimationGenService constructed');
  }

  async init() {
    try {
      logger.info('Initializing AnimationGenService...');
      await this.getAccessToken();
      await this.patternManager.initialize();
      logger.info('Immersity AI service initialized successfully');
    } catch (error) {
      const errorInfo = {
        message: error.message,
        code: error.code,
        response: error.response ? {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        } : undefined
      };
      logger.error('Failed to initialize Animation Generation Service:', errorInfo);
      throw error;
    }
  }

  async getAccessToken() {
    try {
      logger.info('Acquiring access token from Immersity Login...');
      const params = new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: 'client_credentials',
      });
      
      const response = await axios.post(this.authUrl, params, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });

      this.accessToken = response.data.access_token;
      logger.info('Immersity AI Login AccessToken acquired successfully');
    } catch (error) {
      const errorInfo = {
        message: error.message,
        code: error.code,
        response: error.response ? {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        } : undefined
      };
      logger.error('Error acquiring access token:', errorInfo);
      throw error;
    }
  }

  async convertToJpeg(inputPath, outputPath) {
    try {
      logger.info(`Converting image to JPEG: ${inputPath} -> ${outputPath}`);
      
      // If input is URL, download first
      if (inputPath.startsWith('http')) {
        const response = await axios({
          method: 'get',
          url: inputPath,
          responseType: 'arraybuffer'
        });
        
        await sharp(Buffer.from(response.data))
          .jpeg({ quality: 90 })
          .toFile(outputPath);
      } else {
        await sharp(inputPath)
          .jpeg({ quality: 90 })
          .toFile(outputPath);
      }
      
      logger.info(`Image converted to JPEG successfully: ${outputPath}`);
    } catch (error) {
      const safeError = {
        message: error.message,
        code: error.code,
        response: error.response ? {
          status: error.response.status,
          statusText: error.response.statusText,
          data: typeof error.response.data === 'string' ? error.response.data.substring(0, 500) : 'Response data too large'
        } : undefined
      };
      logger.error('Error converting image to JPEG:', safeError);
      throw error;
    }
  }

  async generateDisparityMap(imagePath) {
    const endpoint = `${this.baseUrl}/api/v1/disparity`;

    try {
      logger.info(`Starting disparity map generation for image: ${imagePath}`);
      
      // Make the image accessible via S3 using the shared helper
      const inputImageUrl = await ImageHelper.makeImageAccessible(imagePath, path.basename(imagePath, path.extname(imagePath)), 'animation-service');
      logger.info(`Using accessible image URL: ${inputImageUrl}`);

      const requestBody = {
        inputImageUrl
      };

      logger.info(`Sending disparity map generation request to: ${endpoint}`);
      logger.info(`Request body for disparity map: ${JSON.stringify(requestBody, null, 2)}`);

      const response = await axios.post(endpoint, requestBody, {
        headers: { 
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      const responseData = {
        correlationId: response.data.correlationId,
        resultPresignedUrl: response.data.resultPresignedUrl
      };
      logger.info(`Disparity map generation response received`);
      logger.info(`Response status: ${response.status}`);
      logger.info(`Response data: ${JSON.stringify(responseData, null, 2)}`);

      return { disparityUrl: response.data.resultPresignedUrl, inputImageUrl };
    } catch (error) {
      const safeError = {
        message: error.message,
        code: error.code,
        response: error.response ? {
          status: error.response.status,
          statusText: error.response.statusText,
          data: typeof error.response.data === 'string' ? error.response.data.substring(0, 500) : 'Response data too large'
        } : undefined
      };
      logger.error(`Error generating disparity map:`, safeError);
      throw error;
    }
  }

  getOutputPaths(promptOrTestFolder, sceneIndex, isTest) {
    if (isTest) {
      const testOutputDir = path.join(__dirname, '..', '..', '..', 'tests', 'test_output', 'animation', promptOrTestFolder);
      const scenePath = path.join(testOutputDir, `scene_${sceneIndex}`);
      const animationFilePath = path.join(scenePath, `animation_scene_${sceneIndex}.mp4`);
      const metadataPath = path.join(scenePath, 'metadata.json');
      return { animationFilePath, metadataPath };
    } else {
      const currentDate = new Date();
      const dateString = currentDate.toISOString().split('T')[0];
      const jobPath = path.join(config.output.directory, 'animation', dateString, promptOrTestFolder);
      const scenePath = path.join(jobPath, `scene_${sceneIndex}`);
      const animationFilePath = path.join(scenePath, `animation_scene_${sceneIndex}.mp4`);
      const metadataPath = path.join(scenePath, 'metadata.json');
      return { animationFilePath, metadataPath };
    }
  }

  async getImageFromUrl(imageUrl) {
    try {
      logger.info('Getting fresh URL for image:', { originalUrl: imageUrl });
      const freshUrl = await StorageUrlHelper.getFreshUrl(imageUrl);
      logger.info('Fresh URL obtained:', { 
        originalUrl: imageUrl,
        isFreshUrlDifferent: freshUrl !== imageUrl 
      });
      return freshUrl;
    } catch (error) {
      logger.error('Error getting fresh URL:', {
        originalUrl: imageUrl,
        error: error.message
      });
      throw new Error(`Failed to get fresh URL for image: ${error.message}`);
    }
  }

  async generateAnimation(imageUrl, videoPrompt, sceneIndex, jobId = null, parameters = {}, isTest = false) {
    logger.info('generateAnimation called with:', { imageUrl, videoPrompt, sceneIndex, jobId, parameters, isTest });
    
    if (!this.accessToken) {
      throw new Error('Animation Generation Service not initialized. Call init() first.');
    }
    
    if (!imageUrl) {
      throw new Error('Image URL is undefined or empty');
    }

    if (!isTest && !jobId) {
      throw new Error('jobId is required for production mode');
    }

    let tempFiles = [];
    try {
      logger.info(`Starting animation generation for image: ${imageUrl}`);
      
      let imageSource = imageUrl;
      if (imageUrl.startsWith('http')) {
        // Get fresh URL if needed
        imageSource = await this.getImageFromUrl(imageUrl);
        logger.info('Using image URL:', imageSource);
      }

      // Create temp directory for converted file
      const tempDir = path.join(os.tmpdir(), 'animation-service', jobId || 'test');
      await fs.mkdir(tempDir, { recursive: true });
      const jpegPath = path.join(tempDir, `scene_${sceneIndex}_converted.jpg`);
      tempFiles.push(jpegPath);
      
      await this.convertToJpeg(imageSource, jpegPath);
      
      const animationLength = parameters.animationLength || this.animationLength;

      let animationFilePath, metadataPath;
      if (isTest) {
        ({ animationFilePath, metadataPath } = this.getOutputPaths(videoPrompt, sceneIndex, isTest));
      } else {
        ({ animationFilePath, metadataPath } = this.getOutputPaths(jobId, sceneIndex, isTest));
      }

      const endpoint = `${this.baseUrl}/api/v1/animation`;

      try {
        // Select pattern from existing patterns
        const selectedPattern = await this.patternManager.selectPattern(videoPrompt);
        if (!selectedPattern) {
          throw new Error('No animation pattern available');
        }
        logger.info(`Using pattern: ${selectedPattern.id}`);

        const { disparityUrl, inputImageUrl } = await this.generateDisparityMap(jpegPath);
        
        const requestBody = {
          inputImageUrl,
          inputDisparityUrl: disparityUrl,
          animationLength,
          pattern: selectedPattern.pattern
        };
        logger.info(`Request body for animation generation: ${JSON.stringify({
          inputImageUrl,
          inputDisparityUrl: disparityUrl,
          animationLength
        }, null, 2)}`);

        const response = await axios.post(endpoint, requestBody, {
          headers: { 
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          timeout: 3 * 60 * 1000 // 3 minutes timeout
        });

        const responseData = {
          correlationId: response.data.correlationId,
          resultPresignedUrl: response.data.resultPresignedUrl
        };
        logger.info(`Animation generation response received`);
        logger.info(`Response status: ${response.status}`);
        logger.info(`Response data: ${JSON.stringify(responseData, null, 2)}`);

        const downloadUrl = response.data.resultPresignedUrl;
        if (!downloadUrl) {
          throw new Error('No download URL provided in the response');
        }

        logger.info(`Downloading animation from URL: ${downloadUrl}`);
        await this.downloadAnimation(downloadUrl, animationFilePath);
        logger.info(`Animation generated and saved to ${animationFilePath}`);

        // Save metadata
        await this.saveAnimationMetadata(metadataPath, {
          patternId: selectedPattern.id,
          fileName: path.basename(animationFilePath),
          generatedAt: new Date().toISOString()
        });

        if (!isTest) {
          // Upload to storage
          const storageResult = await storageService.uploadFile(animationFilePath, 'animation');
          logger.info('Animation uploaded to storage successfully');

          const animationData = {
            originalPattern: selectedPattern.id,
            tempFilePath: animationFilePath,
            fileName: path.basename(animationFilePath),
            storageKey: storageResult.storageKey,
            publicUrl: storageResult.url,
            metadata: {
              prompt: videoPrompt,
              duration: animationLength,
              generatedAt: new Date().toISOString(),
              patternId: selectedPattern.id,
              animationParameters: {
                inputImageUrl,
                animationLength
              }
            }
          };

          logger.info('Creating animation output record with data:', 
            JSON.stringify(animationData, null, 2));

          const animationRecord = await this.dataAccess.createAnimationOutput(
            jobId,
            sceneIndex,
            animationData
          );

          return {
            filePath: animationFilePath,
            fileName: path.basename(animationFilePath),
            storageKey: animationRecord.storageKey,
            publicUrl: animationRecord.publicUrl,
            metadata: {
              ...animationRecord.metadata,
              generatedAt: new Date().toISOString()
            }
          };
        }

        return {
          filePath: animationFilePath,
          fileName: path.basename(animationFilePath),
          metadata: {
            prompt: videoPrompt,
            duration: animationLength,
            generatedAt: new Date().toISOString(),
            patternId: selectedPattern.id,
            animationParameters: {
              inputImageUrl,
              animationLength
            }
          }
        };

      } catch (error) {
        const safeError = {
          message: error.message,
          code: error.code,
          response: error.response ? {
            status: error.response.status,
            statusText: error.response.statusText,
            data: typeof error.response.data === 'string' ? error.response.data.substring(0, 500) : error.response.data
          } : undefined
        };
        logger.error(`Error generating animation:`, safeError);
        throw error;
      }
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

  async downloadAnimation(url, outputPath) {
    try {
      logger.info(`Starting animation download from: ${url}`);
      const response = await axios({
        method: 'get',
        url: url,
        responseType: 'arraybuffer'
      });

      const dir = path.dirname(outputPath);
      logger.info(`Ensuring directory exists: ${dir}`);
      await fs.mkdir(dir, { recursive: true });

      await fs.writeFile(outputPath, Buffer.from(response.data));

      logger.info(`Animation downloaded successfully to: ${outputPath}`);
      return outputPath;
    } catch (error) {
      const errorInfo = {
        message: error.message,
        code: error.code,
        response: error.response ? {
          status: error.response.status,
          data: 'Binary data not shown'
        } : undefined
      };
      logger.error('Error downloading animation:', errorInfo);
      if (error.code === 'ENOENT') {
        logger.error(`Failed to create directory: ${path.dirname(outputPath)}`);
      }
      throw new Error('Failed to download animation: ' + error.message);
    }
  }

  async saveAnimationMetadata(metadataPath, data) {
    try {
      await fs.mkdir(path.dirname(metadataPath), { recursive: true });
      await fs.writeFile(metadataPath, JSON.stringify(data, null, 2));
      logger.info(`Metadata saved to ${metadataPath}`);
    } catch (error) {
      logger.error('Error saving metadata:', error);
      throw error;
    }
  }

  async getAnimationsForJob(jobId) {
    return await this.dataAccess.getAnimationsByJobId(jobId);
  }

  async getAnimationForScene(sceneId) {
    return await this.dataAccess.getAnimationBySceneId(sceneId);
  }

  async updateAnimationMetadata(animationId, metadata) {
    return await this.dataAccess.updateAnimationMetadata(animationId, metadata);
  }

  async deleteAnimation(animationId) {
    return await this.dataAccess.deleteAnimation(animationId);
  }

  async cleanup() {
    logger.info('AnimationGenService cleanup initiated');
    // Add any cleanup logic if needed
    logger.info('AnimationGenService cleanup completed');
  }
}

module.exports = AnimationGenService;