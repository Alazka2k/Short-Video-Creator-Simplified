// backend/services/voice-service/index.js

const VoiceGenService = require('./voice-gen-service');
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
    // No initialization needed for VoiceGenService, but we can add checks here if needed
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

  async cleanup() {
    logger.info('Cleaning up VoiceServiceInterface');
    // No cleanup needed for VoiceGenService, but we can add any necessary cleanup logic here
  }

  startServer() {
    const PORT = process.env.VOICE_SERVICE_PORT || 3003;
    const app = createServer(this);
    
    app.use((req, res, next) => {
      logger.info(`Received ${req.method} request on ${req.path}`);
      next();
    });

    app.listen(PORT, () => {
      logger.info(`Voice Service running on port ${PORT}`);
    });
  }
}

const voiceServiceInterface = new VoiceServiceInterface();

// Initialize and start the server if this file is run directly
if (require.main === module) {
  voiceServiceInterface.initialize().then(() => {
    voiceServiceInterface.startServer();
  }).catch(error => {
    logger.error('Failed to initialize Voice Service:', error);
    process.exit(1);
  });
}

module.exports = voiceServiceInterface;