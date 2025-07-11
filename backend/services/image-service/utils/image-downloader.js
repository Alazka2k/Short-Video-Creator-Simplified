const axios = require('axios');
const fs = require('fs');
const path = require('path');
const logger = require('../../../shared/utils/logger');

class ImageDownloader {
  /**
   * Downloads an image from a given URL and saves it to the specified output path.
   * This implementation uses axios for efficient streaming of the image data directly to a file,
   * avoiding loading the entire image into memory.
   *
   * @param {string} url The URL of the image to download.
   * @param {string} outputPath The local file path to save the image to.
   * @returns {Promise<void>} A promise that resolves when the download is complete.
   */
  async downloadImage(url, outputPath) {
    logger.info(`Downloading image from ${url} to ${outputPath}`);

    try {
      // Ensure the output directory exists
      await fs.promises.mkdir(path.dirname(outputPath), { recursive: true });

      const response = await axios({
        method: 'GET',
        url: url,
        responseType: 'stream',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        timeout: 60000, // 60-second timeout for the download
      });

      const writer = fs.createWriteStream(outputPath);

      // Pipe the image data stream directly to the file
      response.data.pipe(writer);

      return new Promise((resolve, reject) => {
        writer.on('finish', () => {
          logger.info(`Image downloaded successfully to ${outputPath}`);
          resolve();
        });
        writer.on('error', (error) => {
          logger.error(`Error writing image file to ${outputPath}:`, error);
          reject(error);
        });
        response.data.on('error', (error) => {
          logger.error(`Error during image download stream from ${url}:`, error);
          reject(error);
        });
      });
    } catch (error) {
      if (error.response) {
        logger.error(`Error response ${error.response.status} from server while downloading image from ${url}. Headers: ${JSON.stringify(error.response.headers)}`);
      } else if (error.request) {
        logger.error(`No response received while attempting to download image from ${url}`, error.request);
      } else {
        logger.error('Error setting up the download request:', error.message);
      }
      throw new Error(`Failed to download image from ${url}.`);
    }
  }
}

module.exports = ImageDownloader; 