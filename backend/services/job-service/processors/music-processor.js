const logger = require('../../../shared/utils/logger');

class MusicProcessor {
  constructor(musicService, jobDataAccess, progressTracker) {
    this.musicService = musicService;
    this.jobDataAccess = jobDataAccess;
    this.progressTracker = progressTracker;
  }

  async generateMusic(jobId, llmResult, parameters, serviceConfig) {
    // If music is skipped, return a skipped status object
    if (serviceConfig.skipMusic) {
      logger.info(`Music generation skipped for job ${jobId}`);
      return { status: 'skipped' };
    }

    const musicData = {
      title: llmResult.content.music.title,
      prompt: llmResult.content.music.prompt,
      style: llmResult.content.music.style,
      lyrics: llmResult.content.music.lyrics,
      instrumental: parameters.musicGenParams?.instrumental ?? true
    };

    let fakeProgressInterval;

    try {
      // --- Start Realistic Progress Simulation ---
      let progressData = this.progressTracker.updateServiceProgress(jobId, 'music', 5, 'in_progress');
      await this.jobDataAccess.updateJobProgress(jobId, progressData);
      
      const updates = [
        { delay: 30000, progress: 15 }, // 30 seconds
        { delay: 30000, progress: 30 }, // 60 seconds
        { delay: 30000, progress: 45 }, // 90 seconds total
        { delay: 30000, progress: 60 }, // 120 seconds total
        { delay: 30000, progress: 75 }, // 150 seconds total
        { delay: 30000, progress: 80 }, // 180 seconds total
        { delay: 30000, progress: 85 }, // 210 seconds total
        { delay: 30000, progress: 90 } // 240 seconds total
      ];

      let completed = false;
      const runUpdates = async () => {
        for (const update of updates) {
          await new Promise(resolve => setTimeout(resolve, update.delay));
          if (completed) return; // Stop if the real process finished
          progressData = this.progressTracker.updateServiceProgress(jobId, 'music', update.progress, 'in_progress');
          await this.jobDataAccess.updateJobProgress(jobId, progressData);
        }
      };
      
      runUpdates();
      // --- End Simulation ---

      let musicResult;
      try {
        musicResult = await this.musicService.process(jobId, musicData, false);
      } catch (error) {
        if (error.code === 'ECONNABORTED') {
          logger.warn(`Music generation for job ${jobId} timed out. Retrying once...`);
          try {
            musicResult = await this.musicService.process(jobId, musicData, true); // isRetry = true
          } catch (retryError) {
            logger.error(`Music generation retry failed for job ${jobId}:`, retryError);
            throw retryError; // Throw the retry error to be caught by the outer block
          }
        } else {
          throw error; // Re-throw other errors
        }
      }
      
      completed = true; // Signal that the real process is done

      if (musicResult) {
        // --- Persist Music Result ---
        const job = await this.jobDataAccess.getJob(jobId);
        const metadata = job.metadata || {};
        metadata.music = musicResult;
        await this.jobDataAccess.updateJob(jobId, { metadata: JSON.stringify(metadata) });
        logger.info(`Persisted musicResult to metadata for job ${jobId}`);
        // --- End Persist ---

        // Final update to 100% 'completed'
        progressData = this.progressTracker.updateServiceProgress(jobId, 'music', 100, 'completed', {
          filePath: musicResult.filePath,
          storageKey: musicResult.storageKey,
          publicUrl: musicResult.publicUrl,
          metadata: musicResult.metadata
        });
        await this.jobDataAccess.updateJobProgress(jobId, progressData);
        
        // Validate that result has a status property
        if (!musicResult.status) {
          logger.error(`Music service returned result without status for job ${jobId}`);
          throw new Error('Music service result is missing status field');
        }
        
        return musicResult;
      }

      // If musicResult is falsy but no error was thrown, consider it a failure
      logger.error('Music service returned empty result without throwing an error');
      progressData = this.progressTracker.updateServiceProgress(jobId, 'music', 100, 'failed', {
        error: 'Music service returned empty result'
      });
      await this.jobDataAccess.updateJobProgress(jobId, progressData);
      return { status: 'failed', error: 'Music service returned empty result' };
    } catch (error) {
      completed = true; // Stop simulation on error too
      logger.error('Error in music generation:', error);
      
      const errorResult = { status: 'failed', error: error.message };
      
      // Persist the failure to the metadata object
      const job = await this.jobDataAccess.getJob(jobId);
      const metadata = job.metadata || {};
      metadata.music = errorResult;
      
      // Also update the top-level error columns on the job table
      await this.jobDataAccess.updateJob(jobId, { 
        metadata: JSON.stringify(metadata),
        error: error.message,
        error_type: 'MUSIC_GENERATION_FAILURE'
      });
      logger.info(`Persisted music failure to metadata and job table for job ${jobId}`);

      progressData = this.progressTracker.updateServiceProgress(jobId, 'music', 100, 'failed', {
        error: error.message
      });
      await this.jobDataAccess.updateJobProgress(jobId, progressData);
      return errorResult;
    }
  }
}

module.exports = MusicProcessor; 