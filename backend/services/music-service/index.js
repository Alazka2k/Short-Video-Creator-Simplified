const MusicGenService = require('./music-gen-service');

class MusicServiceInterface {
  constructor() {
    this.service = MusicGenService;
  }

  async initialize() {
    // No initialization needed for MusicGenService
    return;
  }

  async generateMusic(musicData, options) {
    return await this.service.generateMusic(musicData, options);
  }

  async getMusicInfo(id) {
    return await this.service.getMusicInfo(id);
  }

  async waitForMusicGeneration(id, maxAttempts, interval) {
    return await this.service.waitForMusicGeneration(id, maxAttempts, interval);
  }

  async downloadMusic(audioUrl, outputPath) {
    return await this.service.downloadMusic(audioUrl, outputPath);
  }

  async getQuotaInfo() {
    return await this.service.getQuotaInfo();
  }

  async checkCookieValidity() {
    return await this.service.checkCookieValidity();
  }

  async cleanup() {
    // No cleanup needed for MusicGenService
    return;
  }
}

module.exports = new MusicServiceInterface();