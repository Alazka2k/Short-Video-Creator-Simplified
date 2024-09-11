const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const https = require('https');
const imageGenService = require('../src/services/image-gen-service');
const logger = require('../src/utils/logger');
const config = require('../src/utils/config');

function checkInternetConnectivity() {
  return new Promise((resolve) => {
    https.get('https://discord.com', (res) => {
      resolve(res.statusCode === 200);
    }).on('error', () => {
      resolve(false);
    });
  });
}

function getRandomVariationUrl(originalUrl) {
  const urlParts = originalUrl.split('/');
  const filename = urlParts[urlParts.length - 1].split('?')[0];
  const match = filename.match(/.*_([a-f0-9-]+)\.png$/);
  if (!match) {
    throw new Error('Unable to extract identifier from URL');
  }
  const identifier = match[1];
  const randomVariation = Math.floor(Math.random() * 4); // 0, 1, 2, or 3
  return `https://cdn.midjourney.com/${identifier}/0_${randomVariation}.png`;
}

async function downloadImageWithPuppeteer(url, outputPath) {
  const browser = await puppeteer.launch({ headless: false }); // Run in headful mode to see what's happening
  const page = await browser.newPage();
  
  try {
    await page.goto(url, { waitUntil: 'networkidle2' });

    // Wait for the challenge to be solved
    await page.waitForSelector('img'); // Adjust this selector based on the actual content

    // Extract the image content
    const viewSource = await page.goto(url);
    const buffer = await viewSource.buffer();
    fsSync.writeFileSync(outputPath, buffer);

    logger.info(`Image downloaded successfully to ${outputPath}`);
  } catch (error) {
    logger.error('Error downloading image:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

async function runImageGenTest() {
  try {
    logger.info('Starting image generation test');
    logger.info('Image Gen Config:', JSON.stringify(config.imageGen, null, 2));

    const isConnected = await checkInternetConnectivity();
    if (!isConnected) {
      logger.error('No internet connectivity. Please check your network connection.');
      return;
    }

    logger.info('Internet connectivity confirmed. Initializing Midjourney client...');
    await imageGenService.init();

    const testOutputPath = path.join(__dirname, 'test_output', 'llm', 'output_test.json');
    const testData = JSON.parse(await fs.readFile(testOutputPath, 'utf8'));

    const imageOutputDir = path.join(__dirname, 'test_output', 'image');
    await fs.mkdir(imageOutputDir, { recursive: true });

    // Only test the first scene
    const scene = testData.scenes[0];
    const imageFileName = `scene_1_image.png`;
    const imageFilePath = path.join(imageOutputDir, imageFileName);

    logger.info(`Generating image for scene 1`);
    const originalImageUrl = await imageGenService.generateImage(scene.visual_prompt);
    
    logger.info(`Original image URL: ${originalImageUrl}`);
    
    const selectedVariationUrl = getRandomVariationUrl(originalImageUrl);
    logger.info(`Selected variation URL: ${selectedVariationUrl}`);

    logger.info(`Downloading image from ${selectedVariationUrl}`);
    await downloadImageWithPuppeteer(selectedVariationUrl, imageFilePath);
    logger.info(`Image saved to ${imageFilePath}`);

    logger.info('Image generation test completed successfully');
  } catch (error) {
    logger.error('Error in image generation test:', error.message);
    if (error.stack) {
      logger.error('Stack trace:', error.stack);
    }
  } finally {
    await imageGenService.close();
  }
}

runImageGenTest();