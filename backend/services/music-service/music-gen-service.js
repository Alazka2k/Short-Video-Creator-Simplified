const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const logger = require('../../shared/utils/logger');
const config = require('../../shared/utils/config');
const MusicDataAccess = require('./data/musicDataAccess');
const storageService = require('../../shared/utils/storage');
const StorageUrlHelper = require('../../shared/utils/storage-url-helper');

class MusicGenService {
  constructor() {
    this.baseUrl = 'https://api.acedata.cloud';
    this.musicGenOptions = config.parameters?.musicGen || {};
    this.dataAccess = MusicDataAccess;
    logger.info('Initialized MusicGenService with options:', JSON.stringify(this.musicGenOptions, null, 2));
  }

  async generateMusic(jobId, musicData, isTest = false) {
    try {
      logger.info(`Generating music for job ${jobId}, title: "${musicData.title}" and prompt: "${musicData.prompt}"`);
      logger.info('Music data:', JSON.stringify(musicData, null, 2));

      const payload = {
        action: 'generate',
        prompt: musicData.prompt,
        title: musicData.title,
        style: musicData.style,
        lyric: musicData.lyric,
        custom: musicData.custom ?? false,
        instrumental: musicData.instrumental ?? true,
        model: this.musicGenOptions.modelId
      };

      if (musicData.style) {
        payload.style = musicData.style;
      }

      if (musicData.lyric) {
        payload.lyric = musicData.lyric;
      }

      logger.info('Payload for music generation:', JSON.stringify(payload, null, 2));

      const endpoint = `${this.baseUrl}/suno/audios`;
      logger.info(`Calling endpoint: ${endpoint}`);

      const response = await axios.post(endpoint, payload, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.musicGen.apiKey}`
        },
        timeout: 300000 // 5 minute timeout
      });

      if (!response.data || !response.data.success || !Array.isArray(response.data.data)) {
        logger.error('Invalid API response:', response.data);
        throw new Error('Invalid response format from music generation API');
      }

      if (response.data.data.length === 0) {
        throw new Error('No music variations generated');
      }

      logger.info('Music generation task completed successfully:', response.data);
      
      // Use the first variation by default
      const selectedVariation = response.data.data[0];

      if (isTest) {
        const { outputPath, metadataPath } = this.getTestOutputPaths();
        await this.downloadMusic(selectedVariation.audio_url, outputPath);
        await this.saveMusicMetadata(metadataPath, path.basename(outputPath), musicData);

        return {
          filePath: outputPath,
          fileName: path.basename(outputPath),
          audioUrl: selectedVariation.audio_url
        };
      } else {
        // Create temp directory for downloaded file
        const tempDir = path.join(os.tmpdir(), 'music-service', jobId);
        await fs.mkdir(tempDir, { recursive: true });
        const tempOutputPath = path.join(tempDir, `temp_${Date.now()}.mp3`);
        
        try {
          await this.downloadMusic(selectedVariation.audio_url, tempOutputPath);
          
          // Upload to storage
          const storageResult = await storageService.uploadFile(tempOutputPath, 'music');
          logger.info('Music uploaded to storage successfully');

          const musicRecord = await this.dataAccess.createMusicOutput(jobId, {
            tempFilePath: tempOutputPath,
            title: musicData.title,
            style: musicData.style,
            instrumental: musicData.instrumental,
            storageKey: storageResult.storageKey,
            publicUrl: storageResult.url,
            metadata: {
              generationId: selectedVariation.id,
              created_at: selectedVariation.created_at,
              generatedAt: new Date().toISOString()
            }
          });

          return {
            filePath: musicRecord.file_path,
            fileName: path.basename(musicRecord.file_path),
            title: musicRecord.title,
            style: musicRecord.style,
            storageKey: musicRecord.storage_key,
            publicUrl: musicRecord.public_url,
            metadata: typeof musicRecord.metadata === 'string' 
              ? JSON.parse(musicRecord.metadata) 
              : musicRecord.metadata
          };
        } catch (error) {
          // Only try to delete the temp file if there was an error
          try {
            await fs.unlink(tempOutputPath);
            logger.info(`Temporary file removed: ${tempOutputPath}`);
          } catch (cleanupError) {
            logger.warn(`Failed to remove temporary file: ${tempOutputPath}`, cleanupError);
          }
          throw error;
        }
      }
    } catch (error) {
      // Clean error object to prevent circular references
      const cleanError = {
        message: error.message,
        name: error.name,
        code: error.code,
        status: error.response?.status,
        statusText: error.response?.statusText
      };

      if (error.response?.data) {
        cleanError.data = typeof error.response.data === 'object' 
          ? JSON.stringify(error.response.data)
          : error.response.data;
      }

      logger.error('Error generating music:', cleanError);

      if (error.code === 'ECONNABORTED' || error.response?.status === 504) {
        throw new Error('Music generation service timed out');
      }

      throw new Error(error.response?.data?.message || error.message);
    }
  }

  async downloadMusic(url, outputPath) {
    try {
      logger.info(`Downloading music from URL: ${url}`);
      const response = await axios({
        method: 'get',
        url: url,
        responseType: 'arraybuffer'
      });

      await fs.mkdir(path.dirname(outputPath), { recursive: true });
      await fs.writeFile(outputPath, response.data);
      logger.info(`Music downloaded and saved to ${outputPath}`);
    } catch (error) {
      logger.error('Error downloading music:', error);
      throw error;
    }
  }

  getTestOutputPaths() {
    const testOutputDir = path.join(__dirname, '..', '..', '..', 'tests', 'test_output', 'music');
    return {
      outputPath: path.join(testOutputDir, `background_music.mp3`),
      metadataPath: path.join(testOutputDir, 'metadata.json')
    };
  }

  async saveMusicMetadata(metadataPath, fileName, musicData) {
    const metadata = {
      musicFile: fileName,
      title: musicData.title,
      style: musicData.style,
      instrumental: musicData.instrumental
    };

    await fs.mkdir(path.dirname(metadataPath), { recursive: true });
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
    logger.info(`Metadata saved to ${metadataPath}`);
  }

  // Database-related methods
  async getMusicByJobId(jobId) {
    return await this.dataAccess.getMusicByJobId(jobId);
  }

  async updateMusicMetadata(musicId, metadata) {
    return await this.dataAccess.updateMusicMetadata(musicId, metadata);
  }

  async deleteMusic(musicId) {
    return await this.dataAccess.deleteMusic(musicId);
  }
}

module.exports = MusicGenService;