const logger = require('../../../shared/utils/logger');

class MusicProcessor {
  constructor(musicService, jobDataAccess) {
    this.musicService = musicService;
    this.jobDataAccess = jobDataAccess;
  }

  async generateMusic(jobId, llmResult, parameters, serviceConfig) {
    // If music is skipped, return a skipped status object
    if (serviceConfig.skipMusic) {
      logger.info(`Music generation skipped for job ${jobId}`);
      return { status: 'skipped' };
    }

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
          storageKey: musicResult.storageKey,
          publicUrl: musicResult.publicUrl,
          metadata: musicResult.metadata
        });
        
        // Validate that result has a status property
        if (!musicResult.status) {
          logger.error(`Music service returned result without status for job ${jobId}`);
          throw new Error('Music service result is missing status field');
        }
        
        return musicResult;
      }

      // If musicResult is falsy but no error was thrown, consider it a failure
      logger.error('Music service returned empty result without throwing an error');
      await this.jobDataAccess.updateJobProgress(jobId, 'music', 'failed', {
        error: 'Music service returned empty result'
      });
      return { status: 'failed', error: 'Music service returned empty result' };
    } catch (error) {
      logger.error('Error in music generation:', error);
      await this.jobDataAccess.updateJobProgress(jobId, 'music', 'failed', {
        error: error.message
      });
      return { status: 'failed', error: error.message };
    }
  }
}

module.exports = MusicProcessor; 