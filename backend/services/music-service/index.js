const MusicGenService = require('./music-gen-service');
const createServer = require('./server');
const logger = require('../../shared/utils/logger');
const config = require('../../shared/utils/config');
const StorageUrlHelper = require('../../shared/utils/storage-url-helper');

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
    const result = await this.service.generateMusic(jobId, {
      ...musicData,
      style: typeof musicData.style === 'string' 
        ? musicData.style.substring(0, 120)  // Ensure style is not longer than 120 chars
        : '',
      instrumental: musicData.instrumental ?? true
    }, isTest);
    
    // If not test mode, refresh URLs before returning
    if (!isTest) {
      return await StorageUrlHelper.refreshUrlsInObject(result);
    }
    return result;
  }

  async process(jobId, musicData, isTest = false) {
    logger.info('Processing music generation request', { jobId, musicData, isTest });
    
    // Validate required fields
    if (!jobId && !isTest) {
      throw new Error('jobId is required for production mode');
    }

    if (!musicData.prompt) {
      throw new Error('prompt is required');
    }

    if (!musicData.prompt) {
      throw new Error('prompt is required');
    }

    return await this.generateContent(jobId, musicData, isTest);
  }

  async getMusicByJobId(jobId) {
    const music = await this.service.getMusicByJobId(jobId);
    if (music) {
      return await StorageUrlHelper.refreshUrlsInObject(music);
    }
    return music;
  }

  async updateMusicMetadata(musicId, metadata) {
    return await this.service.updateMusicMetadata(musicId, metadata);
  }

  async deleteMusic(musicId) {
    return await this.service.deleteMusic(musicId);
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

    const PORT = process.env.MUSIC_SERVICE_PORT || 3006;
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