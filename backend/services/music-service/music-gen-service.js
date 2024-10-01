const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const logger = require('../../shared/utils/logger');
const config = require('../../shared/utils/config');
const sunoAuth = require('./suno_auth');

class MusicGenService {
  constructor() {
    this.baseUrl = 'https://suno-api-one-zeta.vercel.app';
    this.musicGenOptions = config.parameters?.musicGen || {};
    logger.info('Initialized MusicGenService with options:', JSON.stringify(this.musicGenOptions, null, 2));
  }

  async generateMusic(musicData, isTest = false) {
    try {
      logger.info(`Generating music for title: "${musicData.title}"`);
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
      logger.info('Request headers:', JSON.stringify(headers, null, 2));
  
      const response = await axios.post(endpoint, payload, { headers });
  
      logger.debug('API response:', JSON.stringify(response.data, null, 2));
  
      if (!response.data || !Array.isArray(response.data) || response.data.length === 0) {
        throw new Error('Invalid response from music generation API');
      }
  
      logger.info('Music generation task initiated successfully');
      const generationResult = response.data[0];

      const musicInfo = await this.waitForMusicGeneration(generationResult.id);
      
      const { outputPath, metadataPath } = this.getOutputPaths(isTest);
      await this.downloadMusic(musicInfo.audio_url, outputPath);
      await this.saveMusicMetadata(metadataPath, path.basename(outputPath), musicData);

      return {
        filePath: outputPath,
        fileName: path.basename(outputPath),
        audioUrl: musicInfo.audio_url
      };
    } catch (error) {
      logger.error('Error generating music:', error);
      throw error;
    }
  }

  getOutputPaths(isTest) {
    let outputPath, metadataPath;

    if (isTest) {
      const testOutputDir = path.join(__dirname, '..', '..', '..', 'tests', 'test_output', 'music');
      outputPath = path.join(testOutputDir, `background_music.mp3`);
      metadataPath = path.join(testOutputDir, 'metadata.json');
    } else {
      const currentDate = new Date();
      const dateString = currentDate.toISOString().split('T')[0];
      const timeString = currentDate.toTimeString().split(' ')[0].replace(/:/g, '-');
      const promptDir = path.join(config.output.directory, 'music', `${dateString}_${timeString}`, `prompt_1`);
      outputPath = path.join(promptDir, `background_music.mp3`);
      metadataPath = path.join(promptDir, 'metadata.json');
    }

    return { outputPath, metadataPath };
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
      logger.info(`Params: ${JSON.stringify(params, null, 2)}`);
  
      const response = await axios.get(endpoint, {
        params: params,
        headers: this.getHeaders()
      });
  
      logger.debug('Full API response payload:', response.data);
  
      if (!response.data || !Array.isArray(response.data) || response.data.length === 0) {
        logger.error('Invalid response from get music info API:', JSON.stringify(response.data, null, 2));
        throw new Error('Invalid response from get music info API');
      }
  
      const musicInfo = response.data[0];
      if (!musicInfo) {
        logger.error('Music info not found in API response:', JSON.stringify(response.data, null, 2));
        throw new Error('Music info not found in API response');
      }
  
      logger.info(`Received music info: ${JSON.stringify(musicInfo, null, 2)}`);
      return musicInfo;
    } catch (error) {
      logger.error('Error getting music info:', error);
      throw error;
    }
  }

  async downloadMusic(audioUrl, outputPath) {
    try {
      logger.info(`Downloading music from URL: ${audioUrl}`);
      logger.info(`Saving to path: ${outputPath}`);

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
    let metadata = {
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

  async getQuotaInfo() {
    try {
      const endpoint = `${this.baseUrl}/api/get_limit`;
      logger.info(`Calling endpoint: ${endpoint}`);

      const response = await axios.get(endpoint, {
        headers: this.getHeaders()
      });
      logger.debug('API response:', JSON.stringify(response.data, null, 2));
      return response.data;
    } catch (error) {
      logger.error('Error getting quota info:', error);
      throw error;
    }
  }

  async checkCookieValidity() {
    try {
      const endpoint = `${this.baseUrl}/api/get`;
      logger.info(`Calling endpoint: ${endpoint}`);

      const response = await axios.get(endpoint, {
        headers: this.getHeaders()
      });
      logger.debug('API response:', JSON.stringify(response.data, null, 2));
      return true;
    } catch (error) {
      if (error.response && error.response.status === 401) {
        logger.error('Cookie is invalid or expired');
        return false;
      }
      logger.error('Error checking cookie validity:', error);
      throw error;
    }
  }
}

module.exports = MusicGenService;