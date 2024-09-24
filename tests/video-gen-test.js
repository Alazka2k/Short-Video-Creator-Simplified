const path = require('path');
const fs = require('fs').promises;
const readline = require('readline');
const videoService = require('../backend/services/video-service');
const logger = require('../backend/shared/utils/logger');
const config = require('../backend/shared/utils/config');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function promptToContinue() {
  return new Promise((resolve) => {
    rl.question('Press Enter to continue with the next folder, or type "exit" to stop: ', (answer) => {
      resolve(answer.toLowerCase() !== 'exit');
    });
  });
}

async function runVideoGenTest() {
  try {
    logger.info('Starting video generation test with Luma AI');
    logger.info('Video Generation Config:', JSON.stringify(config.videoGen, null, 2));
    logger.info('LLM Gen Config:', JSON.stringify(config.parameters.llmGen, null, 2));

    await videoService.initialize();
    logger.info('Video service initialized successfully');

    const imageBaseDir = path.join(__dirname, 'test_output', 'image');
    const llmBaseDir = path.join(__dirname, 'test_output', 'llm');
    const videoOutputDir = path.join(__dirname, 'test_output', 'video');

    logger.info(`Image base directory: ${imageBaseDir}`);
    logger.info(`LLM output directory: ${llmBaseDir}`);
    logger.info(`Video output directory: ${videoOutputDir}`);

    await fs.mkdir(videoOutputDir, { recursive: true });

    const testFolders = await fs.readdir(imageBaseDir);
    logger.info(`Found ${testFolders.length} test folders`);

    for (const folder of testFolders) {
      const imageFolderPath = path.join(imageBaseDir, folder);
      const folderOutputDir = path.join(videoOutputDir, folder);
      await fs.mkdir(folderOutputDir, { recursive: true });

      logger.info(`Processing folder: ${folder}`);

      try {
        const llmOutputPath = path.join(llmBaseDir, `${folder}.json`);
        logger.info(`Reading LLM output from: ${llmOutputPath}`);
        
        const llmOutputContent = await fs.readFile(llmOutputPath, 'utf8');
        const llmOutput = JSON.parse(llmOutputContent);

        // Process only the first scene
        const firstScene = llmOutput.scenes[0];
        const imagePath = path.join(imageFolderPath, 'scene_1_image.png');
        const outputPath = path.join(folderOutputDir, 'scene_1_video.mp4');

        logger.info(`Processing first scene`);
        logger.info(`Image path: ${imagePath}`);
        logger.info(`Video output path: ${outputPath}`);

        // Check if image file exists
        try {
          await fs.access(imagePath);
        } catch (error) {
          logger.error(`Image file not found: ${imagePath}`);
          continue;
        }

        await videoService.generateVideo(
          imagePath,
          firstScene.video_prompt,
          firstScene.camera_movement,
          config.parameters.llmGen.aspectRatio,
          outputPath
        );

        logger.info(`Video generated successfully: ${outputPath}`);

        const stats = await fs.stat(outputPath);
        logger.info(`Generated video file size: ${stats.size} bytes`);
        if (stats.size > 0) {
          logger.info('Video file verified successfully');
        } else {
          logger.warn('Generated video file is empty');
        }

      } catch (error) {
        logger.error(`Error processing folder ${folder}:`, error);
        logger.error('Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
      }

      if (testFolders.indexOf(folder) < testFolders.length - 1) {
        const shouldContinue = await promptToContinue();
        if (!shouldContinue) {
          logger.info('Test stopped by user');
          break;
        }
      }
    }

    logger.info('Video generation test completed');
  } catch (error) {
    logger.error('Error in video generation test:', error);
    logger.error('Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
  } finally {
    await videoService.cleanup();
    rl.close();
  }
}

runVideoGenTest().catch(error => {
  logger.error('Unhandled error in video generation test:', error);
  logger.error('Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
  rl.close();
});