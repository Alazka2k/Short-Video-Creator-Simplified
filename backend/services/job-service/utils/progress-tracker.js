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
    
    // For LLM-only jobs, set a high starting progress since only LLM is processed
    const initialProgress = isLlmOnlyJob ? 90 : 0;
    
    // Calculate weights for each service
    const weights = {
      llm: 10,             // LLM is relatively quick - 10% of total time
      image: 25,           // Image generation takes longer - 25% of total time
      voice: 15,           // Voice generation takes moderate time - 15% of total time
      music: 15,           // Music generation takes moderate time - 15% of total time
      visualization: 40,   // Visualization is the longest process - 40% of total time
      video: 45,           // Video generation is the longest - 45% of total time
      animation: 35        // Animation generation is long - 35% of total time
    };
    
    // Create list of services that will be used in this job
    const services = ['llm']; // LLM is always included
    if (!serviceConfig.skipImage) services.push('image');
    if (!serviceConfig.skipVoice) services.push('voice');
    if (!serviceConfig.skipMusic) services.push('music');
    if (!serviceConfig.skipVisualization) {
      // Include the specific visualization type if known
      if (serviceConfig.visualizationType === 'video') {
        services.push('video');
      } else if (serviceConfig.visualizationType === 'animation') {
        services.push('animation');
      } else {
        services.push('visualization');
      }
    }
    
    // Initialize progress data for this job
    this.progressData.set(jobId, {
      startTime: new Date(),
      services,
      weights,
      scenesCount,
      serviceProgress: {},
      sceneProgress: {},
      overallProgress: initialProgress,
      status: 'in_progress',
      lastUpdated: new Date()
    });
    
    // For LLM-only jobs, log appropriate message
    if (isLlmOnlyJob) {
      logger.info(`Initialized progress for LLM-only job ${jobId} at ${initialProgress}%`);
    } else {
      logger.info(`Initialized progress for job ${jobId} with services: ${services.join(', ')}`);
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
    this._recalculateProgress(jobId);
    
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
    const jobProgress = this.progressData.get(jobId);
    
    if (!jobProgress) {
      logger.warn(`Tried to update scene progress for unknown job ${jobId}`);
      return null;
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
    this._recalculateProgress(jobId);
    
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
   * @param {string} jobId - The job ID
   */
  _recalculateProgress(jobId) {
    const jobProgress = this.progressData.get(jobId);
    
    if (!jobProgress) return;
    
    const { services, weights, scenesCount, serviceProgress, sceneProgress } = jobProgress;
    
    // Calculate progress for global services (llm, music)
    let progressSum = 0;
    let weightSum = 0;
    
    // Calculate for global services like LLM and music
    const globalServices = ['llm', 'music'];
    for (const service of globalServices) {
      if (services.includes(service) && serviceProgress[service]) {
        progressSum += (serviceProgress[service].progress * weights[service]);
        weightSum += weights[service];
      }
    }
    
    // Calculate for per-scene services (image, voice, visualization)
    const sceneServices = ['image', 'voice', 'video', 'animation', 'visualization'];
    for (const service of sceneServices) {
      if (services.includes(service)) {
        const serviceWeight = weights[service] / scenesCount;
        
        // Sum up progress for all scenes for this service
        for (let i = 1; i <= scenesCount; i++) {
          if (sceneProgress[i] && sceneProgress[i][service]) {
            progressSum += (sceneProgress[i][service].progress * serviceWeight);
            weightSum += serviceWeight;
          }
        }
      }
    }
    
    // Calculate overall progress as weighted average
    let overallProgress = 0;
    if (weightSum > 0) {
      overallProgress = Math.round(progressSum / weightSum);
    }
    
    // Cap at 99% unless job is completed
    if (overallProgress > 90 && jobProgress.status === 'in_progress') {
      // Check if key services are still processing
      const hasRunningVisualizations = services.some(service => 
        (service === 'video' || service === 'animation') && 
        (!serviceProgress[service] || serviceProgress[service].status !== 'completed')
      );
      
      if (hasRunningVisualizations) {
        // Cap at 90% if video/animation is still running
        overallProgress = Math.min(overallProgress, 90);
      } else {
        // Cap at 95% when just finalizing
        overallProgress = Math.min(overallProgress, 95);
      }
    }
    
    // Update overall progress
    jobProgress.overallProgress = overallProgress;
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