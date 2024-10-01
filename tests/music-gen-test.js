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

async function getLLMOutputFiles() {
  const llmOutputDir = path.join(__dirname, 'test_output', 'llm');
  const files = await fs.readdir(llmOutputDir);
  return files
    .filter(file => file.startsWith('output_test_') && file.endsWith('.json'))
    .map(file => path.join(llmOutputDir, file));
}

async function runMusicGenTest() {
  try {
    logger.info('Starting Suno music generation test');
    logger.info('Music generation options:', JSON.stringify(config.parameters?.musicGen, null, 2));

    const musicService = new MusicGenService();

    const isAuthValid = await checkAuthValidity(musicService);
    if (!isAuthValid) {
      logger.error('Authentication is not valid. Aborting test.');
      return;
    }

    const quotaInfo = await musicService.getQuotaInfo();
    logger.info('Quota information:', JSON.stringify(quotaInfo, null, 2));

    if (quotaInfo.credits_left < 10) {
      logger.warn('Not enough credits to generate music. Aborting test.');
      return;
    }

    const testOutputDir = path.join(__dirname, 'test_output', 'music');
    await fs.mkdir(testOutputDir, { recursive: true });

    const llmOutputFiles = await getLLMOutputFiles();
    logger.info(`Found ${llmOutputFiles.length} LLM output files`);

    let successfulGenerations = 0;
    const totalFiles = llmOutputFiles.length;

    for (const [index, llmOutputFile] of llmOutputFiles.entries()) {
      logger.info(`Processing LLM output file ${index + 1}: ${llmOutputFile}`);

      const llmOutput = JSON.parse(await fs.readFile(llmOutputFile, 'utf8'));
      const musicData = llmOutput.music;

      if (!musicData) {
        logger.warn(`No music data found in LLM output file: ${llmOutputFile}`);
        continue;
      }

      logger.info(`Generating music for prompt: "${llmOutput.prompt}"`);
      logger.info(`Music data:`, JSON.stringify(musicData, null, 2));
      
      try {
        const result = await musicService.generateMusic({
          ...musicData,
          instrumental: config.parameters?.musicGen?.make_instrumental === "true"
        }, true);

        logger.info('Music generation completed. Result:', JSON.stringify(result, null, 2));

        const stats = await fs.stat(result.filePath);
        if (stats.size > 0) {
          logger.info(`Music file generated successfully: ${result.filePath}`);
          logger.info(`File size: ${stats.size} bytes`);

          const musicDuration = await getAudioDuration(result.filePath);
          logger.info(`Generated music duration: ${musicDuration.toFixed(2)} seconds`);
          
          successfulGenerations++;
        } else {
          logger.warn(`Generated music file is empty: ${result.filePath}`);
        }
      } catch (error) {
        logger.error('Error in music generation:', {
          message: error.message,
          name: error.name,
          stack: error.stack
        });
      }

      // Add a delay between requests (5 seconds)
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    if (successfulGenerations === totalFiles) {
      logger.info('Suno music generation test completed successfully');
    } else {
      logger.warn(`Suno music generation test completed with issues. Successful generations: ${successfulGenerations}/${totalFiles}`);
    }
  } catch (error) {
    logger.error('Error in Suno music generation test:', {
      message: error.message,
      name: error.name,
      stack: error.stack
    });
  }
}

// Set a timeout to forcibly end the test after 15 minutes
const testTimeout = setTimeout(() => {
  logger.error('Test timed out after 15 minutes. Forcibly ending the process.');
  process.exit(1);
}, 900000);

runMusicGenTest().catch(error => {
  logger.error('Suno music generation test failed:', error.message);
}).finally(() => {
  clearTimeout(testTimeout);
  process.exit(0);
});