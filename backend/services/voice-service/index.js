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

  async process(text, sceneIndex, voiceId, isTest = false) {
    logger.info('Processing voice generation request', { textLength: text.length, sceneIndex, voiceId, isTest });
    return await this.service.generateVoice(text, sceneIndex, voiceId, isTest);
  }

  async listVoices() {
    logger.info('Listing available voices');
    return await this.service.listVoices();
  }

  async cleanup() {
    logger.info('Cleaning up VoiceServiceInterface');
    // Add any cleanup logic here if needed
  }
}

async function startServer() {
  try {
    logger.info('Starting Voice Service');
    const voiceServiceInterface = new VoiceServiceInterface();
    await voiceServiceInterface.initialize();

    const PORT = process.env.VOICE_SERVICE_PORT || 3003;
    const app = createServer(voiceServiceInterface);

    app.listen(PORT, () => {
      logger.info(`Voice Service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start Voice Service:', error);
    process.exit(1);
  }
}

// Start the server if this file is run directly
if (require.main === module) {
  startServer();
}

module.exports = { VoiceServiceInterface, startServer };