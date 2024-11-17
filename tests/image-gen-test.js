const path = require('path');
const fs = require('fs').promises;
const https = require('https');
const { ImageServiceInterface } = require('../backend/services/image-service');
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

async function validateLLMOutput(llmOutput) {
  if (!llmOutput || typeof llmOutput !== 'object') {
    throw new Error('Invalid LLM output: not an object');
  }
  
  const scenes = llmOutput.scenes || (llmOutput.content && llmOutput.content.video_script && llmOutput.content.video_script.scenes);
  
  if (!scenes || !Array.isArray(scenes)) {
    throw new Error('Invalid LLM output: no scenes array found');
  }
  
  return scenes;
}

async function runImageGenTest() {
  let imageService;
  try {
    logger.info('Starting image generation test');
    logger.info('Image Generation Config:', JSON.stringify(config.imageGen, null, 2));

    const isConnected = await checkInternetConnectivity();
    if (!isConnected) {
      logger.error('No internet connectivity. Please check your network connection.');
      return;
    }

    logger.info('Internet connectivity confirmed. Initializing Image Generation Service...');
    imageService = new ImageServiceInterface();
    await imageService.initialize();

    const llmOutputDir = path.join(__dirname, 'test_output', 'llm');
    const imageOutputDir = path.join(__dirname, 'test_output', 'image');

    // Ensure image output directory exists
    await fs.mkdir(imageOutputDir, { recursive: true });

    // Get all LLM output files
    const llmOutputFiles = await fs.readdir(llmOutputDir);

    for (const llmOutputFile of llmOutputFiles) {
      if (llmOutputFile.startsWith('output_test_') && llmOutputFile.endsWith('.json')) {
        try {
          const llmOutputPath = path.join(llmOutputDir, llmOutputFile);
          const llmOutput = JSON.parse(await fs.readFile(llmOutputPath, 'utf8'));

          logger.info(`Processing LLM output: ${llmOutputFile}`);

          // Get test number from filename
          const testNumber = parseInt(llmOutputFile.match(/output_test_(\d+)\.json/)[1]);
          const outputFolder = `output_test_${testNumber}`;
          const promptOutputDir = path.join(imageOutputDir, outputFolder);
          await fs.mkdir(promptOutputDir, { recursive: true });

          // Validate and get scenes
          const scenes = await validateLLMOutput(llmOutput);
          logger.info(`Found ${scenes.length} scenes to process`);

          for (let index = 0; index < scenes.length; index++) {
            try {
              const sceneNumber = index + 1;
              const scene = scenes[index];
              
              logger.info(`Generating image for scene ${sceneNumber}`);
              
              const result = await imageService.process(
                scene.visual_prompt,
                sceneNumber,
                outputFolder,
                true  // isTest parameter
              );

              const stats = await fs.stat(result.filePath);
              if (stats.size > 0) {
                logger.info(`Image generated successfully: ${result.filePath}`);
                logger.info(`Original URL: ${result.originalUrl}`);
                logger.info(`Selected variation URL: ${result.imageUrl}`);
                logger.info(`File size: ${stats.size} bytes`);

                // Verify metadata file
                const metadataPath = path.join(promptOutputDir, 'metadata.json');
                try {
                  const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf8'));
                  if (metadata[`scene_${sceneNumber}`]) {
                    logger.info(`Metadata verified for scene ${sceneNumber}`);
                  } else {
                    logger.warn(`Metadata missing for scene ${sceneNumber}`);
                  }
                } catch (error) {
                  if (error.code !== 'ENOENT') {
                    logger.error(`Error reading metadata for scene ${sceneNumber}:`, error);
                  }
                }
              } else {
                logger.warn(`Generated image file is empty: ${result.filePath}`);
              }

            } catch (error) {
              logger.error(`Error generating image for scene ${sceneNumber}:`, error);
              continue; // Continue with next scene
            }
          }
        } catch (error) {
          logger.error(`Error processing LLM output file ${llmOutputFile}:`, error);
          continue; // Continue with next file
        }
      }
    }

    logger.info('Image generation test completed successfully');
  } catch (error) {
    logger.error('Error in image generation test:', error);
    if (error.stack) {
      logger.error('Stack trace:', error.stack);
    }
  } finally {
    if (imageService) {
      await imageService.cleanup();
    }
  }
}

module.exports = runImageGenTest;

if (require.main === module) {
  runImageGenTest().catch(error => {
    logger.error('Unhandled error in image generation test:', error);
    process.exit(1);
  });
}