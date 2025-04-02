/**
 * Progress Tracker Utility
 * 
 * Manages tracking and calculating progress for job processing.
 * Stores progress data for each job and provides methods to update and retrieve it.
 */

const logger = require('../../../shared/utils/logger');

class ProgressTracker {
  constructor() {
    // Store progress data for active jobs
    this.progressData = new Map();
  }

  /**
   * Initialize job progress tracking for a new job
   * @param {string} jobId - The unique job ID
   * @param {Object} serviceConfig - The service configuration
   * @param {number} scenesCount - Number of scenes in the job
   */
  initJobProgress(jobId, serviceConfig, scenesCount) {
    if (!jobId) {
      throw new Error('Job ID is required for progress tracking');
    }
    
    // Check if this is an LLM-only job (all other services skipped)
    const isLlmOnlyJob = serviceConfig.skipVoice && 
                        serviceConfig.skipImage && 
                        serviceConfig.skipMusic && 
                        serviceConfig.skipVisualization;
    
    // Calculate weights for each service
    const weights = {
      llm: 10,             // LLM is always 10%
      music: 10,           // Music is 10% if used
      scene: 80 / scenesCount  // Remaining 80% divided among scenes
    };
    
    // Create list of services that will be used in this job
    const services = ['llm']; // LLM is always included
    if (!serviceConfig.skipMusic) services.push('music');
    
    // Initialize progress data for this job
    this.progressData.set(jobId, {
      startTime: new Date(),
      services,
      weights,
      scenesCount,
      serviceProgress: {},
      sceneProgress: {},  // Initialize empty scene progress object
      overallProgress: 0,
      status: 'in_progress',
      lastUpdated: new Date()
    });
    
    // For LLM-only jobs, log appropriate message
    if (isLlmOnlyJob) {
      logger.info(`Initialized progress for LLM-only job ${jobId}`);
    } else {
      logger.info(`Initialized progress for job ${jobId} with ${scenesCount} scenes`);
    }
    
    return this.progressData.get(jobId);
  }

  /**
   * Update progress for a specific service
   * @param {string} jobId - The job ID
   * @param {string} service - The service name (llm, image, voice, etc.)
   * @param {number} progress - Progress value between 0-100
   * @param {string} status - Service status (started, in_progress, completed, failed)
   * @param {Object} metadata - Additional metadata about the progress
   */
  updateServiceProgress(jobId, service, progress, status, metadata = {}) {
    const jobProgress = this.progressData.get(jobId);
    
    if (!jobProgress) {
      logger.warn(`Tried to update progress for unknown job ${jobId}`);
      return null;
    }

    // Update service progress
    jobProgress.serviceProgress[service] = {
      progress,
      status,
      ...metadata,
      lastUpdated: new Date()
    };

    // Recalculate overall progress
    this._recalculateProgress(jobProgress);
    
    return this.getJobProgress(jobId);
  }

  /**
   * Update progress for a specific scene
   * @param {string} jobId - The job ID
   * @param {number} sceneId - The scene ID
   * @param {string} service - The service name (image, voice, visualization)
   * @param {number} progress - Progress value between 0-100
   * @param {string} status - Service status (started, in_progress, completed, failed)
   * @param {Object} metadata - Additional metadata about the progress
   */
  updateSceneProgress(jobId, sceneId, service, progress, status, metadata = {}) {
    let jobProgress = this.progressData.get(jobId);
    
    // If job progress doesn't exist, initialize it with default values
    if (!jobProgress) {
      jobProgress = {
        startTime: new Date(),
        services: ['llm'], // Default services
        weights: {
          llm: 10,
          music: 10,
          scene: 80
        },
        scenesCount: 1, // Default to 1 scene
        serviceProgress: {},
        sceneProgress: {},
        overallProgress: 0,
        status: 'in_progress',
        lastUpdated: new Date()
      };
      this.progressData.set(jobId, jobProgress);
    }

    // Ensure sceneProgress exists
    if (!jobProgress.sceneProgress) {
      jobProgress.sceneProgress = {};
    }

    // Initialize scene progress if it doesn't exist
    if (!jobProgress.sceneProgress[sceneId]) {
      jobProgress.sceneProgress[sceneId] = {};
    }

    // Update scene service progress
    jobProgress.sceneProgress[sceneId][service] = {
      progress,
      status,
      ...metadata,
      lastUpdated: new Date()
    };

    // Recalculate overall progress
    this._recalculateProgress(jobProgress);
    
    return this.getJobProgress(jobId);
  }

  /**
   * Set the job status
   * @param {string} jobId - The job ID
   * @param {string} status - The job status (in_progress, completed, failed)
   */
  setJobStatus(jobId, status) {
    const jobProgress = this.progressData.get(jobId);
    
    if (!jobProgress) {
      logger.warn(`Tried to set status for unknown job ${jobId}`);
      return null;
    }

    jobProgress.status = status;
    jobProgress.lastUpdated = new Date();
    
    if (status === 'completed' || status === 'failed') {
      jobProgress.endTime = new Date();
      // Eventually we may want to clean up memory by removing completed jobs
      // this.progressData.delete(jobId);
    }
    
    return this.getJobProgress(jobId);
  }

  /**
   * Get current progress for a job
   * @param {string} jobId - The job ID
   * @returns {Object|null} - The job progress data or null if not found
   */
  getJobProgress(jobId) {
    const jobProgress = this.progressData.get(jobId);
    
    if (!jobProgress) {
      return null;
    }
    
    // Calculate duration
    const currentTime = new Date();
    jobProgress.duration = currentTime - jobProgress.startTime;
    
    return { ...jobProgress };
  }

  /**
   * Recalculate overall progress based on service and scene progress
   * @private
   * @param {Object} jobProgress - The job progress object
   */
  _recalculateProgress(jobProgress) {
    if (!jobProgress) return;
    
    // Ensure all required objects exist
    jobProgress.serviceProgress = jobProgress.serviceProgress || {};
    jobProgress.sceneProgress = jobProgress.sceneProgress || {};
    
    // Get services and weights after ensuring objects exist
    const services = jobProgress.services || ['llm'];
    const weights = jobProgress.weights || { llm: 10, music: 10, scene: 80 };
    const scenesCount = jobProgress.scenesCount || 1;
    
    // Calculate global services progress (LLM and Music)
    let progressSum = 0;
    let weightSum = 0;
    
    // Handle LLM progress
    if (jobProgress.serviceProgress.llm) {
      const llmProgress = jobProgress.serviceProgress.llm;
      if (llmProgress.status === 'completed') {
        progressSum += weights.llm;
      } else if (llmProgress.status === 'failed') {
        progressSum += 0;
      } else {
        progressSum += (llmProgress.progress * weights.llm) / 100;
      }
      weightSum += weights.llm;
    }
    
    // Handle Music progress if enabled
    if (services.includes('music') && jobProgress.serviceProgress.music) {
      const musicProgress = jobProgress.serviceProgress.music;
      if (musicProgress.status === 'completed') {
        progressSum += weights.music;
      } else if (musicProgress.status === 'failed') {
        progressSum += 0;
      } else {
        progressSum += (musicProgress.progress * weights.music) / 100;
      }
      weightSum += weights.music;
    }
    
    // Handle scene progress
    for (let sceneId = 1; sceneId <= scenesCount; sceneId++) {
      if (jobProgress.sceneProgress[sceneId]) {
        const scene = jobProgress.sceneProgress[sceneId];
        let sceneProgressSum = 0;
        let sceneWeightSum = 0;
        
        // Voice progress (40% of scene)
        if (scene.voice) {
          const voiceProgress = scene.voice;
          if (voiceProgress.status === 'completed') {
            sceneProgressSum += 40;
          } else if (voiceProgress.status === 'failed') {
            sceneProgressSum += 0;
          } else {
            sceneProgressSum += (voiceProgress.progress * 40) / 100;
          }
          sceneWeightSum += 40;
        }
        
        // Image progress (30% of scene)
        if (scene.image) {
          const imageProgress = scene.image;
          if (imageProgress.status === 'completed') {
            sceneProgressSum += 30;
          } else if (imageProgress.status === 'failed') {
            sceneProgressSum += 0;
          } else {
            sceneProgressSum += (imageProgress.progress * 30) / 100;
          }
          sceneWeightSum += 30;
        }
        
        // Video/Animation progress (30% of scene) - only if image is completed
        const visualService = scene.video || scene.animation;
        if (visualService && scene.image?.status === 'completed') {
          const visualProgress = visualService;
          if (visualProgress.status === 'completed') {
            sceneProgressSum += 30;
          } else if (visualProgress.status === 'failed') {
            sceneProgressSum += 0;
          } else {
            sceneProgressSum += (visualProgress.progress * 30) / 100;
          }
          sceneWeightSum += 30;
        }
        
        // Calculate scene's contribution to total progress
        const sceneProgress = sceneWeightSum > 0 ? sceneProgressSum / sceneWeightSum : 0;
        progressSum += (sceneProgress * weights.scene) / 100;
        weightSum += weights.scene;
      }
    }
    
    // Update overall progress
    jobProgress.overallProgress = weightSum > 0 ? Math.round(progressSum / weightSum) : 0;
    
    // Cap at 99% unless job is completed
    if (jobProgress.overallProgress > 90 && jobProgress.status === 'in_progress') {
      jobProgress.overallProgress = 90;
    }
    
    jobProgress.lastUpdated = new Date();
  }

  /**
   * Clean up progress data for completed jobs
   * @param {number} maxAge - Maximum age in milliseconds before cleaning up
   */
  cleanupOldJobs(maxAge = 3600000) { // Default: 1 hour
    const currentTime = new Date();
    
    for (const [jobId, progress] of this.progressData.entries()) {
      if (progress.endTime && (currentTime - progress.endTime > maxAge)) {
        this.progressData.delete(jobId);
        logger.info(`Cleaned up progress data for completed job ${jobId}`);
      }
    }
  }
}

// Export as singleton
module.exports = new ProgressTracker(); 