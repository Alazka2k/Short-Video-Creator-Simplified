const { ElevenLabsClient } = require('elevenlabs');
const fs = require('fs');
const fsPromises = require('fs').promises;
const path = require('path');
const config = require('../../shared/utils/config');
const logger = require('../../shared/utils/logger');
const VoiceDataAccess = require('./data/voiceDataAccess');
const storageService = require('../../shared/utils/storage');

class VoiceGenService {
  constructor() {
    logger.info('Initializing VoiceGenService');
    this.client = new ElevenLabsClient({
      apiKey: config.voiceGen.apiKey,
      timeoutMs: 120000 // 2 minutes timeout
    });
    this.modelId = config.voiceGen.modelId;
    this.voiceDataAccess = VoiceDataAccess;
    
    logger.info(`Voice Generation Provider: ElevenLabs`);
    logger.info(`ElevenLabs API Key: ${config.voiceGen.apiKey ? 'Loaded' : 'Missing'}`);
    logger.info(`Model ID: ${this.modelId}`);
  }

  async generateVoice(text, sceneIndex, jobId, elevenlabsVoiceId = null, isTest = false) {
    const maxRetries = 3;
    let attempt = 0;
    let lastError = null;
    
    while (attempt < maxRetries) {
      attempt++;
      try {
        logger.info(`Generating voice for text: "${text.substring(0, 50)}..." (Attempt ${attempt}/${maxRetries})`);
        logger.debug('Voice generation parameters:', { sceneIndex, jobId, elevenlabsVoiceId, isTest });
        
        if (!elevenlabsVoiceId) {
          throw new Error('ElevenLabs Voice ID is required but was not provided');
        }

        try {
          const voicesResponse = await this.client.voices.getAll();
          const voicesList = Array.isArray(voicesResponse) ? voicesResponse : voicesResponse.voices;
          
          if (!voicesList || !Array.isArray(voicesList)) {
            logger.error('Unexpected voice list format:', voicesResponse);
            throw new Error('Failed to get valid voice list from ElevenLabs');
          }

          const voiceExists = voicesList.some(voice => voice.voice_id === elevenlabsVoiceId);
          
          if (!voiceExists) {
            throw new Error(`Voice ID ${elevenlabsVoiceId} does not exist in ElevenLabs`);
          }
        } catch (error) {
          logger.error('Error validating ElevenLabs voice:', error);
          throw new Error(`Failed to validate ElevenLabs voice ID: ${error.message}`);
        }

        logger.info(`Using ElevenLabs voice ID: ${elevenlabsVoiceId}`);

        // Generate voice stream
        const audioStream = await this.client.generate({
          voice: elevenlabsVoiceId,
          text: text,
          model_id: this.modelId,
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
          modelId: this.modelId,
          generatedAt: new Date().toISOString()
        });

        // Upload to S3
        const storageResult = await storageService.uploadFile(
          voiceFilePath, 
          'voice'
        );

        // If this is a test, return test response
        if (isTest) {
          return {
            filePath: voiceFilePath,
            fileName: path.basename(voiceFilePath),
            elevenlabsVoiceId: elevenlabsVoiceId,
            storageKey: storageResult.storageKey,
            publicUrl: storageResult.url,
            status: 'completed',
            metadata: {
              text,
              modelId: this.modelId,
              generatedAt: new Date().toISOString()
            }
          };
        }

        // Prepare data for database
        const voiceData = {
          tempFilePath: voiceFilePath,
          elevenlabsVoiceId: elevenlabsVoiceId,
          duration: writeResult.duration,
          storageKey: storageResult.storageKey,
          publicUrl: storageResult.url,
          metadata: {
            text,
            modelId: this.modelId,
            generatedAt: new Date().toISOString()
          }
        };

        // Create database record
        const voiceRecord = await this.voiceDataAccess.createVoiceOutput(
          jobId, 
          sceneIndex, 
          voiceData
        );

        return {
          filePath: voiceFilePath,
          fileName: path.basename(voiceFilePath),
          elevenlabsVoiceId: elevenlabsVoiceId,
          storageKey: storageResult.storageKey,
          publicUrl: storageResult.url,
          status: 'completed',
          metadata: {
            text,
            modelId: this.modelId,
            generatedAt: new Date().toISOString()
          }
        };

      } catch (error) {
        lastError = error;
        
        // Check if this is a rate limit error (HTTP 429)
        const isRateLimitError = 
          error.message?.includes('Status code: 429') || 
          error.statusCode === 429 ||
          error.status === 429;
          
        if (isRateLimitError && attempt < maxRetries) {
          // For rate limit errors, implement exponential backoff
          const delayMs = Math.pow(1, attempt) * 1000; // 2s, 4s, 8s...
          logger.warn(`ElevenLabs rate limit exceeded. Retrying in ${delayMs}ms (Attempt ${attempt}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delayMs));
          continue; // Try again
        }
        
        // If this is the last attempt or not a rate limit error, log and rethrow
        logger.error(`Error generating voice (Attempt ${attempt}/${maxRetries}):`, error);
        throw error;
      }
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