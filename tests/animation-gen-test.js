const path = require('path');
const fs = require('fs').promises;
const animationService = require('../backend/services/animation-service');
const logger = require('../backend/shared/utils/logger');
const config = require('../backend/shared/utils/config');

async function runAnimationGenTest() {
  try {
    logger.info('Starting animation generation test with Immersity AI');
    logger.info('Animation Generation Config:', JSON.stringify(config.animationGen, null, 2));

    await animationService.initialize();

    const imageBaseDir = path.join(__dirname, 'test_output', 'image');
    const animationOutputDir = path.join(__dirname, 'test_output', 'animation');

    await fs.mkdir(animationOutputDir, { recursive: true });

    const testFolders = await fs.readdir(imageBaseDir);

    for (const folder of testFolders) {
      const imageFolderPath = path.join(imageBaseDir, folder);
      const metadataPath = path.join(imageFolderPath, 'metadata.json');

      try {
        const metadataContent = await fs.readFile(metadataPath, 'utf8');
        const metadata = JSON.parse(metadataContent);

        logger.info(`Processing folder: ${folder}`);
        logger.info(`Metadata content: ${JSON.stringify(metadata, null, 2)}`);

        const animationFolder = path.join(animationOutputDir, folder);
        await fs.mkdir(animationFolder, { recursive: true });

        // Process only the first scene in the metadata
        const firstSceneKey = Object.keys(metadata)[0];
        const sceneData = metadata[firstSceneKey];

        if (!sceneData || !sceneData.fileName) {
          logger.warn(`Invalid or missing data for ${firstSceneKey} in ${folder}. Skipping.`);
          continue;
        }

        const imagePath = path.join(imageFolderPath, sceneData.fileName);
        const animationOutputPath = path.join(animationFolder, `${firstSceneKey}_animation.mp4`);

        logger.info(`Generating animation for ${firstSceneKey}`);
        logger.info(`Image path: ${imagePath}`);
        logger.info(`Animation output path: ${animationOutputPath}`);

        try {
          await animationService.process(imagePath, animationOutputPath, {
            animationLength: config.animationGen.animationLength
          });
          logger.info(`Animation generated successfully: ${animationOutputPath}`);
        } catch (error) {
          logger.error(`Error generating animation for ${firstSceneKey}:`, error.message);
        }
      } catch (error) {
        logger.error(`Error processing folder ${folder}:`, error.message);
      }
    }

    logger.info('Animation generation test completed');
  } catch (error) {
    logger.error('Error in animation generation test:', error.message);
  } finally {
    await animationService.cleanup();
  }
}

runAnimationGenTest().catch(error => {
  logger.error('Unhandled error in animation generation test:', error.message);
});