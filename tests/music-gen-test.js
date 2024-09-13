const path = require('path');
const fs = require('fs').promises;
const musicGenService = require('../src/services/music-gen-service');
const voiceGenService = require('../src/services/voice-gen-service');
const { getTotalAudioDuration, getAudioDuration } = require('../src/utils/audio-utils');
const config = require('../src/utils/config');
const logger = require('../src/utils/logger');
const sunoAuth = require('../src/services/suno_auth');

async function generateTestVoiceFiles(outputDir, count = 1) {
  const testTexts = [
    "Welcome to our video about artificial intelligence.",
  ];

  for (let i = 0; i < count; i++) {
    const outputPath = path.join(outputDir, `voice_${i + 1}.mp3`);
    await voiceGenService.generateVoice(
      testTexts[i],
      outputPath,
      "audio_prompt",
      i + 1,
      config.parameters.voiceGen.defaultVoiceId
    );
  }
}

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
    const quotaInfo = await musicGenService.getQuotaInfo();
    logger.info('Successfully accessed Suno API. Quota information:', quotaInfo);
    return true;
  } catch (error) {
    logger.error('Failed to access Suno API. Authentication may be invalid:', {
      message: error.message,
      status: error.response ? error.response.status : 'Unknown'
    });
    return false;
  }
}

async function runMusicGenTest() {
  try {
    logger.info('Starting Suno music generation test');
    logger.info('Suno base URL:', musicGenService.baseUrl);

    const isAuthValid = await checkAuthValidity();
    if (!isAuthValid) {
      logger.error('Authentication is not valid. Aborting test.');
      return;
    }

    const quotaInfo = await musicGenService.getQuotaInfo();
    logger.info('Quota information:', quotaInfo);

    if (quotaInfo.credits_left < 10) {
      logger.warn('Not enough credits to generate music. Aborting test.');
      return;
    }

    const testOutputDir = path.join(__dirname, 'test_output', 'audio');
    await fs.mkdir(testOutputDir, { recursive: true });

    logger.info('Generating test voice files...');
    await generateTestVoiceFiles(testOutputDir);

    const totalVoiceDuration = await getTotalAudioDuration(testOutputDir);
    if (isNaN(totalVoiceDuration) || totalVoiceDuration <= 0) {
      throw new Error(`Invalid total voice duration: ${totalVoiceDuration}`);
    }
    logger.info(`Total duration of voice audio: ${totalVoiceDuration.toFixed(2)} seconds`);

    const testPrompt = "Apocalpse themed song";
    logger.info(`Generating music with prompt: "${testPrompt}", duration: ${totalVoiceDuration.toFixed(2)} seconds`);
    
    let audioUrl;
    try {
      audioUrl = await musicGenService.generateMusic(testPrompt, totalVoiceDuration);
      logger.info('Audio URL retrieved:', audioUrl);
    } catch (genError) {
      logger.error('Error in music generation step:', {
        message: genError.message,
        name: genError.name
      });
      throw genError;
    }

    const outputPath = path.join(testOutputDir, 'background_music.mp3');
    logger.info(`Downloading audio to: ${outputPath}`);
    
    try {
      await musicGenService.downloadMusic(audioUrl, outputPath);

      const stats = await fs.stat(outputPath);
      if (stats.size > 0) {
        logger.info(`Audio file generated successfully: ${outputPath}`);
        logger.info(`File size: ${stats.size} bytes`);

        const musicDuration = await getAudioDuration(outputPath);
        logger.info(`Generated music duration: ${musicDuration.toFixed(2)} seconds`);
      } else {
        logger.warn(`Generated audio file is empty: ${outputPath}`);
      }
    } catch (downloadError) {
      logger.error('Error downloading music track:', {
        message: downloadError.message,
        name: downloadError.name
      });
    }

    logger.info('Suno music generation test completed successfully');
  } catch (error) {
    logger.error('Error in Suno music generation test:', {
      message: error.message,
      name: error.name
    });
  }
}

// Set a timeout to forcibly end the test after 10 minutes
const testTimeout = setTimeout(() => {
  logger.error('Test timed out after 10 minutes. Forcibly ending the process.');
  process.exit(1);
}, 600000);

runMusicGenTest().catch(error => {
  logger.error('Suno music generation test failed:', error.message);
}).finally(() => {
  clearTimeout(testTimeout);
  process.exit(0);
});