const VoiceGenService = require('./voice-gen-service');
const createServer = require('./server');
const logger = require('../../shared/utils/logger');
const config = require('../../shared/utils/config');

class VoiceServiceInterface {
  constructor() {
    logger.info('Initializing VoiceServiceInterface');
    this.service = new VoiceGenService();
    logger.info('VoiceGenService instance created');
  }

  async initialize() {
    logger.info('VoiceServiceInterface initializing');
    // Add any necessary initialization logic here
    logger.info('VoiceServiceInterface initialized');
  }

  async process(text, outputPath, voiceId) {
    logger.info('Processing voice generation request', { textLength: text.length, outputPath, voiceId });
    return await this.service.generateVoice(text, outputPath, voiceId);
  }

  async listVoices() {
    logger.info('Listing available voices');
    return await this.service.listVoices();
  }
}

async function startServer() {
  const voiceServiceInterface = new VoiceServiceInterface();
  await voiceServiceInterface.initialize();

  const PORT = process.env.VOICE_SERVICE_PORT || 3003;
  const app = createServer(voiceServiceInterface);

  app.listen(PORT, () => {
    logger.info(`Voice Service running on port ${PORT}`);
  });
}

// Error handling for unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Error handling for uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
});

// Start the server if this file is run directly
if (require.main === module) {
  startServer().catch(error => {
    logger.error('Failed to start Voice Service:', error);
    process.exit(1);
  });
}

module.exports = { VoiceServiceInterface, startServer };