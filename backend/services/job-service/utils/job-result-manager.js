const logger = require('../../../shared/utils/logger');

/**
 * Job Result Manager
 * 
 * Handles job result analysis and status determination:
 * - Analyzes scene results against service configuration
 * - Identifies failed components 
 * - Prepares standardized metadata and API responses
 * - Handles error metadata preparation
 */

/**
 * Analyzes scene results and determines job status
 * 
 * @param {Object} sceneResults - Results from scene processing
 * @param {Object} serviceConfig - Service configuration
 * @param {Object} musicResult - Music generation result
 * @returns {Object} - Status information including status, errorMessage, and failedComponents
 */
function analyzeResults(sceneResults, serviceConfig, musicResult = null) {
  // Log service configuration for debugging
  logger.info('Analyzing job results based on service configuration:', {
    serviceConfig,
    hasMusicResult: !!musicResult,
    musicStatus: musicResult?.status
  });

  // Check if all scenes have a 'skipped' status (indicating an LLM-only job)
  const allScenesSkipped = sceneResults.sceneResults.length > 0 && 
                          sceneResults.sceneResults.every(scene => scene.status === 'skipped');
  
  if (allScenesSkipped && (!musicResult || musicResult.status === 'skipped')) {
    logger.info('LLM-only job completed successfully (all services skipped)');
    return {
      status: 'completed',
      errorMessage: null,
      failedComponents: []
    };
  }
  
  // More detailed logging of scene results for debugging
  logger.info('Scene results for validation:', {
    sceneCount: sceneResults.sceneResults.length,
    scenes: sceneResults.sceneResults.map(scene => ({
      sceneId: scene.sceneId,
      status: scene.status,
      hasVoice: !!scene.voice,
      hasImage: !!scene.image,
      hasVideo: !!scene.video,
      hasAnimation: !!scene.animation,
      voiceStatus: scene.voice?.status,
      imageStatus: scene.image?.status,
      videoStatus: scene.video?.status,
      animationStatus: scene.animation?.status
    }))
  });
  
  // Collect details about failed components for better debugging
  const failedComponents = collectFailedComponents(sceneResults.sceneResults, serviceConfig, musicResult);
  
  // Determine job status based on results
  let status = 'completed'; // Default to completed
  let errorMessage = null;
  
  if (failedComponents.length > 0) {
    // Any scene with a failed component - job is failed
    status = 'failed';
    errorMessage = 'One or more content creation tasks failed';
    logger.error(`Job failed with these components:`, { failedComponents });
  } else {
    logger.info('Job completed successfully with no failed components');
  }

  return {
    status,
    errorMessage, 
    failedComponents
  };
}

/**
 * Collects information about failed components from scene results
 * 
 * @param {Array} sceneResults - Array of scene processing results
 * @param {Object} serviceConfig - Service configuration
 * @param {Object} musicResult - Music generation result
 * @returns {Array} - Array of failed component descriptions
 */
function collectFailedComponents(sceneResults, serviceConfig, musicResult = null) {
  logger.info('Checking scenes for failed components...', {
    scenesCount: sceneResults.length,
    serviceConfig,
    hasMusicResult: !!musicResult,
    musicStatus: musicResult?.status
  });

  logger.info('Detailed scene results for validation:', {
    scenes: sceneResults.map(s => ({
      sceneId: s.sceneId,
      status: s.status,
      voice: s.voice,
      image: s.image,
      [serviceConfig.visualizationType]: s[serviceConfig.visualizationType]
    }))
  });

  const failedComponents = [];

  // Check music result at the job level
  if (!serviceConfig.skipMusic) {
    if (!musicResult) {
      logger.error('No music result found and music is not skipped');
      failedComponents.push('Music generation failed - Missing result');
    } else if (musicResult.status === 'failed') {
      logger.error('Music generation failed', { error: musicResult.error });
      failedComponents.push(`Music generation failed${musicResult.error ? ': ' + musicResult.error : ''}`);
    } else if (musicResult.status !== 'completed' && musicResult.status !== 'skipped') {
      logger.error('Unexpected music status', { status: musicResult.status });
      failedComponents.push(`Music generation - Unexpected status: ${musicResult.status}`);
    }
  }

  sceneResults.forEach(scene => {
    // Default statuses
    const statuses = {
      voiceStatus: 'skipped',
      imageStatus: 'skipped',
      videoStatus: 'skipped',
      animationStatus: 'skipped',
      sceneStatus: scene.status
    };

    // Voice validation - only validate if not skipped
    if (!serviceConfig.skipVoice) {
      if (!scene.voice) {
        logger.warn(`No voice data found for scene ${scene.sceneId} and voice is not skipped`, { jobId: scene.jobId });
        statuses.voiceStatus = 'missing';
      } else {
        statuses.voiceStatus = scene.voice.status;
      }
    }

    // Image validation - only validate if not skipped
    if (!serviceConfig.skipImage) {
      if (!scene.image) {
        logger.warn(`No image data found for scene ${scene.sceneId} and image is not skipped`, { jobId: scene.jobId, image: scene.image });
        statuses.imageStatus = 'missing';
      } else {
        statuses.imageStatus = scene.image.status;
      }
    }

    // Visualization validation - only validate if not skipped
    if (!serviceConfig.skipVisualization) {
      const visualizationType = serviceConfig.visualizationType;
      if (visualizationType === 'video') {
        if (!scene.video) {
          logger.warn(`No video data found for scene ${scene.sceneId} and video is not skipped`, { jobId: scene.jobId });
          statuses.videoStatus = 'missing';
        } else {
          statuses.videoStatus = scene.video.status;
        }
      } else if (visualizationType === 'animation') {
        if (!scene.animation) {
          logger.warn(`No animation data found for scene ${scene.sceneId} and animation is not skipped`, { jobId: scene.jobId });
          statuses.animationStatus = 'missing';
        } else {
          statuses.animationStatus = scene.animation.status;
        }
      }
    }

    logger.info(`Validating scene ${scene.sceneId}:`, statuses);

    // Check for any failures
    if (!serviceConfig.skipVoice && (statuses.voiceStatus === 'failed' || statuses.voiceStatus === 'missing')) {
      failedComponents.push(`Scene ${scene.sceneId}: Voice generation failed${statuses.voiceStatus === 'missing' ? ' - Missing result' : ''}`);
    }

    if (!serviceConfig.skipImage && (statuses.imageStatus === 'failed' || statuses.imageStatus === 'missing')) {
      failedComponents.push(`Scene ${scene.sceneId}: Image generation failed${statuses.imageStatus === 'missing' ? ' - Missing result' : ''}`);
    }

    if (!serviceConfig.skipVisualization) {
      if (serviceConfig.visualizationType === 'video' && 
          (statuses.videoStatus === 'failed' || statuses.videoStatus === 'missing')) {
        failedComponents.push(`Scene ${scene.sceneId}: Video generation failed${statuses.videoStatus === 'missing' ? ' - Missing result' : ''}`);
      } else if (serviceConfig.visualizationType === 'animation' && 
                (statuses.animationStatus === 'failed' || statuses.animationStatus === 'missing')) {
        failedComponents.push(`Scene ${scene.sceneId}: Animation generation failed${statuses.animationStatus === 'missing' ? ' - Missing result' : ''}`);
      }
    }

    if (statuses.sceneStatus === 'failed') {
      failedComponents.push(`Scene ${scene.sceneId}: Processing failed`);
    }
  });

  if (failedComponents.length > 0) {
    logger.error('Job failed with these components:', { failedComponents });
  } else {
    logger.info('All components completed successfully');
  }

  return failedComponents;
}

/**
 * Prepares metadata object for job storage
 * 
 * @param {string} jobId - The job ID
 * @param {Object} llmResult - LLM processing result
 * @param {Object} sceneResults - Scene processing results
 * @param {Object} musicResult - Music processing result
 * @param {Object} parameters - Job parameters
 * @param {Object} statusInfo - Status information from analyzeResults
 * @returns {Object} - Metadata object for storage
 */
function prepareMetadata(jobId, llmResult, sceneResults, musicResult, parameters, statusInfo) {
  // Check if this is an LLM-only job
  const isLlmOnlyJob = sceneResults.sceneResults.length > 0 && 
                      sceneResults.sceneResults.every(scene => scene.status === 'skipped');
  
  const metadata = {
    jobId,
    status: statusInfo.status,
    llmResult: llmResult.content,
    scenes: sceneResults.sceneResults.map(scene => {
      if (scene.status === 'skipped') {
        return { sceneId: scene.sceneId, status: 'skipped' };
      }
      
      return {
        sceneId: scene.sceneId,
        voice: scene.voice,
        image: scene.image,
        video: scene.video,
        animation: scene.animation,
        ...(scene.status === 'failed' ? { error: scene.error, status: 'failed' } : {})
      };
    }),
    music: musicResult,
    parameters,
    failedComponents: statusInfo.failedComponents.length > 0 ? statusInfo.failedComponents : undefined,
    endTime: new Date().toISOString()
  };
  
  // Add LLM-only flag for LLM-only jobs
  if (isLlmOnlyJob) {
    metadata.isLlmOnly = true;
  }
  
  return metadata;
}

/**
 * Prepares error metadata for failed jobs
 * 
 * @param {string} jobId - The job ID
 * @param {Error} error - The error object
 * @returns {Object} - Error metadata object
 */
function prepareErrorMetadata(jobId, error) {
  return {
    jobId,
    error: error.message,
    stackTrace: error.stack,
    endTime: new Date().toISOString()
  };
}

/**
 * Prepares standardized API response for job completion
 * 
 * @param {string} jobId - The job ID
 * @param {string} jobOutputDir - Job output directory path
 * @param {Object} llmResult - LLM processing result
 * @param {Object} sceneResults - Scene processing results
 * @param {Object} musicResult - Music processing result
 * @param {Object} statusInfo - Status information from analyzeResults
 * @param {Object} serviceConfig - Service configuration
 * @returns {Object} - Standardized API response
 */
function prepareResponse(jobId, jobOutputDir, llmResult, sceneResults, musicResult, statusInfo, serviceConfig = null) {
  // Check if this is an LLM-only job based on scene status
  const isLlmOnlyJob = sceneResults.sceneResults.length > 0 && 
                      sceneResults.sceneResults.every(scene => scene.status === 'skipped');
  
  // Use provided serviceConfig or extract from llmResult
  const config = serviceConfig || llmResult?.parameters?.serviceConfig || {};
  
  return {
    jobId,
    status: statusInfo.status,
    errorMessage: statusInfo.errorMessage, // Include error message in response
    failedComponents: statusInfo.failedComponents.length > 0 ? statusInfo.failedComponents : undefined,
    outputDir: jobOutputDir,
    isLlmOnly: isLlmOnlyJob, // Flag to indicate LLM-only job
    content: {
      llm: llmResult.content,
      scenes: sceneResults.sceneResults.map(scene => {
        // For skipped scenes (in LLM-only jobs), include minimal info
        if (scene.status === 'skipped') {
          return { sceneId: scene.sceneId, status: 'skipped' };
        }
        
        // Determine correct status for visualization components
        let enhancedScene = {
          sceneId: scene.sceneId,
          voice: scene.voice || (config.skipVoice ? { status: 'skipped' } : undefined),
          image: scene.image || (config.skipImage ? { status: 'skipped' } : undefined),
          ...(scene.status === 'failed' ? { error: scene.error, status: 'failed' } : {})
        };
        
        // Add video or animation component with correct status
        if (config.visualizationType === 'video') {
          enhancedScene.video = scene.video || 
            ((config.skipVisualization || config.skipImage) ? { status: 'skipped' } : undefined);
        } else if (config.visualizationType === 'animation') {
          enhancedScene.animation = scene.animation || 
            ((config.skipVisualization || config.skipImage) ? { status: 'skipped' } : undefined);
        }
        
        return enhancedScene;
      }),
      music: musicResult || (config.skipMusic ? { status: 'skipped' } : undefined)
    }
  };
}

module.exports = {
  analyzeResults,
  collectFailedComponents,
  prepareMetadata,
  prepareErrorMetadata,
  prepareResponse
}; 