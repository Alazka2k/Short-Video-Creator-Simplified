const path = require('path');
const fs = require('fs').promises;
const musicService = require('../backend/services/music-service');
const { getAudioDuration } = require('../backend/shared/utils/audio-utils');
const config = require('../backend/shared/utils/config');
const logger = require('../backend/shared/utils/logger');
const sunoAuth = require('../backend/services/auth-service/suno_auth');

async function checkAuthValidity() {
  logger.info('Checking Suno authentication validity...');

  const sessionId = sunoAuth.getSessionId();
  if (!sessionId) {
    logger.error('Session ID is missing. Please check your configuration.');
    return false;
  }
  logger.info('Session ID is present.');

  const cookie = sunoAuth.getCookie();
  if (!cookie) {
    logger.error('Cookie is missing. Please check your configuration.');
    return false;
  }
  logger.info('Cookie is present.');

  try {
    const quotaInfo = await musicService.getQuotaInfo();
    logger.info('Successfully accessed Suno API. Quota information:', JSON.stringify(quotaInfo, null, 2));
    return true;
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

    await musicService.initialize();

    const isAuthValid = await checkAuthValidity();
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
      
      let generationResult;
      try {
        const makeInstrumental = config.parameters?.musicGen?.make_instrumental === "true";
        logger.info(`Make instrumental: ${makeInstrumental}`);

        generationResult = await musicService.generateMusic(musicData, {
          makeInstrumental: makeInstrumental
        });
        logger.info('Music generation task initiated:', JSON.stringify(generationResult, null, 2));
      } catch (genError) {
        logger.error('Error in music generation step:', {
          message: genError.message,
          name: genError.name,
          stack: genError.stack
        });
        continue;
      }

      const taskId = generationResult.id;

      logger.info('Waiting for music generation to complete...');
      let musicInfo;
      try {
        musicInfo = await musicService.waitForMusicGeneration(taskId, 30, 10000);
        logger.info('Music generation completed. Music info:', JSON.stringify(musicInfo, null, 2));
      } catch (waitError) {
        logger.error('Error waiting for music generation:', {
          message: waitError.message,
          name: waitError.name,
          stack: waitError.stack
        });
        continue;
      }

      if (!musicInfo.audio_url) {
        logger.error('No audio URL provided after music generation');
        continue;
      }

      const outputFileName = `background_music_${index + 1}.mp3`;
      const outputPath = path.join(testOutputDir, outputFileName);
      logger.info(`Downloading music to: ${outputPath}`);
      
      try {
        await musicService.downloadMusic(musicInfo.audio_url, outputPath);

        const stats = await fs.stat(outputPath);
        if (stats.size > 0) {
          logger.info(`Music file generated successfully: ${outputPath}`);
          logger.info(`File size: ${stats.size} bytes`);

          const musicDuration = await getAudioDuration(outputPath);
          logger.info(`Generated music duration: ${musicDuration.toFixed(2)} seconds`);
          
          successfulGenerations++;
        } else {
          logger.warn(`Generated music file is empty: ${outputPath}`);
        }
      } catch (downloadError) {
        logger.error('Error downloading music track:', {
          message: downloadError.message,
          name: downloadError.name,
          stack: downloadError.stack
        });
      }
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
  } finally {
    await musicService.cleanup();
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