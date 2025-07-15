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
    // Track jobs that are in final processing to prevent race conditions
    this.finalizingJobs = new Set();
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
    
    // Create list of services that will be used in this job
    const services = ['llm']; // LLM is always included
    if (!serviceConfig.skipMusic) services.push('music');
    if (!serviceConfig.skipVoice) services.push('voice');
    if (!serviceConfig.skipImage) services.push('image');
    if (!serviceConfig.skipVisualization) {
      // Use the specific visualization type ('animation' or 'video')
      services.push(serviceConfig.visualizationType || 'animation');
    }
    
    // Initialize progress data for this job
    const jobProgress = {
      startTime: new Date(),
      services, // Store the list of active services
      scenesCount,
      serviceProgress: {},
      sceneProgress: {},
      overallProgress: 0,
      status: 'in_progress',
      lastUpdated: new Date()
    };

    // Initialize scene progress objects for each scene
    for (let sceneId = 1; sceneId <= scenesCount; sceneId++) {
      jobProgress.sceneProgress[sceneId] = {};
    }
    
    this.progressData.set(jobId, jobProgress);
    
    logger.info(`Initialized progress for job ${jobId}`, { services, scenesCount });
    
    return jobProgress;
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
    // Skip updates for jobs that are being finalized
    if (this.finalizingJobs.has(jobId)) {
      logger.info(`Skipping progress update for ${jobId} (${service}) as job is being finalized`);
      return this.getJobProgress(jobId);
    }
    
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
    // Skip updates for jobs that are being finalized
    if (this.finalizingJobs.has(jobId)) {
      logger.info(`Skipping scene progress update for ${jobId} (scene ${sceneId}, ${service}) as job is being finalized`);
      return this.getJobProgress(jobId);
    }
    
    const jobProgress = this.progressData.get(jobId);
    
    if (!jobProgress) {
      logger.warn(`Tried to update scene progress for unknown job ${jobId}`);
      return null;
    }

    // Ensure scene progress object exists
    if (!jobProgress.sceneProgress[sceneId]) {
      jobProgress.sceneProgress[sceneId] = {};
    }

    // Update the specific service progress for this scene
    jobProgress.sceneProgress[sceneId][service] = {
      progress,
      status,
      ...metadata,
      lastUpdated: new Date()
    };

    // For image service, ensure we're using the actual progress value
    if (service === 'image') {
      logger.info(`Image generation progress for scene ${sceneId}: ${progress}%`);
      // Don't set status to completed until we get 100% progress
      if (progress < 100) {
        jobProgress.sceneProgress[sceneId][service].status = 'in_progress';
      }
    }

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
    
    if (status === 'completed') {
      jobProgress.overallProgress = 100;
      jobProgress.endTime = new Date();
    } else if (status === 'failed') {
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
      return {
        jobId: jobId,
        status: 'not_found',
        overallProgress: 0,
        message: 'Job progress not initiated or job completed and cleaned up.'
      };
    }
    
    // Calculate duration
    const currentTime = new Date();
    jobProgress.duration = currentTime - jobProgress.startTime;
    
    return { ...jobProgress };
  }

  /**
   * Get the raw progress data for a job
   * @param {string} jobId - The job ID
   * @returns {Object|null} - The raw progress data or null if not found
   */
  getProgressData(jobId) {
    return this.progressData.get(jobId);
  }

  /**
   * Clear progress data for a job
   * @param {string} jobId - The job ID
   */
  clearProgressData(jobId) {
    if (this.progressData.has(jobId)) {
      this.progressData.delete(jobId);
      logger.info(`Cleared progress data for job ${jobId}`);
    }
  }

  /**
   * Recalculate overall progress based on service and scene progress
   * @private
   * @param {Object} jobProgress - The job progress object
   * @param {boolean} [updateStatus=true] - Whether to update the job status or just the progress
   */
  _recalculateProgress(jobProgress, updateStatus = true) {
    if (!jobProgress) return;
    
    const { services, scenesCount, serviceProgress, sceneProgress } = jobProgress;
    
    // Calculate normalized weights based on active services for this job
    const weights = this._calculateWeights(services);
    
    let calculatedProgress = 0;
    
    // --- Calculate progress for non-scene services (LLM, Music) ---
    if (weights.llm && serviceProgress.llm) {
      calculatedProgress += (serviceProgress.llm.progress / 100) * weights.llm;
    }
    
    if (weights.music && serviceProgress.music) {
      calculatedProgress += (serviceProgress.music.progress / 100) * weights.music;
    }

    // --- Calculate weighted progress for each scene ---
    let totalSceneProgress = 0;
    if (scenesCount > 0) {
        for (let i = 1; i <= scenesCount; i++) {
            const scene = sceneProgress[i] || {};
            let sceneServiceProgress = 0;
            let sceneTotalWeight = 0;

            if (weights.voice && scene.voice) {
                sceneServiceProgress += (scene.voice.progress / 100) * (weights.voice / scenesCount);
            }
            if (weights.image && scene.image) {
                sceneServiceProgress += (scene.image.progress / 100) * (weights.image / scenesCount);
            }
            // Use 'visualization' key which covers both animation and video
            if (weights.visualization && (scene.animation || scene.video)) {
                const visual = scene.animation || scene.video;
                sceneServiceProgress += (visual.progress / 100) * (weights.visualization / scenesCount);
            }
            totalSceneProgress += sceneServiceProgress;
        }
    }
    calculatedProgress += totalSceneProgress;
    
    // Update overall progress, ensuring it's an integer
    jobProgress.overallProgress = Math.round(calculatedProgress);
    
    // Update job status only if allowed by the flag
    if (updateStatus) {
      // Check if all services for all scenes are complete
      const allServicesCompleted = services.every(service => {
        if (service === 'llm' || service === 'music') {
          return serviceProgress[service]?.status === 'completed';
        }
        
        // For scene-based services, check every scene
        for (let i = 1; i <= scenesCount; i++) {
          const scene = sceneProgress[i] || {};
          const serviceState = scene[service];
          // If a service for a scene is not marked as completed or skipped, the job is not done
          if (!serviceState || (serviceState.status !== 'completed' && serviceState.status !== 'skipped')) {
            return false;
          }
        }
        return true;
      });
      
      if (allServicesCompleted) {
        // Cap progress at 95% to prevent premature completion.
        // The final 100% and 'completed' status will be set explicitly by the job pipeline service.
        jobProgress.status = 'in_progress';
        jobProgress.overallProgress = 95;
      } else {
        jobProgress.status = 'in_progress';
      }
    }
    
    jobProgress.lastUpdated = new Date();
    
    // Log when progress changes significantly
    if (jobProgress.overallProgress % 10 === 0 || jobProgress.overallProgress > 90) {
      logger.info(`Progress recalculated for job ${jobProgress.jobId}: ${jobProgress.overallProgress}% (${jobProgress.status})`);
    }
  }

  /**
   * A robust method to calculate weights for each service based on the job's configuration.
   * This ensures that the total weight of all active services always sums to 100.
   * @private
   * @param {string[]} services - An array of enabled service names for the job.
   * @returns {Object.<string, number>} An object mapping service names to their calculated weight.
   */
  _calculateWeights(services) {
    const baseWeights = {
      llm: 5,
      music: 30,
      voice: 10,
      image: 20,
      visualization: 35, // Generic key for animation or video
    };

    const activeServices = new Set();
    services.forEach(service => {
      if (service === 'animation' || service === 'video') {
        activeServices.add('visualization');
      } else if (baseWeights[service]) {
        activeServices.add(service);
      }
    });

    let totalWeight = 0;
    activeServices.forEach(service => {
      totalWeight += baseWeights[service];
    });

    if (totalWeight === 0) return {}; // Return empty if no valid services are active

    // Normalize the weights of active services so they sum to 100
    const finalWeights = {};
    activeServices.forEach(service => {
      finalWeights[service] = (baseWeights[service] / totalWeight) * 100;
    });
    
    logger.debug('Calculated normalized weights:', finalWeights);
    return finalWeights;
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
module.exports = new ProgressTracker(); 