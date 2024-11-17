const path = require('path');
const fs = require('fs').promises;
const readline = require('readline');
const { VideoServiceInterface } = require('../backend/services/video-service');
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

async function checkImageExists(imagePath) {
  try {
    await fs.access(imagePath);
    const stats = await fs.stat(imagePath);
    return stats.size > 0;
  } catch (error) {
    return false;
  }
}

async function findImagePath(baseDir, sceneNumber) {
  const patterns = [
    `image_scene_${sceneNumber}.png`,
    `scene_${sceneNumber}_image.png`,
    `image_${sceneNumber}.png`
  ];

  for (const pattern of patterns) {
    const testPath = path.join(baseDir, pattern);
    if (await checkImageExists(testPath)) {
      logger.info(`Found image at: ${testPath}`);
      return testPath;
    }
    logger.debug(`Image not found at: ${testPath}`);
  }

  return null;
}

async function runVideoGenTest() {
  let videoService;
  try {
    logger.info('Starting video generation test with Luma AI');
    logger.info('Video Generation Config:', JSON.stringify(config.videoGen, null, 2));
    logger.info('LLM Gen Config:', JSON.stringify(config.parameters.llmGen, null, 2));

    videoService = new VideoServiceInterface();
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

        // Process all scenes
        for (let index = 0; index < llmOutput.scenes.length; index++) {
          const sceneNumber = index + 1; // Convert to 1-based indexing
          const scene = llmOutput.scenes[index];

          logger.info(`Processing scene ${sceneNumber}`);

          const imagePath = await findImagePath(imageFolderPath, sceneNumber);
          
          if (!imagePath) {
            logger.error(`No valid image found for scene ${sceneNumber}`);
            logger.error(`Checked in directory: ${imageFolderPath}`);
            continue;
          }

          logger.info(`Using image: ${imagePath}`);

          const result = await videoService.process(
            imagePath,
            scene.video_prompt,
            scene.camera_movement,
            config.parameters.llmGen.aspectRatio,
            sceneNumber, // Using 1-based scene number
            folder,
            true  // isTest
          );

          if (result.error) {
            logger.warn(`Video generation warning: ${result.error}. Details: ${result.details}`);
          } else {
            logger.info(`Video generated successfully: ${result.filePath}`);

            const stats = await fs.stat(result.filePath);
            logger.info(`Generated video file size: ${stats.size} bytes`);
            
            if (stats.size > 0) {
              logger.info('Video file verified successfully');
              
              // Verify metadata file
              const metadataPath = path.join(path.dirname(result.filePath), 'metadata.json');
              try {
                await fs.access(metadataPath);
                logger.info(`Metadata file created: ${metadataPath}`);
                
                // Read and log metadata content
                const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf8'));
                logger.info(`Metadata content for scene ${sceneNumber}:`, JSON.stringify(metadata[`scene_${sceneNumber}`], null, 2));
              } catch (error) {
                logger.warn(`Metadata file not found or invalid: ${metadataPath}`);
              }
            } else {
              logger.warn('Generated video file is empty');
            }
          }
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
    if (videoService) {
      await videoService.cleanup();
    }
    rl.close();
  }
}

module.exports = runVideoGenTest;

if (require.main === module) {
  runVideoGenTest().catch(error => {
    logger.error('Unhandled error in video generation test:', error);
    logger.error('Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    rl.close();
  });
}