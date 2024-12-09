const logger = require('../../../shared/utils/logger');

class MusicProcessor {
  constructor(musicService, jobDataAccess) {
    this.musicService = musicService;
    this.jobDataAccess = jobDataAccess;
  }

  async generateMusic(jobId, llmResult, parameters, serviceConfig) {
    if (serviceConfig.skipMusic) return null;

    try {
      const musicResult = await this.musicService.process(
        jobId,
        {
          title: llmResult.content.music.title,
          prompt: llmResult.content.music.prompt,
          style: llmResult.content.music.style,
          lyrics: llmResult.content.music.lyrics,
          instrumental: parameters.musicGenParams?.instrumental ?? true
        }
      );

      if (musicResult) {
        await this.jobDataAccess.updateJobProgress(jobId, 'music', 'completed', {
          filePath: musicResult.filePath,
          storage_key: musicResult.storage_key,
          public_url: musicResult.public_url,
          metadata: musicResult.metadata
        });
      }

      return musicResult;
    } catch (error) {
      logger.error('Error in music generation:', error);
      await this.jobDataAccess.updateJobProgress(jobId, 'music', 'failed', {
        error: error.message
      });
      return null;
    }
  }
}

module.exports = MusicProcessor; 