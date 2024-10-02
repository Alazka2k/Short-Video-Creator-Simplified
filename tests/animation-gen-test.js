const path = require('path');
const fs = require('fs').promises;
const { AnimationServiceInterface } = require('../backend/services/animation-service');
const config = require('../backend/shared/utils/config');
const logger = require('../backend/shared/utils/logger');

async function runAnimationGenTest() {
  let animationService;
  try {
    logger.info('Starting animation generation test');
    logger.info('Animation Generation Config:', JSON.stringify(config.animationGen, null, 2));

    logger.info('Initializing Animation Generation Service...');
    animationService = new AnimationServiceInterface();
    await animationService.initialize();

    const llmOutputDir = path.join(__dirname, 'test_output', 'llm');
    const imageOutputDir = path.join(__dirname, 'test_output', 'image');
    const animationOutputDir = path.join(__dirname, 'test_output', 'animation');

    await fs.mkdir(animationOutputDir, { recursive: true });

    const llmOutputFiles = await fs.readdir(llmOutputDir);

    for (const llmOutputFile of llmOutputFiles) {
      if (llmOutputFile.startsWith('output_test_') && llmOutputFile.endsWith('.json')) {
        const llmOutputPath = path.join(llmOutputDir, llmOutputFile);
        const llmOutput = JSON.parse(await fs.readFile(llmOutputPath, 'utf8'));

        logger.info(`Processing LLM output: ${llmOutputFile}`);

        const promptOutputDir = path.join(animationOutputDir, path.basename(llmOutputFile, '.json'));
        await fs.mkdir(promptOutputDir, { recursive: true });

        for (const [index, scene] of llmOutput.scenes.entries()) {
          try {
            logger.info(`Generating animation for scene ${index + 1}`);

            const imagePath = path.join(imageOutputDir, path.basename(llmOutputFile, '.json'), `scene_${index + 1}_image.png`);

            // Ensure image file exists
            try {
              await fs.access(imagePath);
            } catch (error) {
              logger.error(`Image file not found: ${imagePath}`);
              continue;
            }

            const result = await animationService.process(
              imagePath,
              path.basename(llmOutputFile, '.json'), // Pass the test folder name
              index + 1,
              {
                animationLength: config.animationGen.animationLength,
                animationPrompt: scene.video_prompt
              },
              true  // isTest parameter
            );

            logger.info(`Animation generated successfully: ${result.filePath}`);

            const stats = await fs.stat(result.filePath);
            logger.info(`File size: ${stats.size} bytes`);

            // Verify the animation file
            if (stats.size > 0) {
              logger.info(`Animation file verified: ${result.filePath}`);
            } else {
              logger.warn(`Generated animation file is empty: ${result.filePath}`);
            }

            // Verify metadata
            const metadataPath = path.join(promptOutputDir, 'metadata.json');
            try {
              const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf8'));
              if (metadata[`scene_${index + 1}`]) {
                logger.info(`Metadata verified for scene ${index + 1}`);
              } else {
                logger.warn(`Metadata missing for scene ${index + 1}`);
              }
            } catch (error) {
              logger.error(`Error reading or parsing metadata for scene ${index + 1}:`, error.message);
            }
          } catch (error) {
            logger.error(`Error generating animation for scene ${index + 1}:`, error.message);
            logger.error('Error details:', error);
          }
        }
      }
    }

    logger.info('Animation generation test completed successfully');
  } catch (error) {
    logger.error('Error in animation generation test:', error.message);
    logger.error('Error details:', error);
  } finally {
    if (animationService) {
      try {
        await animationService.cleanup();
      } catch (cleanupError) {
        logger.error('Error during animation service cleanup:', cleanupError);
      }
    }
  }
}

runAnimationGenTest().catch(error => {
  logger.error('Unhandled error in animation generation test:', error.message);
  logger.error('Error details:', error);
});