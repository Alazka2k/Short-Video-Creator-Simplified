const axios = require('axios');
const fs = require('fs').promises;
const logger = require('../utils/logger');
const sunoAuth = require('./suno_auth');

class MusicGenService {
  constructor() {
    this.baseUrl = 'https://suno-api-one-zeta.vercel.app/';
  }

  async generateMusic(lyrics, style, title, durationSeconds, options = {}) {
    try {
      logger.info(`Generating music for title: "${title}" with duration: ${durationSeconds} seconds`);
      
      const payload = {
        prompt: lyrics,
        tags: style,
        title: title,
        make_instrumental: options.makeInstrumental || false,
        wait_audio: true,
        mv: "chirp-v3-0"
      };
  
      const response = await axios.post(`${this.baseUrl}/api/generate/`, payload, {
        headers: this.getHeaders()
      });
  
      // Log the full response for debugging
      logger.debug('API response:', response.data);
  
      // Adjust to the actual response structure
      const audioData = response.data.find(item => item.audio_url);
      if (!audioData) {
        logger.error('No audio data in the response:', response.data);
        throw new Error('No audio data in the response');
      }
  
      logger.info('Music generation task initiated successfully');
      return audioData.audio_url; // Return the audio URL
    } catch (error) {
      logger.error('Error generating music:', this.formatError(error));
      throw error;
    }
  }

  async downloadMusic(audioUrl, outputPath) {
    try {
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
      const response = await axios.get(`${this.baseUrl}/api/get_limit`, {
        headers: this.getHeaders()
      });
      return response.data;
    } catch (error) {
      logger.error('Error getting quota info:', this.formatError(error));
      throw error;
    }
  }

  async checkCookieValidity() {
    try {
      const response = await axios.get(`${this.baseUrl}/api/get`, {
        headers: this.getHeaders()
      });
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
        data: error.response.data,
        headers: error.response.headers
      } : {})
    };
  }
}

module.exports = new MusicGenService();