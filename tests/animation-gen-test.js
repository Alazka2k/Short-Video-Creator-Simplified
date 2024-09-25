const path = require('path');
const fs = require('fs').promises;
const animationService = require('../backend/services/animation-service');
const logger = require('../backend/shared/utils/logger');
const config = require('../backend/shared/utils/config');

async function runAnimationGenTest() {
  try {
    logger.info('==== Starting animation generation test ====');
    logger.info('Animation Generation Config:', JSON.stringify(config.animationGen, null, 2));

    logger.info('Attempting to initialize animation service...');
    try {
      await animationService.initialize();
      logger.info('Animation service initialized successfully');
    } catch (initError) {
      logger.error('Failed to initialize animation service:', initError);
      return;
    }

    const imageBaseDir = path.join(__dirname, 'test_output', 'image');
    const llmBaseDir = path.join(__dirname, 'test_output', 'llm');
    const animationOutputDir = path.join(__dirname, 'test_output', 'animation');

    logger.info(`Image base directory: ${imageBaseDir}`);
    logger.info(`LLM base directory: ${llmBaseDir}`);
    logger.info(`Animation output directory: ${animationOutputDir}`);

    try {
      await fs.mkdir(animationOutputDir, { recursive: true });
      logger.info('Animation output directory created successfully');
    } catch (mkdirError) {
      logger.error('Failed to create animation output directory:', mkdirError);
      return;
    }

    let testFolders;
    try {
      testFolders = await fs.readdir(imageBaseDir);
      logger.info(`Found ${testFolders.length} test folders`);
    } catch (readdirError) {
      logger.error('Failed to read test folders:', readdirError);
      return;
    }

    for (const folder of testFolders) {
      logger.info(`Processing folder: ${folder}`);
      const imageFolderPath = path.join(imageBaseDir, folder);
      const metadataPath = path.join(imageFolderPath, 'metadata.json');
      const llmOutputPath = path.join(llmBaseDir, `${folder}.json`);

      try {
        const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf8'));
        const llmOutput = JSON.parse(await fs.readFile(llmOutputPath, 'utf8'));

        const firstSceneKey = Object.keys(metadata)[0];
        const sceneData = metadata[firstSceneKey];
        const llmSceneData = llmOutput.scenes[0];

        if (!sceneData || !sceneData.fileName) {
          logger.warn(`Invalid or missing data for ${firstSceneKey} in ${folder}. Skipping.`);
          continue;
        }

        const imagePath = path.join(imageFolderPath, sceneData.fileName);
        const animationOutputPath = path.join(animationOutputDir, `${firstSceneKey}_animation.mp4`);

        logger.info(`Generating animation for ${firstSceneKey}`);
        logger.info(`Image path: ${imagePath}`);
        logger.info(`Animation output path: ${animationOutputPath}`);

        try {
          const result = await animationService.process(imagePath, animationOutputPath, {
            animationLength: config.animationGen.animationLength,
            animationPrompt: llmSceneData.video_prompt
          });
          logger.info('Animation processing completed. Result:', result);
        } catch (processError) {
          logger.error(`Error processing animation for ${firstSceneKey}:`, processError);
        }
      } catch (folderError) {
        logger.error(`Error processing folder ${folder}:`, folderError);
      }
    }

    logger.info('==== Animation generation test completed ====');
  } catch (error) {
    logger.error('Unexpected error in animation generation test:', error);
  } finally {
    try {
      await animationService.cleanup();
      logger.info('Animation service cleanup completed');
    } catch (cleanupError) {
      logger.error('Error during animation service cleanup:', cleanupError);
    }
  }
}

// Wrap the execution in a try-catch block
try {
  runAnimationGenTest().catch(error => {
    logger.error('Unhandled error in runAnimationGenTest:', error);
  });
} catch (error) {
  logger.error('Error executing runAnimationGenTest:', error);
}

module.exports = runAnimationGenTest;