const MusicGenService = require('./music-gen-service');
const createServer = require('./server');
const logger = require('../../shared/utils/logger');
const config = require('../../shared/utils/config');

class MusicServiceInterface {
  constructor() {
    logger.info('Initializing MusicServiceInterface');
    this.service = new MusicGenService();
    logger.info('MusicGenService instance created');
  }

  async initialize() {
    logger.info('MusicServiceInterface initializing');
    // Add any necessary initialization logic here
    logger.info('MusicServiceInterface initialized');
  }

  async generateContent(jobId, musicData, isTest = false) {
    logger.info('Generating music content', { jobId, musicData, isTest });
    return await this.service.generateMusic(jobId, musicData, isTest);
  }

  async process(jobId, musicData, isTest = false) {
    logger.info('Processing music generation request', { jobId, musicData, isTest });
    
    // Validate required fields
    if (!jobId && !isTest) {
      throw new Error('jobId is required for production mode');
    }

    if (!musicData.title || !musicData.tags) {
      throw new Error('title and tags are required');
    }

    return await this.generateContent(jobId, musicData, isTest);
  }

  async getMusicByJobId(jobId) {
    return await this.service.getMusicByJobId(jobId);
  }

  async updateMusicMetadata(musicId, metadata) {
    return await this.service.updateMusicMetadata(musicId, metadata);
  }

  async deleteMusic(musicId) {
    return await this.service.deleteMusic(musicId);
  }

  async getQuotaInfo() {
    return await this.service.getQuotaInfo();
  }

  async checkCookieValidity() {
    return await this.service.checkCookieValidity();
  }

  async cleanup() {
    logger.info('Cleaning up MusicServiceInterface');
    // Add any cleanup logic here if needed
  }
}

async function startServer() {
  try {
    logger.info('Starting Music Service');
    const musicServiceInterface = new MusicServiceInterface();
    await musicServiceInterface.initialize();

    const PORT = process.env.MUSIC_SERVICE_PORT || 3004;
    const app = createServer(musicServiceInterface);

    app.listen(PORT, () => {
      logger.info(`Music Service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start Music Service:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = { MusicServiceInterface, startServer };