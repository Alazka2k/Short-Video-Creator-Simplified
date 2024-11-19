const { ElevenLabsClient } = require('elevenlabs');
const fs = require('fs');
const fsPromises = require('fs').promises;
const path = require('path');
const config = require('../../shared/utils/config');
const logger = require('../../shared/utils/logger');
const VoiceDataAccess = require('./data/voiceDataAccess');

class VoiceGenService {
  constructor() {
    logger.info('Initializing VoiceGenService');
    this.client = new ElevenLabsClient({
      apiKey: config.voiceGen.apiKey,
      timeoutMs: 120000 // 2 minutes timeout
    });
    this.defaultModelId = config.voiceGen.modelId || 'eleven_multilingual_v2';
    this.defaultVoiceId = config.voiceGen.defaultVoiceId || '21m00Tcm4TlvDq8ikWAM';
    this.voiceDataAccess = VoiceDataAccess;
    
    logger.info(`Voice Generation Provider: ElevenLabs`);
    logger.info(`ElevenLabs API Key: ${config.voiceGen.apiKey ? 'Loaded' : 'Missing'}`);
    logger.info(`Default Model ID: ${this.defaultModelId}`);
    logger.info(`Default Voice ID: ${this.defaultVoiceId}`);
  }

  async generateVoice(text, sceneIndex, jobId, voiceId = null, isTest = false) {
    try {
      logger.info(`Generating voice for text: "${text.substring(0, 50)}..."`);
      logger.debug('Voice generation parameters:', { sceneIndex, jobId, voiceId, isTest });
      
      const finalVoiceId = voiceId || this.defaultVoiceId;
      if (!finalVoiceId) {
        throw new Error('No valid voice ID provided or found in config');
      }
      logger.info(`Using voice ID: ${finalVoiceId}`);

      // Generate voice stream
      const audioStream = await this.client.generate({
        voice: finalVoiceId,
        text: text,
        model_id: this.defaultModelId,
        stream: true
      });

      // Setup paths
      const { voiceFilePath, metadataPath } = this.getOutputPaths(sceneIndex, jobId, isTest);
      await fsPromises.mkdir(path.dirname(voiceFilePath), { recursive: true });

      // Write voice file
      const writeResult = await this.writeVoiceFile(audioStream, voiceFilePath);
      
      // Save metadata
      await this.saveVoiceMetadata(metadataPath, sceneIndex, {
        text,
        modelId: this.defaultModelId,
        generatedAt: new Date().toISOString()
      });

      // If this is a test, return test response
      if (isTest) {
        return {
          filePath: voiceFilePath,
          fileName: path.basename(voiceFilePath),
          voiceId: finalVoiceId
        };
      }

      // Prepare data for database
      const voiceData = {
        tempFilePath: voiceFilePath,
        voiceId: finalVoiceId,
        duration: writeResult.duration,
        metadata: {
          text,
          modelId: this.defaultModelId,
          generatedAt: new Date().toISOString()
        }
      };

      // Create database record
      const voiceRecord = await this.voiceDataAccess.createVoiceOutput(jobId, sceneIndex, voiceData);

      // Return standardized response
      return {
        filePath: voiceFilePath,
        fileName: path.basename(voiceFilePath),
        voiceId: finalVoiceId,
        metadata: typeof voiceRecord.metadata === 'string' 
          ? JSON.parse(voiceRecord.metadata) 
          : voiceRecord.metadata
      };

    } catch (error) {
      logger.error('Error generating voice:', error);
      throw error;
    }
  }

  getOutputPaths(sceneIndex, jobId, isTest = false) {
    if (isTest) {
      const testOutputDir = path.join(__dirname, '..', '..', '..', 'tests', 'test_output', 'voice');
      const testFolderPath = path.join(testOutputDir, `output_test_${sceneIndex}`);
      return {
        voiceFilePath: path.join(testFolderPath, `voice_scene_${sceneIndex}.mp3`),
        metadataPath: path.join(testFolderPath, 'metadata.json')
      };
    }

    const currentDate = new Date();
    const dateString = currentDate.toISOString().split('T')[0];
    const folderPath = path.join(config.output.directory, 'voice', dateString, jobId, `scene_${sceneIndex}`);
    return {
      voiceFilePath: path.join(folderPath, `voice_scene_${sceneIndex}.mp3`),
      metadataPath: path.join(folderPath, 'metadata.json')
    };
  }

  async writeVoiceFile(audioStream, outputPath) {
    return new Promise((resolve, reject) => {
      const writeStream = fs.createWriteStream(outputPath);
      const timeout = setTimeout(() => {
        audioStream.destroy();
        writeStream.destroy();
        reject(new Error('Voice generation timed out'));
      }, 180000); // 3 minutes timeout

      audioStream.pipe(writeStream);

      writeStream.on('finish', () => {
        clearTimeout(timeout);
        logger.info(`Voice generated and saved to ${outputPath}`);
        // In a real implementation, you might want to get actual duration
        resolve({ duration: 0 }); 
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
  }

  async saveVoiceMetadata(metadataPath, sceneIndex, metadata) {
    try {
      await fsPromises.mkdir(path.dirname(metadataPath), { recursive: true });
      const metadataContent = {
        [`scene_${sceneIndex}`]: metadata
      };
      await fsPromises.writeFile(metadataPath, JSON.stringify(metadataContent, null, 2));
      logger.info(`Metadata saved to ${metadataPath}`);
    } catch (error) {
      logger.error('Error saving metadata:', error);
      throw error;
    }
  }

  async getVoiceOutputsForJob(jobId) {
    return await this.voiceDataAccess.getVoicesByJobId(jobId);
  }

  async getVoiceOutputForScene(sceneId) {
    return await this.voiceDataAccess.getVoiceBySceneId(sceneId);
  }

  async updateVoiceMetadata(voiceId, metadata) {
    return await this.voiceDataAccess.updateVoiceMetadata(voiceId, metadata);
  }

  async deleteVoice(voiceId) {
    return await this.voiceDataAccess.deleteVoice(voiceId);
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