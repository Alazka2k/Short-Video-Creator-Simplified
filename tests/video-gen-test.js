const path = require('path');
const fs = require('fs').promises;
const videoGenService = require('../src/services/video-gen-service');
const logger = require('../src/utils/logger');
const config = require('../src/utils/config');

async function runVideoGenTest() {
  try {
    logger.info('Starting video generation test with Immersity AI');
    logger.info('Video Generation Config:', JSON.stringify(config.videoGen, null, 2));

    await videoGenService.init();

    const imageBaseDir = path.join(__dirname, 'test_output', 'image');
    const videoOutputDir = path.join(__dirname, 'test_output', 'video');

    await fs.mkdir(videoOutputDir, { recursive: true });

    const testFolders = await fs.readdir(imageBaseDir);

    for (const folder of testFolders) {
      const imageFolderPath = path.join(imageBaseDir, folder);
      const metadataPath = path.join(imageFolderPath, 'metadata.json');

      try {
        const metadataContent = await fs.readFile(metadataPath, 'utf8');
        const metadata = JSON.parse(metadataContent);

        logger.info(`Processing folder: ${folder}`);
        logger.info(`Metadata content: ${JSON.stringify(metadata, null, 2)}`);

        const videoFolder = path.join(videoOutputDir, folder);
        await fs.mkdir(videoFolder, { recursive: true });

        // Process only the first scene in the metadata
        const firstSceneKey = Object.keys(metadata)[0];
        const sceneData = metadata[firstSceneKey];

        if (!sceneData || !sceneData.fileName) {
          logger.warn(`Invalid or missing data for ${firstSceneKey} in ${folder}. Skipping.`);
          continue;
        }

        const imagePath = path.join(imageFolderPath, sceneData.fileName);
        const videoOutputPath = path.join(videoFolder, `${firstSceneKey}_video.mp4`);

        logger.info(`Generating video for ${firstSceneKey}`);
        logger.info(`Image path: ${imagePath}`);
        logger.info(`Video output path: ${videoOutputPath}`);

        try {
          await videoGenService.generateVideo(imagePath, videoOutputPath, {
            animationLength: config.videoGen.animationLength
          });
          logger.info(`Video generated successfully: ${videoOutputPath}`);
        } catch (error) {
          logger.error(`Error generating video for ${firstSceneKey}:`, error.message);
        }
      } catch (error) {
        logger.error(`Error processing folder ${folder}:`, error.message);
      }
    }

    logger.info('Video generation test completed');
  } catch (error) {
    logger.error('Error in video generation test:', error.message);
  }
}

runVideoGenTest().catch(error => {
  logger.error('Unhandled error in video generation test:', error.message);
});