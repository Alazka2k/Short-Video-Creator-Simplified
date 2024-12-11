const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');
const logger = require('../../../shared/utils/logger');

class ImageDownloader {
  async downloadImage(url, outputPath) {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
  
    try {
      await fs.mkdir(path.dirname(outputPath), { recursive: true });
      
      await page.goto(url, { waitUntil: 'networkidle2' });
      await page.waitForSelector('img');
      const viewSource = await page.goto(url);
      const buffer = await viewSource.buffer();
      await fs.writeFile(outputPath, buffer);
      logger.info(`Image downloaded successfully to ${outputPath}`);
    } catch (error) {
      logger.error('Error downloading image:', error);
      throw error;
    } finally {
      await browser.close();
    }
  }

  getRandomVariationUrl(originalUrl) {
    const urlParts = originalUrl.split('/');
    const filename = urlParts[urlParts.length - 1].split('?')[0];
    const match = filename.match(/.*_([a-f0-9-]+)\.png$/);
    if (!match) {
      throw new Error('Unable to extract identifier from URL');
    }
    const identifier = match[1];
    const randomVariation = Math.floor(Math.random() * 4);
    return `https://cdn.midjourney.com/${identifier}/0_${randomVariation}.png`;
  }
}

module.exports = ImageDownloader; 