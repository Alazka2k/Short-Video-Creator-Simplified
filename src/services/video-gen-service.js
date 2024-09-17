const axios = require('axios');
const config = require('../utils/config');
const logger = require('../utils/logger');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const FormData = require('form-data');

class VideoGenService {
  constructor() {
    this.baseUrl = 'https://api.immersity.ai';
    this.authUrl = 'https://auth.immersity.ai/auth/realms/immersity/protocol/openid-connect/token';
    this.clientId = config.videoGen.clientId;
    this.clientSecret = config.videoGen.clientSecret;
    this.animationLength = config.videoGen.animationLength;
    this.accessToken = null;
  }

  async init() {
    try {
      await this.getAccessToken();
      logger.info('Immersity AI service initialized successfully');
    } catch (error) {
      this.logError('Failed to initialize Video Generation Service:', error);
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
      logger.info('Immersity AI Login AccessToken acquired');
    } catch (error) {
      this.logError('Error acquiring access token:', error);
      throw error;
    }
  }

  async convertToJpeg(inputPath, outputPath) {
    try {
      await sharp(inputPath)
        .jpeg({ quality: 90 })
        .toFile(outputPath);
      logger.info(`Image converted to JPEG: ${outputPath}`);
    } catch (error) {
      this.logError('Error converting image to JPEG:', error);
      throw error;
    }
  }

  async uploadImageToPicsur(imagePath) {
    try {
      const imageBuffer = await fs.promises.readFile(imagePath);
      const formData = new FormData();
      formData.append('image', imageBuffer, path.basename(imagePath));

      const response = await axios.post('https://picsur.org/api/image/upload', formData, {
        headers: {
          ...formData.getHeaders(),
        },
      });

      if (response.data.success) {
        const imageId = response.data.data.id;
        return { imageId, uploadResponse: response.data };
      } else {
        throw new Error('Image upload failed');
      }
    } catch (error) {
      this.logError('Error uploading image to Picsur:', error);
      throw error;
    }
  }

  constructImageUrl(imageId) {
    return `https://picsur.org/i/${imageId}.jpg`;
  }

  async generateDisparityMap(imagePath) {
    const endpoint = `${this.baseUrl}/api/v1/disparity`;

    try {
      logger.info(`Starting disparity map generation for image: ${imagePath}`);
      
      // Upload image to Picsur
      const { imageId } = await this.uploadImageToPicsur(imagePath);
      logger.info(`Image uploaded to Picsur. Image ID: ${imageId}`);

      // Construct the final image URL
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

      logger.info(`Disparity map generation response received`);
      logger.info(`Response status: ${response.status}`);
      logger.info(`Response data: ${JSON.stringify(response.data, null, 2)}`);

      return { disparityUrl: response.data.resultPresignedUrl, inputImageUrl };
    } catch (error) {
      this.logError(`Error generating disparity map:`, error);
      throw error;
    }
  }

  async generateVideo(imagePath, outputPath, options = {}) {
    if (!this.accessToken) {
      throw new Error('Video Generation Service not initialized. Call init() first.');
    }
  
    if (!imagePath) {
      throw new Error('Image path is undefined or empty');
    }
  
    logger.info(`Starting video generation for image: ${imagePath}`);
    
    // Convert image to JPEG
    const jpegPath = path.join(path.dirname(imagePath), 'converted.jpg');
    await this.convertToJpeg(imagePath, jpegPath);
    
    const animationLength = options.animationLength || this.animationLength;
    const endpoint = `${this.baseUrl}/api/v1/animation`;
  
    try {
      logger.info(`Generating video`);
      
      const { disparityUrl, inputImageUrl } = await this.generateDisparityMap(jpegPath);
      
      const requestBody = {
        inputImageUrl,
        inputDisparityUrl: disparityUrl,
        animationLength
      };
      logger.info(`Request body for video generation: ${JSON.stringify(requestBody, null, 2)}`);
  
      const response = await axios.post(endpoint, requestBody, {
        headers: { 
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 3 * 60 * 1000 // 3 minutes timeout
      });
  
      logger.info(`Video generation response received`);
      logger.info(`Response status: ${response.status}`);
      logger.info(`Response data: ${JSON.stringify(response.data, null, 2)}`);
  
      const downloadUrl = response.data.resultPresignedUrl;
      if (!downloadUrl) {
        throw new Error('No download URL provided in the response');
      }
  
      logger.info(`Downloading video from URL: ${downloadUrl}`);
      await this.downloadVideo(downloadUrl, outputPath);
      logger.info(`Video generated and saved to ${outputPath}`);
      return outputPath;
    } catch (error) {
      this.logError(`Error generating video:`, error);
      throw error;
    } finally {
      // Clean up the temporary JPEG file
      try {
        await fs.promises.unlink(jpegPath);
        logger.info(`Temporary JPEG file removed: ${jpegPath}`);
      } catch (unlinkError) {
        logger.warn(`Failed to remove temporary JPEG file: ${jpegPath}`, unlinkError);
      }
    }
  }

  async downloadVideo(url, outputPath) {
    try {
      logger.info(`Starting video download from: ${url}`);
      const response = await axios({
        method: 'get',
        url: url,
        responseType: 'stream'
      });

      const writer = fs.createWriteStream(outputPath);
      response.data.pipe(writer);

      return new Promise((resolve, reject) => {
        writer.on('finish', () => {
          logger.info(`Video downloaded successfully to: ${outputPath}`);
          resolve();
        });
        writer.on('error', (err) => {
          this.logError(`Error writing video to file: ${err.message}`, err);
          reject(err);
        });
      });
    } catch (error) {
      this.logError('Error downloading video:', error);
      throw new Error('Failed to download video');
    }
  }

  logError(message, error) {
    const errorInfo = {
      message: error.message,
      name: error.name,
      stack: error.stack
    };

    if (error.response) {
      errorInfo.response = {
        status: error.response.status,
        statusText: error.response.statusText,
        headers: error.response.headers,
        data: error.response.data
      };
    }

    logger.error(message, errorInfo);
  }
}

module.exports = new VideoGenService();