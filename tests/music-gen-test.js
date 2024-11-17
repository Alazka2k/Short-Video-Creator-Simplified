const path = require('path');
const fs = require('fs').promises;
const MusicGenService = require('../backend/services/music-service/music-gen-service');
const { getAudioDuration } = require('../backend/shared/utils/audio-utils');
const config = require('../backend/shared/utils/config');
const logger = require('../backend/shared/utils/logger');

async function checkAuthValidity(musicService) {
  logger.info('Checking Suno authentication validity...');

  try {
    const isValid = await musicService.checkCookieValidity();
    if (isValid) {
      const quotaInfo = await musicService.getQuotaInfo();
      logger.info('Successfully accessed Suno API. Quota information:', JSON.stringify(quotaInfo, null, 2));
      return true;
    } else {
      logger.error('Cookie is invalid or expired.');
      return false;
    }
  } catch (error) {
    logger.error('Failed to access Suno API. Authentication may be invalid:', {
      message: error.message,
      status: error.response ? error.response.status : 'Unknown'
    });
    return false;
  }
}

async function validateLLMOutput(llmOutput) {
  if (!llmOutput || typeof llmOutput !== 'object') {
    throw new Error('Invalid LLM output: not an object');
  }

  const music = llmOutput.music;
  if (!music) {
    throw new Error('Invalid LLM output: no music data found');
  }

  return music;
}

async function runMusicGenTest() {
  try {
    logger.info('Starting Suno music generation test');
    logger.info('Music generation options:', JSON.stringify(config.parameters?.musicGen, null, 2));

    const musicService = new MusicGenService();

    // Validate authentication
    const isAuthValid = await checkAuthValidity(musicService);
    if (!isAuthValid) {
      throw new Error('Authentication is not valid');
    }

    const quotaInfo = await musicService.getQuotaInfo();
    logger.info('Quota information:', JSON.stringify(quotaInfo, null, 2));

    if (quotaInfo.credits_left < 10) {
      throw new Error('Not enough credits to generate music');
    }

    // Set up directories
    const testOutputDir = path.join(__dirname, 'test_output');
    const llmOutputDir = path.join(testOutputDir, 'llm');
    const musicOutputDir = path.join(testOutputDir, 'music');

    await fs.mkdir(musicOutputDir, { recursive: true });

    // Get and process LLM output files
    const llmFiles = await fs.readdir(llmOutputDir);
    const llmOutputFiles = llmFiles.filter(file => file.startsWith('output_test_') && file.endsWith('.json'));
    
    logger.info(`Found ${llmOutputFiles.length} LLM output files to process`);

    let successfulGenerations = 0;

    for (const llmFile of llmOutputFiles) {
      try {
        const sceneNumber = parseInt(llmFile.match(/output_test_(\d+)\.json/)[1]);
        logger.info(`Processing LLM output ${sceneNumber}: ${llmFile}`);

        // Read and validate LLM output
        const llmOutputPath = path.join(llmOutputDir, llmFile);
        const llmOutput = JSON.parse(await fs.readFile(llmOutputPath, 'utf8'));
        const musicData = await validateLLMOutput(llmOutput);

        // Set up output paths
        const outputFolder = path.join(musicOutputDir, `output_test_${sceneNumber}`);
        await fs.mkdir(outputFolder, { recursive: true });
        
        const musicFileName = `background_music_${sceneNumber}.mp3`;
        const finalOutputPath = path.join(outputFolder, musicFileName);

        logger.info(`Generating music for test ${sceneNumber}`);
        logger.info('Music data:', JSON.stringify(musicData, null, 2));

        // Generate music
        const result = await musicService.generateMusic({
          ...musicData,
          instrumental: config.parameters?.musicGen?.make_instrumental === "true"
        }, true);

        // Move the file to its final location
        await fs.rename(result.filePath, finalOutputPath);

        // Verify the generated file
        const stats = await fs.stat(finalOutputPath);
        if (stats.size > 0) {
          const musicDuration = await getAudioDuration(finalOutputPath);
          logger.info(`Music file generated successfully: ${finalOutputPath}`);
          logger.info(`File size: ${stats.size} bytes`);
          logger.info(`Duration: ${musicDuration.toFixed(2)} seconds`);

          // Save metadata
          const metadataPath = path.join(outputFolder, 'metadata.json');
          await fs.writeFile(metadataPath, JSON.stringify({
            fileName: musicFileName,
            fileSize: stats.size,
            duration: musicDuration,
            title: musicData.title,
            tags: musicData.tags,
            instrumental: config.parameters?.musicGen?.make_instrumental === "true"
          }, null, 2));

          successfulGenerations++;
        } else {
          throw new Error('Generated music file is empty');
        }

        // Add delay between generations
        if (sceneNumber < llmOutputFiles.length) {
          logger.info('Waiting 5 seconds before next generation...');
          await new Promise(resolve => setTimeout(resolve, 5000));
        }

      } catch (error) {
        logger.error(`Error processing file ${llmFile}:`, {
          message: error.message,
          name: error.name,
          stack: error.stack
        });
      }
    }

    // Log final results
    const totalFiles = llmOutputFiles.length;
    if (successfulGenerations === totalFiles) {
      logger.info('Music generation test completed successfully');
    } else {
      logger.warn(`Music generation test completed with issues. Success rate: ${successfulGenerations}/${totalFiles}`);
    }

  } catch (error) {
    logger.error('Error in music generation test:', {
      message: error.message,
      name: error.name,
      stack: error.stack
    });
    throw error;
  }
}

async function runTestWithTimeout() {
  return Promise.race([
    runMusicGenTest(),
    new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('Test timed out after 15 minutes'));
      }, 900000); // 15 minutes
    })
  ]);
}

module.exports = runMusicGenTest;

if (require.main === module) {
  runTestWithTimeout()
    .catch(error => {
      logger.error('Music generation test failed:', error);
      process.exit(1);
    })
    .finally(() => {
      process.exit(0);
    });
}