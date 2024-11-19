const axios = require('axios');
const config = require('../../shared/utils/config');
const logger = require('../../shared/utils/logger');
const fs = require('fs').promises;
const path = require('path');
const sharp = require('sharp');
const FormData = require('form-data');
const AnimationPatternGenerator = require('../../shared/utils/pattern/animation-pattern-generator');
const AnimationDataAccess = require('./data/animationDataAccess');

class AnimationGenService {
  constructor() {
    this.baseUrl = 'https://api.immersity.ai';
    this.authUrl = 'https://auth.immersity.ai/auth/realms/immersity/protocol/openid-connect/token';
    this.clientId = config.animationGen.clientId;
    this.clientSecret = config.animationGen.clientSecret;
    this.animationLength = config.animationGen.animationLength;
    this.accessToken = null;
    this.patternGenerator = new AnimationPatternGenerator();
    this.dataAccess = AnimationDataAccess;
    logger.info('AnimationGenService constructed');
  }

  async init() {
    try {
      logger.info('Initializing AnimationGenService...');
      await this.getAccessToken();
      await this.patternGenerator.patternManager.initialize();
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
      await sharp(inputPath)
        .jpeg({ quality: 90 })
        .toFile(outputPath);
      logger.info(`Image converted to JPEG successfully: ${outputPath}`);
    } catch (error) {
      logger.error('Error converting image to JPEG:', error.message);
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

      if (response.data.success) {
        const imageId = response.data.data.id;
        logger.info(`Image uploaded successfully. Image ID: ${imageId}`);
        return { imageId, uploadResponse: response.data };
      } else {
        throw new Error('Image upload failed');
      }
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
      logger.error('Error uploading image to Picsur:', errorInfo);
      throw error;
    }
  }

  constructImageUrl(imageId) {
    const url = `https://picsur.org/i/${imageId}.jpg`;
    logger.info(`Constructed image URL: ${url}`);
    return url;
  }

  async generateDisparityMap(imagePath) {
    const endpoint = `${this.baseUrl}/api/v1/disparity`;

    try {
      logger.info(`Starting disparity map generation for image: ${imagePath}`);
      
      const { imageId } = await this.uploadImageToPicsur(imagePath);
      logger.info(`Image uploaded to Picsur. Image ID: ${imageId}`);

      const inputImageUrl = this.constructImageUrl(imageId);
      logger.info(`Constructed input image URL: ${inputImageUrl}`);

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
      const errorInfo = {
        message: error.message,
        code: error.code,
        response: error.response ? {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        } : undefined
      };
      logger.error(`Error generating disparity map: ${JSON.stringify(errorInfo, null, 2)}`);
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

  async generateAnimation(imagePath, promptOrTestFolder, sceneIndex, jobId = null, options = {}, isTest = false) {
    logger.info('generateAnimation called with:', { imagePath, promptOrTestFolder, sceneIndex, jobId, options, isTest });
    
    if (!this.accessToken) {
      throw new Error('Animation Generation Service not initialized. Call init() first.');
    }
    
    if (!imagePath) {
      throw new Error('Image path is undefined or empty');
    }

    if (!isTest && !jobId) {
      throw new Error('jobId is required for production mode');
    }

    logger.info(`Starting animation generation for image: ${imagePath}`);
    
    const jpegPath = path.join(path.dirname(imagePath), 'converted.jpg');
    await this.convertToJpeg(imagePath, jpegPath);
    
    const animationLength = options.animationLength || this.animationLength;
    const videoPrompt = options.videoPrompt || '';

    let animationFilePath, metadataPath;
    if (isTest) {
      ({ animationFilePath, metadataPath } = this.getOutputPaths(promptOrTestFolder, sceneIndex, isTest));
    } else {
      ({ animationFilePath, metadataPath } = this.getOutputPaths(jobId, sceneIndex, isTest));
    }

    const endpoint = `${this.baseUrl}/api/v1/animation`;

    try {
      // Generate or select pattern
      const patternResult = await this.patternGenerator.generatePattern(videoPrompt);
      logger.info(`Using pattern: ${patternResult.id}`);

      const { disparityUrl, inputImageUrl } = await this.generateDisparityMap(jpegPath);
      
      const requestBody = {
        inputImageUrl,
        inputDisparityUrl: disparityUrl,
        animationLength,
        pattern: patternResult.pattern
      };
      logger.info(`Request body for animation generation: ${JSON.stringify(requestBody, null, 2)}`);

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
        patternId: patternResult.id,
        fileName: path.basename(animationFilePath),
        generatedAt: new Date().toISOString()
      });

      if (!isTest) {
        const animationData = {
          originalPattern: patternResult.id,
          tempFilePath: animationFilePath,
          fileName: path.basename(animationFilePath),
          metadata: {
            prompt: videoPrompt,
            duration: animationLength,
            generatedAt: new Date().toISOString(),
            patternId: patternResult.id,
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
          metadata: animationRecord.metadata
        };
      }

      return {
        filePath: animationFilePath,
        fileName: path.basename(animationFilePath)
      };

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
      logger.error(`Error generating animation: ${JSON.stringify(errorInfo, null, 2)}`);
      throw error;
    } finally {
      try {
        await fs.unlink(jpegPath);
        logger.info(`Temporary JPEG file removed: ${jpegPath}`);
      } catch (unlinkError) {
        logger.warn(`Failed to remove temporary JPEG file: ${jpegPath}`, unlinkError);
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