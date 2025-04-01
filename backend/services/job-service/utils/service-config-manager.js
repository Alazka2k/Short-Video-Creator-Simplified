/**
 * Service Configuration Manager
 * 
 * Handles processing of service configurations, including:
 * - Validation of visualization type
 * - Creating service sequences based on configuration
 * - Enforcing business rules for service dependencies
 */

const logger = require('../../../shared/utils/logger');

/**
 * Processes service configuration parameters and returns standardized config
 * 
 * @param {Object} parameters - Job parameters that may contain service configuration
 * @param {string} defaultVisualizationType - Default visualization type if not specified in parameters
 * @param {string} jobId - Optional job ID for logging
 * @returns {Object} - Processed service configuration with visualizationType and serviceSequence
 */
function processServiceConfig(parameters = {}, defaultVisualizationType = 'animation', jobId = null) {
  // Get and validate service configuration
  const serviceConfig = {
    skipVoice: parameters.serviceConfig?.skipVoice ?? false,
    skipMusic: parameters.serviceConfig?.skipMusic ?? false,
    skipImage: parameters.serviceConfig?.skipImage ?? false,
    skipVisualization: parameters.serviceConfig?.skipVisualization ?? false,
  };
  
  // Check if this is an LLM-only job (all services skipped)
  const isLlmOnlyJob = serviceConfig.skipVoice && 
                      serviceConfig.skipImage && 
                      serviceConfig.skipMusic && 
                      serviceConfig.skipVisualization;
  
  // If image is skipped, visualization must also be skipped regardless of the setting
  if (serviceConfig.skipImage) {
    serviceConfig.skipVisualization = true;
    logger.info('Image generation is skipped, automatically skipping visualization as well', 
      jobId ? { jobId } : undefined);
  }
  
  // For LLM-only jobs, ignore the visualization type completely
  if (isLlmOnlyJob) {
    serviceConfig.visualizationType = 'none'; // Just a placeholder, won't be used
    logger.info('LLM-only job detected, skipping visualization type validation', 
      jobId ? { jobId } : undefined);
    
    // Return early with minimal config for LLM-only jobs
    return {
      serviceConfig,
      visualizationType: 'none', // Use consistent value
      serviceSequence: ['llm'] // Only LLM service is used
    };
  }
  
  // Handle visualization type
  const visualizationType = parameters.visualizationType || defaultVisualizationType;
  
  // If image is enabled but visualization is skipped, we're in "image-only" mode
  if (!serviceConfig.skipImage && serviceConfig.skipVisualization) {
    logger.info('Visualization is skipped, defaulting to image-only output', 
      jobId ? { jobId } : undefined);
    serviceConfig.visualizationType = 'image';
    return {
      serviceConfig,
      visualizationType: 'image',
      serviceSequence: createServiceSequence(serviceConfig)
    };
  }
  
  // Only set and validate visualizationType if visualization is not skipped
  if (!serviceConfig.skipVisualization) {
    serviceConfig.visualizationType = visualizationType;
    
    // Validate visualization type if not skipped
    if (!['video', 'animation', 'image'].includes(visualizationType)) {
      throw new Error(`Invalid visualization type: ${visualizationType}. Must be one of: video, animation, image.`);
    }
  } else {
    // Default visualizationType if skipped
    serviceConfig.visualizationType = 'image';
  }

  // Create a service sequence based on configuration
  const serviceSequence = createServiceSequence(serviceConfig);
  
  return {
    serviceConfig,
    visualizationType: serviceConfig.visualizationType,
    serviceSequence
  };
}

/**
 * Creates a service sequence array based on configuration
 * 
 * @param {Object} serviceConfig - Service configuration object
 * @returns {Array} - Array of service names in execution order
 */
function createServiceSequence(serviceConfig) {
  const serviceSequence = [];
  
  // LLM is always first
  serviceSequence.push('llm');
  
  // Add other services based on configuration
  if (!serviceConfig.skipImage) serviceSequence.push('image');
  if (!serviceConfig.skipVoice) serviceSequence.push('voice');
  if (!serviceConfig.skipMusic) serviceSequence.push('music');
  
  // Add the appropriate visualization service based on the output type
  if (!serviceConfig.skipVisualization && serviceConfig.visualizationType !== 'image') {
    if (serviceConfig.visualizationType === 'animation') {
      serviceSequence.push('animation');
    } else if (serviceConfig.visualizationType === 'video') {
      serviceSequence.push('video');
    }
  }
  
  return serviceSequence;
}

module.exports = {
  processServiceConfig,
  createServiceSequence
}; 