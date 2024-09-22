const axios = require('axios');
const fs = require('fs').promises;
const logger = require('../../shared/utils/logger');
const sunoAuth = require('../auth-service/suno_auth');
const config = require('../../shared/utils/config');

class MusicGenService {
  constructor() {
    this.baseUrl = 'https://suno-api-one-zeta.vercel.app';
    this.musicGenOptions = config.parameters?.musicGen || {};
    logger.info('Initialized MusicGenService with options:', JSON.stringify(this.musicGenOptions, null, 2));
  }

  async generateMusic(musicData, options = {}) {
    try {
      logger.info(`Generating music for title: "${musicData.title}"`);
      
      const makeInstrumental = this.musicGenOptions.make_instrumental === "true" || options.makeInstrumental === true;
      
      const payload = {
        prompt: makeInstrumental ? "" : musicData.lyrics,
        tags: musicData.style,
        title: musicData.title,
        make_instrumental: makeInstrumental,
        wait_audio: options.waitAudio || false,
        mv: this.musicGenOptions.modelId || "chirp-v3-0"
      };

      logger.info(`Make instrumental: ${makeInstrumental}`);
      logger.info(`Payload for music generation:`, JSON.stringify(payload, null, 2));

      const endpoint = `${this.baseUrl}/api/custom_generate`;
      logger.info(`Calling endpoint: ${endpoint}`);
  
      const response = await axios.post(endpoint, payload, {
        headers: this.getHeaders()
      });
  
      logger.debug('API response:', JSON.stringify(response.data, null, 2));
  
      if (!response.data || !Array.isArray(response.data) || response.data.length === 0) {
        logger.error('Invalid response from music generation API:', JSON.stringify(response.data, null, 2));
        throw new Error('Invalid response from music generation API');
      }
  
      logger.info('Music generation task initiated successfully');
      return response.data[0];
    } catch (error) {
      logger.error('Error generating music:', this.formatError(error));
      throw error;
    }
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
      logger.error('Error getting music info:', this.formatError(error));
      throw error;
    }
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

      await fs.writeFile(outputPath, response.data);
      logger.info(`Music downloaded and saved to ${outputPath}`);
    } catch (error) {
      logger.error('Error downloading music:', this.formatError(error));
      throw error;
    }
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
      logger.error('Error getting quota info:', this.formatError(error));
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
      logger.error('Error checking cookie validity:', this.formatError(error));
      throw error;
    }
  }

  getHeaders() {
    return {
      'Cookie': sunoAuth.getCookie(),
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Referer': 'https://suno.com',
      'Origin': 'https://suno.com'
    };
  }

  formatError(error) {
    if (error.message === 'Converting circular structure to JSON') {
      return { message: 'Converting circular structure to JSON' };
    }
    return {
      message: error.message,
      stack: error.stack,
      ...(error.response ? {
        status: error.response.status,
        data: JSON.stringify(error.response.data, null, 2),
        headers: JSON.stringify(error.response.headers, null, 2)
      } : {})
    };
  }
}

module.exports = new MusicGenService();