const { ElevenLabsClient } = require('elevenlabs');
const fs = require('fs');
const path = require('path');
const config = require('../../shared/utils/config');
const logger = require('../../shared/utils/logger');

class VoiceGenService {
  constructor() {
    this.client = new ElevenLabsClient({
      apiKey: config.voiceGen.apiKey
    });
    this.defaultModelId = config.voiceGen.modelId || 'eleven_multilingual_v2';
  }

  async generateVoice(text, outputPath, voiceId) {
    try {
      logger.info(`Generating voice for text: "${text.substring(0, 50)}..."`);
      
      const finalVoiceId = voiceId || config.voiceGen.defaultVoiceId || '21m00Tcm4TlvDq8ikWAM';
      
      if (!finalVoiceId) {
        throw new Error('No valid voice ID provided or found in config');
      }

      const audioStream = await this.client.generate({
        voice: finalVoiceId,
        text: text,
        model_id: this.defaultModelId,
        stream: true
      });

      const outputDir = path.dirname(outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const writeStream = fs.createWriteStream(outputPath);

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