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
  }

  async generateVoice(text, outputPath, prompt, sceneIndex, voiceId = config.parameters.voiceGen.defaultVoiceId, isTest = false) {
    try {
      logger.info(`Generating voice for text: "${text.substring(0, 50)}..."`);
      
      const audioStream = await this.client.generate({
        voice: voiceId,
        text: text,
        model_id: config.parameters.voiceGen.modelId,
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