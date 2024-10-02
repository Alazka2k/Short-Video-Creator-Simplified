const { ElevenLabsClient } = require('elevenlabs');
const fs = require('fs');
const fsPromises = require('fs').promises;
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
    this.defaultVoiceId = config.voiceGen.defaultVoiceId || '21m00Tcm4TlvDq8ikWAM';
    logger.info(`Voice Generation Provider: ElevenLabs`);
    logger.info(`ElevenLabs API Key: ${config.voiceGen.apiKey ? 'Loaded' : 'Missing'}`);
    logger.info(`Default Model ID: ${this.defaultModelId}`);
    logger.info(`Default Voice ID: ${this.defaultVoiceId}`);
  }

  async generateVoice(text, sceneIndex, voiceId, isTest = false) {
    try {
      logger.info(`Generating voice for text: "${text.substring(0, 50)}..."`);
      logger.debug('Voice generation parameters:', { sceneIndex, voiceId, isTest });
      
      const finalVoiceId = voiceId || this.defaultVoiceId;
      
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

      const { outputPath, metadataPath } = this.getOutputPaths(sceneIndex, isTest);

      await fsPromises.mkdir(path.dirname(outputPath), { recursive: true });
      const writeStream = fs.createWriteStream(outputPath);

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          audioStream.destroy();
          writeStream.destroy();
          reject(new Error('Voice generation timed out'));
        }, 180000); // 3 minutes timeout

        audioStream.pipe(writeStream);

        writeStream.on('finish', async () => {
          clearTimeout(timeout);
          logger.info(`Voice generated and saved to ${outputPath}`);
          await this.saveVoiceMetadata(metadataPath, sceneIndex, path.basename(outputPath), finalVoiceId);
          resolve({
            filePath: outputPath,
            fileName: path.basename(outputPath),
            voiceId: finalVoiceId
          });
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

  getOutputPaths(sceneIndex, isTest) {
    let outputPath, metadataPath;

    if (isTest) {
      const testOutputDir = path.join(__dirname, '..', '..', '..', 'tests', 'test_output', 'voice');
      outputPath = path.join(testOutputDir, `voice_scene_${sceneIndex}.mp3`);
      metadataPath = path.join(testOutputDir, 'metadata.json');
    } else {
      const currentDate = new Date();
      const dateString = currentDate.toISOString().split('T')[0];
      const timeString = currentDate.toTimeString().split(' ')[0].replace(/:/g, '-');
      const promptDir = path.join(config.output.directory, 'voice', `${dateString}_${timeString}`, `prompt_1`);
      outputPath = path.join(promptDir, `voice_scene_${sceneIndex}.mp3`);
      metadataPath = path.join(promptDir, 'metadata.json');
    }

    return { outputPath, metadataPath };
  }

  async saveVoiceMetadata(metadataPath, sceneIndex, fileName, voiceId) {
    let metadata = {};
    try {
      const data = await fsPromises.readFile(metadataPath, 'utf8');
      metadata = JSON.parse(data);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        logger.error('Error reading metadata:', error);
      }
    }

    metadata[`scene_${sceneIndex}`] = { 
      voiceFile: fileName,
      voiceId: voiceId
    };

    await fsPromises.mkdir(path.dirname(metadataPath), { recursive: true });
    await fsPromises.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
    logger.info(`Metadata saved to ${metadataPath}`);
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