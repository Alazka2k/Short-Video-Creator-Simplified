const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const logger = require('./logger');
const storageService = require('./storage');

class ImageHelper {
  /**
   * Makes an image accessible via S3 storage
   * @param {string} imagePath - URL or local path to the image
   * @param {string} identifier - Unique identifier for the temp file (e.g., sceneId, jobId)
   * @param {string} [serviceName='shared'] - Name of the service using this helper
   * @returns {Promise<string>} - Returns the S3 URL of the accessible image
   */
  static async makeImageAccessible(imagePath, identifier, serviceName = 'shared') {
    try {
      logger.info(`Making image accessible: ${imagePath}`);
      
      // If image is already a URL, verify it's our S3 URL or return as is
      if (imagePath.startsWith('http')) {
        // If it's already our S3 URL, just return it
        if (imagePath.includes('s3.') && imagePath.includes('amazonaws.com')) {
          logger.info('Image is already an S3 URL, using as is');
          return imagePath;
        }
        // If it's an external URL, we need to download and reupload to our S3
        logger.info('External URL detected, downloading and reuploading to S3');
        const imageBuffer = await this.downloadImageFromUrl(imagePath);
        
        // Create temp file
        const tempDir = path.join(os.tmpdir(), serviceName, 'temp');
        await fs.mkdir(tempDir, { recursive: true });
        const tempFile = path.join(tempDir, `${identifier}_temp.jpg`);
        
        await fs.writeFile(tempFile, imageBuffer);
        
        // Upload to S3
        const result = await storageService.uploadFile(tempFile, 'temp_images');
        
        // Clean up temp file
        try {
          await fs.unlink(tempFile);
        } catch (unlinkError) {
          logger.warn(`Failed to remove temporary file: ${tempFile}`, unlinkError);
        }
        
        return result.url;
      } else {
        // For local files, just upload directly to S3
        logger.info('Local file detected, uploading to S3');
        const result = await storageService.uploadFile(imagePath, 'temp_images');
        return result.url;
      }
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
      logger.error('Error making image accessible:', safeError);
      throw error;
    }
  }

  /**
   * Downloads an image from a URL
   * @param {string} imageUrl - URL of the image to download
   * @returns {Promise<Buffer>} - Returns the image as a buffer
   */
  static async downloadImageFromUrl(imageUrl) {
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
}

module.exports = ImageHelper; 