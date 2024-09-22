const path = require('path');
const fs = require('fs').promises;
const https = require('https');
const imageService = require('../backend/services/image-service');
const config = require('../backend/shared/utils/config');
const logger = require('../backend/shared/utils/logger');

function checkInternetConnectivity() {
  return new Promise((resolve) => {
    https.get('https://discord.com', (res) => {
      resolve(res.statusCode === 200);
    }).on('error', () => {
      resolve(false);
    });
  });
}

async function runImageGenTest() {
  try {
    logger.info('Starting image generation test');
    logger.info('Image Generation Config:', JSON.stringify(config.imageGen, null, 2));

    const isConnected = await checkInternetConnectivity();
    if (!isConnected) {
      logger.error('No internet connectivity. Please check your network connection.');
      return;
    }

    logger.info('Internet connectivity confirmed. Initializing Image Generation Service...');
    await imageService.initialize();

    const llmOutputDir = path.join(__dirname, 'test_output', 'llm');
    const imageOutputDir = path.join(__dirname, 'test_output', 'image');

    await fs.mkdir(imageOutputDir, { recursive: true });

    const llmOutputFiles = await fs.readdir(llmOutputDir);

    for (const llmOutputFile of llmOutputFiles) {
      if (llmOutputFile.startsWith('output_test_') && llmOutputFile.endsWith('.json')) {
        const llmOutputPath = path.join(llmOutputDir, llmOutputFile);
        const llmOutput = JSON.parse(await fs.readFile(llmOutputPath, 'utf8'));

        logger.info(`Processing LLM output: ${llmOutputFile}`);

        const promptOutputDir = path.join(imageOutputDir, path.basename(llmOutputFile, '.json'));
        await fs.mkdir(promptOutputDir, { recursive: true });

        for (const [index, scene] of llmOutput.scenes.entries()) {
          try {
            logger.info(`Generating image for scene ${index + 1}`);
            
            const result = await imageService.process(
              scene.visual_prompt,
              promptOutputDir,
              index
            );

            logger.info(`Image generated successfully: ${result.filePath}`);
            logger.info(`Original URL: ${result.originalUrl}`);
            logger.info(`Selected variation URL: ${result.imageUrl}`);

            const stats = await fs.stat(result.filePath);
            logger.info(`File size: ${stats.size} bytes`);

            // Verify the image file
            if (stats.size > 0) {
              logger.info(`Image file verified: ${result.filePath}`);
            } else {
              logger.warn(`Generated image file is empty: ${result.filePath}`);
            }

            // Verify metadata
            const metadataPath = path.join(promptOutputDir, 'metadata.json');
            const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf8'));
            if (metadata[`scene_${index + 1}`]) {
              logger.info(`Metadata verified for scene ${index + 1}`);
            } else {
              logger.warn(`Metadata missing for scene ${index + 1}`);
            }

          } catch (error) {
            logger.error(`Error generating image for scene ${index + 1}:`, error.message);
          }
        }
      }
    }

    logger.info('Image generation test completed successfully');
  } catch (error) {
    logger.error('Error in image generation test:', error.message);
    if (error.stack) {
      logger.error('Stack trace:', error.stack);
    }
  } finally {
    await imageService.cleanup();
  }
}

runImageGenTest().catch(error => {
  logger.error('Unhandled error in image generation test:', error.message);
});