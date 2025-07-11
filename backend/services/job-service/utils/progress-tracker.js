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
    
    // Check if this is an LLM-only job (all other services skipped)
    const isLlmOnlyJob = serviceConfig.skipVoice && 
                        serviceConfig.skipImage && 
                        serviceConfig.skipMusic && 
                        serviceConfig.skipVisualization;
    
    // Calculate weights for each service
    const weights = {
      llm: 10,             // LLM is always 10%
      music: 10,           // Music is 10% if used
      scene: 80            // Remaining 80% divided among scenes
    };
    
    // Create list of services that will be used in this job
    const services = ['llm']; // LLM is always included
    if (!serviceConfig.skipMusic) services.push('music');
    if (!serviceConfig.skipVoice) services.push('voice');
    if (!serviceConfig.skipImage) services.push('image');
    if (!serviceConfig.skipVisualization) {
      services.push(serviceConfig.visualizationType || 'animation');
    }
    
    // Initialize progress data for this job
    const jobProgress = {
      startTime: new Date(),
      services,
      weights,
      scenesCount,
      serviceProgress: {},
      sceneProgress: {},  // Initialize empty scene progress object
      overallProgress: 0,
      status: 'in_progress',
      lastUpdated: new Date()
    };

    // Initialize scene progress objects for each scene
    for (let sceneId = 1; sceneId <= scenesCount; sceneId++) {
      jobProgress.sceneProgress[sceneId] = {};
    }
    
    this.progressData.set(jobId, jobProgress);
    
    // For LLM-only jobs, log appropriate message
    if (isLlmOnlyJob) {
      logger.info(`Initialized progress for LLM-only job ${jobId}`);
    } else {
      logger.info(`Initialized progress for job ${jobId} with ${scenesCount} scenes`);
    }
    
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

    // Special handling for LLM service completion - don't set overall job to completed
    // when only the LLM service is done, unless it's an LLM-only job
    if (service === 'llm' && status === 'completed') {
      // Determine if this is an LLM-only job
      const isLlmOnlyJob = jobProgress.services.length === 1 || 
                        (jobProgress.services.length === 2 && jobProgress.services.includes('music'));
      
      // For non-LLM-only jobs, prevent setting job status to completed here
      // Let the full job completion logic handle it later
      if (!isLlmOnlyJob) {
        // Check what services are included
        const includesVoice = jobProgress.services.includes('voice');
        const includesImage = jobProgress.services.includes('image');
        const includesAnimation = jobProgress.services.includes('animation');
        const includesVideo = jobProgress.services.includes('video');
        
        // Calculate the approximate progress percentage based on what's left to do
        const remainingServices = jobProgress.services.length - 1; // -1 for LLM which is complete
        const progressPercentage = Math.floor(jobProgress.weights.llm);
        
        // Directly set the overall progress without full recalculation
        jobProgress.overallProgress = progressPercentage;
        jobProgress.status = 'in_progress';
        jobProgress.lastUpdated = new Date();
        
        logger.info(`Progress updated for job after LLM completion: ${progressPercentage}% (in_progress)`);
        
        return this.getJobProgress(jobId);
      }
    }

    // Normal recalculation for other services or LLM-only jobs
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
    
    // Ensure all required objects exist
    jobProgress.serviceProgress = jobProgress.serviceProgress || {};
    jobProgress.sceneProgress = jobProgress.sceneProgress || {};
    
    // Get services and scenes count
    const services = jobProgress.services || ['llm'];
    const scenesCount = jobProgress.scenesCount || 1;
    
    // Calculate weights based on enabled services
    const weights = this._calculateWeights(services, scenesCount);
    
    let progressSum = 0;
    let weightSum = 0;
    
    // Handle LLM progress (always 5-10%)
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
        
        // Voice progress
        if (scene.voice) {
          const voiceProgress = scene.voice;
          const voiceWeight = weights.voice / scenesCount;
          if (voiceProgress.status === 'completed') {
            progressSum += voiceWeight;
          } else if (voiceProgress.status === 'failed') {
            progressSum += 0;
          } else {
            progressSum += (voiceProgress.progress * voiceWeight) / 100;
          }
          weightSum += voiceWeight;
        }
        
        // Image progress - use actual progress value
        if (scene.image) {
          const imageProgress = scene.image;
          const imageWeight = weights.image / scenesCount;
          // Always use the actual progress value for image generation
          progressSum += (imageProgress.progress * imageWeight) / 100;
          weightSum += imageWeight;
        }
        
        // Video/Animation progress - only count if image is completed
        const visualService = scene.video || scene.animation;
        if (visualService && scene.image?.status === 'completed') {
          const visualProgress = visualService;
          const visualWeight = weights.visual / scenesCount;
          if (visualProgress.status === 'completed') {
            progressSum += visualWeight;
          } else if (visualProgress.status === 'failed') {
            progressSum += 0;
          } else {
            progressSum += (visualProgress.progress * visualWeight) / 100;
          }
          weightSum += visualWeight;
        }
      }
    }
    
    // Update overall progress
    jobProgress.overallProgress = weightSum > 0 ? Math.round((progressSum / weightSum) * 100) : 0;
    
    // Update job status only if allowed
    if (updateStatus) {
      // Check if all services are completed
      const allServicesCompleted = services.every(service => {
        if (service === 'llm') {
          return jobProgress.serviceProgress.llm?.status === 'completed';
        }
        if (service === 'music') {
          if (!services.includes('music')) return true; // Skip if not included
          return jobProgress.serviceProgress.music?.status === 'completed';
        }
        
        // For scene services, check all scenes
        return Array.from({ length: scenesCount }, (_, i) => i + 1).every(sceneId => {
          const scene = jobProgress.sceneProgress[sceneId];
          if (!scene) return false;
          
          if (service === 'voice') {
            if (scene.voice?.status === 'skipped') return true;
            return scene.voice?.status === 'completed';
          }
          if (service === 'image') {
            if (scene.image?.status === 'skipped') return true;
            return scene.image?.status === 'completed' && scene.image?.progress === 100;
          }
          if (service === 'video') {
            if (scene.video?.status === 'skipped') return true;
            return scene.video?.status === 'completed';
          }
          if (service === 'animation') {
            if (scene.animation?.status === 'skipped') return true;
            return scene.animation?.status === 'completed';
          }
          
          return true;
        });
      });
      
      // If all services are completed, set status to completed and progress to 100%
      if (allServicesCompleted) {
        jobProgress.status = 'completed';
        jobProgress.overallProgress = 100;
        jobProgress.endTime = new Date();
      } else {
        // Ensure status is in_progress if not all services are completed
        jobProgress.status = 'in_progress';
      }
    }
    
    jobProgress.lastUpdated = new Date();
    
    // Log when progress changes significantly
    logger.info(`Progress recalculated for job: ${jobProgress.overallProgress}% (${jobProgress.status})`);
  }

  /**
   * Calculate weights for each service based on enabled services and scene count
   * @private
   * @param {Array} services - Array of enabled services
   * @param {number} scenesCount - Number of scenes
   * @returns {Object} - Weights for each service
   */
  _calculateWeights(services, scenesCount) {
    const weights = {
      llm: 0,
      music: 0,
      voice: 0,
      image: 0,
      visual: 0
    };

    const hasMusic = services.includes('music');
    const hasVoice = services.includes('voice');
    const hasImage = services.includes('image');
    const hasVideo = services.includes('video');
    const hasAnimation = services.includes('animation');

    // Base weights for LLM and Music
    weights.llm = hasMusic ? 5 : 10; // 5% if music enabled, 10% otherwise
    weights.music = hasMusic ? 10 : 0; // 10% if enabled

    // Calculate remaining weight (90% or 85% depending on music)
    const remainingWeight = hasMusic ? 85 : 90;

    if (hasVoice && hasImage && (hasVideo || hasAnimation)) {
      // Voice + Image + Video/Animation
      weights.voice = (remainingWeight * 0.1) / scenesCount; // 10% per scene
      weights.image = (remainingWeight * 0.15) / scenesCount; // 15% per scene
      weights.visual = (remainingWeight * 0.75) / scenesCount; // 75% per scene
    } else if (hasVoice && hasImage) {
      // Voice + Image only
      weights.voice = (remainingWeight * 0.35) / scenesCount; // 35% per scene
      weights.image = (remainingWeight * 0.65) / scenesCount; // 65% per scene
    } else if (hasVoice && (hasVideo || hasAnimation)) {
      // Voice + Video/Animation only
      weights.voice = (remainingWeight * 0.3) / scenesCount; // 30% per scene
      weights.visual = (remainingWeight * 0.7) / scenesCount; // 70% per scene
    } else if (hasImage && (hasVideo || hasAnimation)) {
      // Image + Video/Animation only
      weights.image = (remainingWeight * 0.3) / scenesCount; // 30% per scene
      weights.visual = (remainingWeight * 0.7) / scenesCount; // 70% per scene
    } else if (hasVoice) {
      // Voice only
      weights.voice = remainingWeight / scenesCount; // 100% per scene
    } else if (hasImage) {
      // Image only
      weights.image = remainingWeight / scenesCount; // 100% per scene
    } else if (hasVideo || hasAnimation) {
      // Video/Animation only
      weights.visual = remainingWeight / scenesCount; // 100% per scene
    }

    return weights;
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