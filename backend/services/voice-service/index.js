// backend/services/voice-service/index.js

const VoiceGenService = require('./voice-gen-service');

class VoiceServiceInterface {
  constructor() {
    this.service = VoiceGenService;
  }

  async initialize() {
    // No initialization needed for VoiceGenService
  }

  async process(text, outputPath, voiceId) {
    return await this.service.generateVoice(text, outputPath, voiceId);
  }

  async listVoices() {
    return await this.service.listVoices();
  }

  async cleanup() {
    // No cleanup needed for VoiceGenService
  }
}

module.exports = new VoiceServiceInterface();