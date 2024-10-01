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

  async generateContent(musicData, sceneIndex, isTest = false) {
    logger.info('Generating music content', { musicData, sceneIndex, isTest });
    return await this.service.generateMusic(musicData, sceneIndex, isTest);
  }

  async process(musicData, sceneIndex, isTest = false) {
    logger.info('Processing music generation request', { musicData, sceneIndex, isTest });
    return await this.generateContent(musicData, sceneIndex, isTest);
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

// Start the server if this file is run directly
if (require.main === module) {
  startServer();
}

module.exports = { MusicServiceInterface, startServer };