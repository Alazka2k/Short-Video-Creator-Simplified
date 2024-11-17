const path = require('path');
const fs = require('fs').promises;
const { AnimationServiceInterface } = require('../backend/services/animation-service');
const config = require('../backend/shared/utils/config');
const logger = require('../backend/shared/utils/logger');

async function checkImageExists(imagePath) {
  try {
    await fs.access(imagePath);
    const stats = await fs.stat(imagePath);
    return stats.size > 0;
  } catch (error) {
    return false;
  }
}

async function findImagePath(baseDir, folderName, sceneIndex) {
  // Define all possible image naming patterns - now using 1-based indexing
  const patterns = [
    `scene_${sceneIndex + 1}_image.png`,
    `image_scene_${sceneIndex + 1}.png`, // Changed from sceneIndex to sceneIndex + 1
    `image_${sceneIndex + 1}.png`
  ];

  // Check in potential subdirectories
  const searchDirs = [
    baseDir,
    path.join(baseDir, folderName),
    path.join(baseDir, 'output_test_1'),
    path.join(baseDir, 'output_test_2')
  ];

  logger.info(`Looking for scene ${sceneIndex + 1} images with patterns:`, patterns);

  for (const dir of searchDirs) {
    for (const pattern of patterns) {
      const testPath = path.join(dir, pattern);
      logger.debug(`Checking for image at: ${testPath}`);
      if (await checkImageExists(testPath)) {
        logger.info(`Found image at: ${testPath}`);
        return testPath;
      }
    }
  }

  return null;
}

async function runAnimationGenTest() {
  let animationService;
  try {
    logger.info('Starting animation generation test');
    
    // Initialize the animation service
    animationService = new AnimationServiceInterface();
    await animationService.initialize();

    // Set up paths
    const testOutputDir = path.join(__dirname, 'test_output');
    const llmOutputDir = path.join(testOutputDir, 'llm');
    const imageOutputDir = path.join(testOutputDir, 'image');
    const animationOutputDir = path.join(testOutputDir, 'animation');

    // Ensure animation output directory exists
    await fs.mkdir(animationOutputDir, { recursive: true });

    // Process each LLM output file
    const llmFiles = await fs.readdir(llmOutputDir);
    for (const llmFile of llmFiles) {
      if (!llmFile.startsWith('output_test_') || !llmFile.endsWith('.json')) continue;

      logger.info(`Processing LLM output file: ${llmFile}`);
      
      const llmOutputPath = path.join(llmOutputDir, llmFile);
      const rawContent = await fs.readFile(llmOutputPath, 'utf8');
      const llmOutput = JSON.parse(rawContent);

      if (!llmOutput.scenes || !Array.isArray(llmOutput.scenes)) {
        logger.error(`Invalid LLM output structure in ${llmFile}`);
        continue;
      }

      const testFolderName = path.basename(llmFile, '.json');
      const animationTestOutputDir = path.join(animationOutputDir, testFolderName);
      await fs.mkdir(animationTestOutputDir, { recursive: true });

      logger.info(`Found ${llmOutput.scenes.length} scenes to process`);

      // Process each scene
      for (const [index, scene] of llmOutput.scenes.entries()) {
        try {
          const sceneNumber = index + 1;
          logger.info(`Processing scene ${sceneNumber}`);

          // Find the image file
          const imagePath = await findImagePath(imageOutputDir, testFolderName, index);
          
          if (!imagePath) {
            logger.error(`Could not find image for scene ${sceneNumber}`);
            logger.error(`Looked in directory: ${imageOutputDir}`);
            continue;
          }

          logger.info(`Generating animation for scene ${sceneNumber} using image: ${imagePath}`);

          const result = await animationService.process(
            imagePath,
            testFolderName,
            sceneNumber, // Using 1-based scene number
            {
              animationLength: config.animationGen?.animationLength || 5,
              animationPrompt: scene.video_prompt
            },
            true // isTest
          );

          if (!result) {
            throw new Error('Animation generation returned no result');
          }

          logger.info(`Animation generated successfully: ${result.filePath}`);

          // Verify the generated file
          const stats = await fs.stat(result.filePath);
          logger.info(`Generated animation file size: ${stats.size} bytes`);

          if (stats.size === 0) {
            throw new Error('Generated animation file is empty');
          }

        } catch (error) {
          logger.error(`Error processing scene ${index + 1}:`, error);
        }
      }
    }

    logger.info('Animation generation test completed successfully');
  } catch (error) {
    logger.error('Error in animation generation test:', error);
  } finally {
    if (animationService) {
      await animationService.cleanup();
    }
  }
}

module.exports = runAnimationGenTest;

if (require.main === module) {
  runAnimationGenTest().catch(error => {
    logger.error('Unhandled error in animation generation test:', error);
    process.exit(1);
  });
}