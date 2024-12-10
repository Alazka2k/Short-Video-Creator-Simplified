const logger = require('../../../shared/utils/logger');
const assemblyDataAccess = require('../data/assemblyDataAccess');
const assemblyService = require('../assembly-service');

class RenderMonitor {
  constructor() {
    this.PROGRESS_UPDATE_THRESHOLD = 5; // Log every 5% change
  }

  /**
   * Valid transitions:
   * - "none" - No transition
   * - "fade" - Fade in/out
   * - "fade_to_black" - Fade through black
   * - "fade_to_white" - Fade through white
   * - "slide_left" - Slide to left
   * - "slide_right" - Slide to right
   * - "slide_up" - Slide upwards
   * - "slide_down" - Slide downwards
   * - "zoom_in" - Zoom into next scene
   * - "zoom_out" - Zoom out to next scene
   * 
   * Supported file formats:
   * Video:
   * - MP4 (h264 codec)
   * - WebM
   * - MOV
   * 
   * Image:
   * - PNG
   * - JPEG/JPG
   * - WebP
   * 
   * Audio:
   * - MP3
   * - WAV
   * - AAC
   * - M4A
   */
  async monitorRender(movie, jobId, projectId) {
    try {
      let lastProgress = 0;
      const startTime = Date.now();

      await movie
        .waitToFinish((status) => {
          // Calculate progress percentage
          const currentProgress = Math.round(status.movie.progress * 100);
          
          // Only log if progress changed significantly (>5%)
          if (currentProgress - lastProgress >= this.PROGRESS_UPDATE_THRESHOLD) {
            const timeElapsed = this.getTimeElapsed(startTime);
            
            logger.info('Render progress update:', {
              jobId,
              projectId,
              progress: `${currentProgress}%`,
              status: status.movie.status,
              message: status.movie.message,
              timeElapsed: `${timeElapsed}s`,
              details: this.getProgressDetails(status, timeElapsed)
            });

            // Update progress in database
            this.updateProgress(jobId, {
              progress: currentProgress,
              status: status.movie.status,
              details: this.getProgressDetails(status, timeElapsed)
            });

            lastProgress = currentProgress;
          }
        })
        .then(async (status) => this.handleRenderSuccess(status, jobId, projectId, startTime))
        .catch(async (error) => this.handleRenderFailure(error, jobId, projectId, startTime, lastProgress));
    } catch (error) {
      logger.error(`Error monitoring render progress for job ${jobId}:`, error);
      throw error;
    }
  }

  async handleRenderSuccess(status, jobId, projectId, startTime) {
    const timeElapsed = this.getTimeElapsed(startTime);
    logger.info(`Render completed for job ${jobId}:`, {
      projectId,
      url: status.movie.url,
      duration: `${timeElapsed}s`
    });

    const assembly = await assemblyDataAccess.getAssemblyByJobId(jobId);
    const metadata = {
      status: 'completed',
      job_id: jobId,
      metadata: {
        completedAt: new Date().toISOString(),
        duration: timeElapsed,
        finalStats: {
          framesProcessed: status.movie.frames_processed,
          totalFrames: status.movie.frames_total
        }
      }
    };

    // Update database and save local copy
    await assemblyDataAccess.updateAssemblyOutput(assembly.assembly_id, metadata, status.movie.url);
  }

  async handleRenderFailure(error, jobId, projectId, startTime, lastProgress) {
    const timeElapsed = this.getTimeElapsed(startTime);
    logger.error(`Render failed for job ${jobId}:`, {
      projectId,
      error,
      timeElapsed: `${timeElapsed}s`
    });

    const assembly = await assemblyDataAccess.getAssemblyByJobId(jobId);
    await assemblyDataAccess.updateAssemblyOutput(assembly.assembly_id, {
      status: 'failed',
      job_id: jobId,
      metadata: {
        error: error.message,
        failedAt: new Date().toISOString(),
        timeElapsed,
        lastProgress
      }
    });
  }

  async updateProgress(jobId, progressData) {
    try {
      const assembly = await assemblyDataAccess.getAssemblyByJobId(jobId);
      await assemblyDataAccess.updateAssemblyOutput(assembly.assembly_id, {
        status: 'processing',
        metadata: {
          progress: progressData.progress,
          status: progressData.status,
          updatedAt: new Date().toISOString(),
          ...progressData.details
        }
      });
    } catch (error) {
      logger.error(`Error updating assembly progress for job ${jobId}:`, error);
    }
  }

  getTimeElapsed(startTime) {
    return Math.round((Date.now() - startTime) / 1000);
  }

  getProgressDetails(status, timeElapsed) {
    return {
      framesProcessed: status.movie.frames_processed,
      framesTotal: status.movie.frames_total,
      timeElapsed,
      estimatedTimeRemaining: status.movie.estimated_time_remaining,
      currentStep: status.movie.current_step,
      lastMessage: status.movie.message
    };
  }
}

module.exports = new RenderMonitor(); 