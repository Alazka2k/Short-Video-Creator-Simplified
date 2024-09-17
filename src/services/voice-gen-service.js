const { ElevenLabsClient } = require('elevenlabs');
const fs = require('fs');
const path = require('path');
const config = require('../utils/config');
const logger = require('../utils/logger');

class VoiceGenService {
  constructor() {
    this.client = new ElevenLabsClient({
      apiKey: config.voiceGen.apiKey
    });
    this.defaultModelId = 'eleven_multilingual_v2'; // Fallback default model ID
  }

  async generateVoice(text, outputPath, prompt, sceneIndex, voiceId, isTest = false) {
    try {
      logger.info(`Generating voice for text: "${text.substring(0, 50)}..."`);
      
      // Use the voiceId passed as an argument, or fall back to the one in config
      const finalVoiceId = voiceId || 
                           (config.parameters && config.parameters.voiceGen && config.parameters.voiceGen.defaultVoiceId) || 
                           '21m00Tcm4TlvDq8ikWAM'; // Fallback default voice ID
      
      if (!finalVoiceId) {
        throw new Error('No valid voice ID provided or found in config');
      }

      // Use modelId from config if available, otherwise use the default
      const modelId = (config.parameters && config.parameters.voiceGen && config.parameters.voiceGen.modelId) || 
                      this.defaultModelId;

      const audioStream = await this.client.generate({
        voice: finalVoiceId,
        text: text,
        model_id: modelId,
        stream: true
      });

      // Ensure the directory exists
      const outputDir = path.dirname(outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // Create a write stream
      const writeStream = fs.createWriteStream(outputPath);

      // Pipe the audio stream to the file
      return new Promise((resolve, reject) => {
        audioStream.pipe(writeStream);
        writeStream.on('finish', () => {
          logger.info(`Voice generated and saved to ${outputPath}`);
          resolve(outputPath);
        });
        writeStream.on('error', (error) => {
          logger.error('Error writing voice file:', error);
          reject(error);
        });
      });
    } catch (error) {
      logger.error('Error generating voice:', error);
      throw error;
    }
  }

  async listVoices() {
    try {
      const voices = await this.client.voices.getAll();
      return voices;
    } catch (error) {
      logger.error('Error listing voices:', error);
      throw error;
    }
  }
}

module.exports = new VoiceGenService();