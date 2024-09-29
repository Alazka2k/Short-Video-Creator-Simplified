const { ElevenLabsClient } = require('elevenlabs');
const fs = require('fs');
const path = require('path');
const config = require('../../shared/utils/config');
const logger = require('../../shared/utils/logger');

class VoiceGenService {
  constructor() {
    logger.info('Initializing VoiceGenService');
    this.client = new ElevenLabsClient({
      apiKey: config.voiceGen.apiKey,
      timeoutMs: 120000 // 2 minutes timeout
    });
    this.defaultModelId = config.voiceGen.modelId || 'eleven_multilingual_v2';
    logger.info(`Voice Generation Provider: ElevenLabs`);
    logger.info(`ElevenLabs API Key: ${config.voiceGen.apiKey ? 'Loaded' : 'Missing'}`);
    logger.info(`Default Model ID: ${this.defaultModelId}`);
  }

  async generateVoice(text, outputPath, voiceId) {
    try {
      logger.info(`Generating voice for text: "${text.substring(0, 50)}..."`);
      logger.debug('Voice generation parameters:', { outputPath, voiceId });
      
      const finalVoiceId = voiceId || config.voiceGen.defaultVoiceId || '21m00Tcm4TlvDq8ikWAM';
      
      if (!finalVoiceId) {
        throw new Error('No valid voice ID provided or found in config');
      }

      logger.info(`Using voice ID: ${finalVoiceId}`);

      const audioStream = await this.client.generate({
        voice: finalVoiceId,
        text: text,
        model_id: this.defaultModelId,
        stream: true
      });

      const outputDir = path.dirname(outputPath);
      if (!fs.existsSync(outputDir)) {
        logger.info(`Creating output directory: ${outputDir}`);
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const writeStream = fs.createWriteStream(outputPath, { highWaterMark: 1024 * 1024 }); // 1MB buffer

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          audioStream.destroy();
          writeStream.destroy();
          reject(new Error('Voice generation timed out'));
        }, 180000); // 3 minutes timeout

        audioStream.pipe(writeStream);

        writeStream.on('finish', () => {
          clearTimeout(timeout);
          logger.info(`Voice generated and saved to ${outputPath}`);
          resolve(outputPath);
        });

        writeStream.on('error', (error) => {
          clearTimeout(timeout);
          logger.error('Error writing voice file:', error);
          reject(error);
        });

        audioStream.on('error', (error) => {
          clearTimeout(timeout);
          logger.error('Error in audio stream:', error);
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
      logger.info('Fetching list of available voices');
      const voices = await this.client.voices.getAll();
      logger.info(`Retrieved ${voices.length} voices`);
      return voices;
    } catch (error) {
      logger.error('Error listing voices:', error);
      throw error;
    }
  }
}

module.exports = VoiceGenService;