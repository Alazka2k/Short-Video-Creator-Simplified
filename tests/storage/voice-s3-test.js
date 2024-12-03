const VoiceGenService = require('../../backend/services/voice-service/voice-gen-service');
const storageService = require('../../backend/shared/utils/storage');
const logger = require('../../backend/shared/utils/logger');
const path = require('path');

async function testVoiceS3Integration() {
  try {
    const voiceService = new VoiceGenService();
    const testText = "This is a test voice generation.";
    const sceneIndex = 1;
    const jobId = "test-job-123";

    logger.info('Starting voice generation test with S3 integration');

    const result = await voiceService.generateVoice(
      testText,
      sceneIndex,
      jobId,
      null,
      true // test mode
    );

    logger.info('Voice generation result:', {
      fileName: result.fileName,
      storageKey: result.storageKey,
      publicUrl: result.publicUrl
    });

    // Verify the file exists in S3
    const exists = await storageService.fileExists(result.storageKey);
    logger.info('File exists in S3:', exists);

    return result;
  } catch (error) {
    logger.error('Voice S3 integration test failed:', error);
    throw error;
  }
}

testVoiceS3Integration(); 