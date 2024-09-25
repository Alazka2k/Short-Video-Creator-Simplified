const axios = require('axios');
const config = require('../../shared/utils/config');
const logger = require('../../shared/utils/logger');
const fs = require('fs').promises;
const path = require('path');
const sharp = require('sharp');
const FormData = require('form-data');
const AnimationPatternGenerator = require('./animationPatternGenerator');

class AnimationGenService {
  constructor() {
    this.baseUrl = 'https://api.immersity.ai';
    this.authUrl = 'https://auth.immersity.ai/auth/realms/immersity/protocol/openid-connect/token';
    this.clientId = config.animationGen.clientId;
    this.clientSecret = config.animationGen.clientSecret;
    this.animationLength = config.animationGen.animationLength;
    this.accessToken = null;
    logger.info('AnimationGenService constructed');
  }

  async init() {
    try {
      logger.info('Initializing AnimationGenService...');
      await this.getAccessToken();
      logger.info('Immersity AI service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Animation Generation Service:', error);
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
      logger.error('Error acquiring access token:', error);
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
      logger.error('Error converting image to JPEG:', error);
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
      logger.error('Error uploading image to Picsur:', error);
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

      logger.info(`Disparity map generation response received`);
      logger.info(`Response status: ${response.status}`);
      logger.info(`Response data: ${JSON.stringify(response.data, null, 2)}`);

      return { disparityUrl: response.data.resultPresignedUrl, inputImageUrl };
    } catch (error) {
      logger.error(`Error generating disparity map:`, error);
      throw error;
    }
  }

  // Generate animation pattern separately to validate it before generating the animation
  async generateAnimationPattern(animationPrompt) {
    try {
      logger.info(`Generating animation pattern for visual prompt: ${animationPrompt}`);
      const generatedPattern = await AnimationPatternGenerator.generatePattern(animationPrompt);
  
      // Validate the generated pattern
      const pattern = generatedPattern.pattern;
      const values = pattern.slice(1, -1).split(',').map(Number);
  
      if (values.length < 702 || values.length > 825 || values.length % 3 !== 0) {
        logger.warn(`Invalid animation pattern: ${values.length} values. Adjusting...`);
        // Ensure at least 702 values
        while (values.length < 702) {
          values.push(...values.slice(0, 3));
        }
        // Truncate to 825 values if too long
        if (values.length > 825) {
          values.length = 825;
        }
        // Ensure the length is a multiple of 3
        while (values.length % 3 !== 0) {
          values.pop();
        }
        generatedPattern.pattern = `{${values.join(',')}}`;
      }
  
      logger.info(`Generated and validated animation pattern: ${generatedPattern.pattern}`);
      return generatedPattern;
    } catch (error) {
      logger.error('Error generating or validating animation pattern:', error);
      throw error;
    }
  }

  // Main function to generate the animation
  async generateAnimation(imagePath, outputPath, options = {}) {
    logger.info('generateAnimation called with:', { imagePath, outputPath, options });
    
    if (!this.accessToken) {
      throw new Error('Animation Generation Service not initialized. Call init() first.');
    }
  
    if (!imagePath) {
      throw new Error('Image path is undefined or empty');
    }
  
    if (!options.animationPattern) {
      throw new Error('Animation pattern is required to generate the animation');
    }

    logger.info(`Starting animation generation for image: ${imagePath}`);
    
    const jpegPath = path.join(path.dirname(imagePath), 'converted.jpg');
    await this.convertToJpeg(imagePath, jpegPath);
    
    const animationLength = options.animationLength || this.animationLength;
    const animationPattern = options.animationPattern;

    const endpoint = `${this.baseUrl}/api/v1/animation`;
  
    try {
      logger.info(`Generating animation with the provided pattern`);

      const { disparityUrl, inputImageUrl } = await this.generateDisparityMap(jpegPath);
      
      const requestBody = {
        inputImageUrl,
        inputDisparityUrl: disparityUrl,
        animationLength,
        pattern: animationPattern
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
  
      logger.info(`Animation generation response received`);
      logger.info(`Response status: ${response.status}`);
      logger.info(`Response data: ${JSON.stringify(response.data, null, 2)}`);
  
      const downloadUrl = response.data.resultPresignedUrl;
      if (!downloadUrl) {
        throw new Error('No download URL provided in the response');
      }
  
      logger.info(`Downloading animation from URL: ${downloadUrl}`);
      await this.downloadAnimation(downloadUrl, outputPath);
      logger.info(`Animation generated and saved to ${outputPath}`);
      return outputPath;
    } catch (error) {
      logger.error(`Error generating animation:`, error);
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
        responseType: 'arraybuffer'  // Changed from 'stream' to 'arraybuffer'
      });

      await fs.writeFile(outputPath, Buffer.from(response.data));  // Write the file using fs.promises

      logger.info(`Animation downloaded successfully to: ${outputPath}`);
      return outputPath;
    } catch (error) {
      logger.error('Error downloading animation:', error);
      throw new Error('Failed to download animation');
    }
  }

  async cleanup() {
    logger.info('AnimationGenService cleanup initiated');
    // Add any cleanup logic if needed
    logger.info('AnimationGenService cleanup completed');
  }
}

module.exports = new AnimationGenService();
