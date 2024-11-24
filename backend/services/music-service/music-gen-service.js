const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const logger = require('../../shared/utils/logger');
const config = require('../../shared/utils/config');
const sunoAuth = require('./suno_auth');
const MusicDataAccess = require('./data/musicDataAccess');

class MusicGenService {
  constructor() {
    this.baseUrl = 'https://suno-api-one-zeta.vercel.app';
    this.musicGenOptions = config.parameters?.musicGen || {};
    this.dataAccess = MusicDataAccess;
    logger.info('Initialized MusicGenService with options:', JSON.stringify(this.musicGenOptions, null, 2));
  }

  async generateMusic(jobId, musicData, isTest = false) {
      try {
        logger.info(`Generating music for job ${jobId}, title: "${musicData.title}"`);
        logger.info('Music data:', JSON.stringify(musicData, null, 2));
        
        const makeInstrumental = musicData.instrumental;
        logger.info(`Make instrumental: ${makeInstrumental}`);
    
        const payload = {
          prompt: makeInstrumental ? "" : musicData.lyrics,
          tags: musicData.tags,
          title: musicData.title,
          make_instrumental: makeInstrumental,
          wait_audio: false,
          mv: this.musicGenOptions.modelId || "chirp-v3-0"
        };
    
        logger.info('Payload for music generation:', JSON.stringify(payload, null, 2));
    
        const endpoint = `${this.baseUrl}/api/custom_generate`;
        logger.info(`Calling endpoint: ${endpoint}`);
    
        const headers = this.getHeaders();
        let response;
        try {
          response = await axios.post(endpoint, payload, { headers });
        } catch (axiosError) {
          // Handle Axios error specifically
          const errorInfo = {
            message: axiosError.message,
            status: axiosError.response?.status,
            statusText: axiosError.response?.statusText,
            data: axiosError.response?.data
          };
          logger.error('Suno API request failed:', errorInfo);
          throw new Error(`Suno API request failed: ${axiosError.message}`);
        }
    
        if (!response.data || !Array.isArray(response.data) || response.data.length === 0) {
          throw new Error('Invalid response from music generation API');
        }
    
        logger.info('Music generation task initiated successfully');
        const generationResult = response.data[0];
        const musicInfo = await this.waitForMusicGeneration(generationResult.id);
        
        if (isTest) {
          const { outputPath, metadataPath } = this.getTestOutputPaths();
          await this.downloadMusic(musicInfo.audio_url, outputPath);
          await this.saveMusicMetadata(metadataPath, path.basename(outputPath), musicData);

          return {
            filePath: outputPath,
            fileName: path.basename(outputPath),
            audioUrl: musicInfo.audio_url
          };
        } else {
          // Production mode with database integration
          const tempOutputPath = await this.createTempFile(musicInfo.audio_url);
          
          const musicRecord = await this.dataAccess.createMusicOutput(jobId, {
            tempFilePath: tempOutputPath,
            title: musicData.title,
            tags: musicData.tags,
            instrumental: makeInstrumental,
            metadata: {
              generationId: generationResult.id,
              audioUrl: musicInfo.audio_url,
              generatedAt: new Date().toISOString()
            }
          });

          // Clean up temp file
          try {
            await fs.unlink(tempOutputPath);
            logger.info(`Temporary file removed: ${tempOutputPath}`);
          } catch (cleanupError) {
            logger.warn(`Failed to remove temporary file: ${tempOutputPath}`, cleanupError);
          }

          return {
            filePath: musicRecord.music_file_url,
            fileName: path.basename(musicRecord.music_file_url),
            title: musicRecord.title,
            tags: musicRecord.tags,
            metadata: typeof musicRecord.metadata === 'string' 
              ? JSON.parse(musicRecord.metadata) 
              : musicRecord.metadata
          };
        }
      } catch (error) {
        // Safe error logging
        const errorInfo = {
          message: error.message,
          name: error.name,
          code: error.code,
          stack: error.stack
        };
        logger.error('Error generating music:', errorInfo);
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

  async createTempFile(audioUrl) {
    const tempDir = path.join(os.tmpdir(), 'music-service');
    await fs.mkdir(tempDir, { recursive: true });
    const tempPath = path.join(tempDir, `temp_${Date.now()}.mp3`);
    await this.downloadMusic(audioUrl, tempPath);
    return tempPath;
  }

  async waitForMusicGeneration(id, maxAttempts = 30, interval = 10000) {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const musicInfo = await this.getMusicInfo(id);
        logger.info(`Music generation status: ${musicInfo.status}`);
        if (musicInfo.status === 'complete' && musicInfo.audio_url) {
          return musicInfo;
        } else if (musicInfo.status === 'failed') {
          throw new Error('Music generation failed');
        } else if (musicInfo.status === 'streaming' && musicInfo.audio_url) {
          return musicInfo;
        }
      } catch (error) {
        logger.warn(`Error fetching music info (attempt ${i + 1}/${maxAttempts}):`, error.message);
      }
      logger.info(`Waiting for music generation... Attempt ${i + 1}/${maxAttempts}`);
      await new Promise(resolve => setTimeout(resolve, interval));
    }
    throw new Error('Music generation timed out');
  }

  async getMusicInfo(id) {
    try {
      const endpoint = `${this.baseUrl}/api/get`;
      const params = { ids: id };
      logger.info(`Calling endpoint: ${endpoint}`);
      
      const response = await axios.get(endpoint, {
        params: params,
        headers: this.getHeaders()
      });
  
      if (!response.data?.length) {
        throw new Error('Invalid response from get music info API');
      }
  
      const musicInfo = response.data[0];
      logger.info(`Received music info for ID ${id}`);
      return musicInfo;
    } catch (error) {
      logger.error('Error getting music info:', error);
      throw error;
    }
  }

  async downloadMusic(audioUrl, outputPath) {
    try {
      logger.info(`Downloading music from URL: ${audioUrl}`);
      const response = await axios({
        method: 'get',
        url: audioUrl,
        responseType: 'arraybuffer',
        headers: this.getHeaders()
      });

      await fs.mkdir(path.dirname(outputPath), { recursive: true });
      await fs.writeFile(outputPath, response.data);
      logger.info(`Music downloaded and saved to ${outputPath}`);
    } catch (error) {
      logger.error('Error downloading music:', error);
      throw error;
    }
  }

  async saveMusicMetadata(metadataPath, fileName, musicData) {
    const metadata = {
      musicFile: fileName,
      title: musicData.title,
      tags: musicData.tags,
      instrumental: musicData.instrumental
    };

    await fs.mkdir(path.dirname(metadataPath), { recursive: true });
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
    logger.info(`Metadata saved to ${metadataPath}`);
  }

  getHeaders() {
    return sunoAuth.getAuthHeaders();
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

  // Service health check methods
  async getQuotaInfo() {
    try {
      const endpoint = `${this.baseUrl}/api/get_limit`;
      const response = await axios.get(endpoint, {
        headers: this.getHeaders()
      });
      return response.data;
    } catch (error) {
      logger.error('Error getting quota info:', error);
      throw error;
    }
  }

  async checkCookieValidity() {
    try {
      const endpoint = `${this.baseUrl}/api/get`;
      await axios.get(endpoint, { headers: this.getHeaders() });
      return true;
    } catch (error) {
      if (error.response?.status === 401) {
        logger.error('Cookie is invalid or expired');
        return false;
      }
      throw error;
    }
  }
}

module.exports = MusicGenService;