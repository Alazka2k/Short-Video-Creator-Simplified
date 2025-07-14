const path = require('path');
const fs = require('fs').promises;
const logger = require('../../../shared/utils/logger');
const MetadataManager = require('../utils/metadata-manager');
const axios = require('axios');
const config = require('../../../shared/utils/config');

class SceneProcessor {
  constructor(services, jobDataAccess) {
    this.services = services;
    this.jobDataAccess = jobDataAccess;
  }

  async processScene(scene, sceneId, jobId, sceneDir, serviceConfig, parameters, visualizationType) {
    logger.info(`Processing scene ${sceneId} for job ${jobId}`);

    try {
      // Create scene directory if it doesn't exist
      await fs.mkdir(sceneDir, { recursive: true });

      // Save basic scene metadata
      await this.saveSceneMetadata(sceneDir, {
        sceneId,
        scene
      });

      // Generate voice and image in parallel if both are enabled
      let voiceResult = null; 
      let imageResult = null;

      // Process voice if not skipped
      if (!serviceConfig.skipVoice) {
        // Get elevenlabsVoiceId from parameters
        const elevenlabsVoiceId = parameters.voiceGenParams?.elevenlabsVoiceId;
        
        /*logger.info(`Using elevenlabsVoiceId for scene ${sceneId}:`, { 
          elevenlabsVoiceId
        });*/
        
        voiceResult = await this.processVoice(scene, sceneId, jobId, serviceConfig, parameters);
        logger.info(`Voice generation for scene ${sceneId} completed with status: ${voiceResult?.status}`);
      } else {
        voiceResult = { status: 'skipped' };
        logger.info(`Voice generation skipped for scene ${sceneId}`);
      }

      // Process image if not skipped
      if (!serviceConfig.skipImage) {
        imageResult = await this.generateImage(scene, sceneId, jobId);
        logger.info(`Image generation for scene ${sceneId} completed with status: ${imageResult?.status || 'unknown'}`);
        
        // Ensure image result has a status field
        if (imageResult && !imageResult.status) {
          logger.warn(`Image result for scene ${sceneId} is missing status field, setting to 'completed'`);
          imageResult.status = 'completed';
        }
      } else {
        imageResult = { status: 'skipped' };
        logger.info(`Image generation skipped for scene ${sceneId}`);
      }

      // Check if visualization is enabled
      let visualResult = null;
      if (!serviceConfig.skipVisualization && imageResult && imageResult.status !== 'failed' && imageResult.status !== 'skipped') {
        visualResult = await this.generateVisualization(
          scene,
          sceneId,
          jobId,
          imageResult,
          serviceConfig,
          parameters,
          visualizationType
        );
        logger.info(`${visualizationType} generation for scene ${sceneId} completed with status: ${visualResult?.status}`);
      } else if (!serviceConfig.skipVisualization) {
        logger.info(`${visualizationType} skipped for scene ${sceneId} due to missing or failed image`);
        visualResult = { status: 'skipped', reason: 'Missing or failed image' };
      } else {
        logger.info(`${visualizationType} skipped for scene ${sceneId}`);
        visualResult = { status: 'skipped' };
      }

      // Save scene metadata with complete results
      await this.saveSceneMetadata(sceneDir, {
        sceneId,
        text: scene?.description,
        visualPrompt: scene?.visual_prompt,
        videoPrompt: scene?.video_prompt,
        voice: voiceResult,
        image: imageResult,
        [serviceConfig.visualizationType]: visualResult,
        visualizationType: serviceConfig.visualizationType,
        generatedAt: new Date().toISOString()
      });

      // Create the scene result to return
      const sceneResult = {
        sceneId,
        jobId,
        status: 'completed'
      };

      // Only include voice result if voice was not skipped and is available
      if (!serviceConfig.skipVoice && voiceResult) {
        sceneResult.voice = { ...voiceResult };
      }

      // Only include image result if image was not skipped and is available
      if (!serviceConfig.skipImage && imageResult) {
        sceneResult.image = {
          filePath: imageResult.filePath,
          fileName: imageResult.fileName,
          storageKey: imageResult.storageKey,
          publicUrl: imageResult.publicUrl, 
          status: imageResult.status,
          metadata: imageResult.metadata
        };
      }

      // Only include visualization result if it was not skipped and is available
      if (!serviceConfig.skipVisualization && visualResult) {
        sceneResult[serviceConfig.visualizationType] = { ...visualResult };
      }

      // Log the final scene result before returning
      /*logger.info(`Final scene ${sceneId} result:`, {
        sceneId: sceneResult.sceneId,
        status: sceneResult.status,
        hasVoice: !!sceneResult.voice,
        hasImage: !!sceneResult.image,
        voiceStatus: sceneResult.voice?.status,
        imageStatus: sceneResult.image?.status,
        visualizationType: serviceConfig.visualizationType,
        visualizationStatus: sceneResult[serviceConfig.visualizationType]?.status
      }); */

      return sceneResult;
    } catch (error) {
      logger.error(`Error processing scene ${sceneId}:`, error);
      return {
        sceneId,
        jobId,
        status: 'failed',
        error: error.message
      };
    }
  }

  async generateVisualization(scene, sceneId, jobId, imageResult, serviceConfig, parameters, visualizationType) {
    if (serviceConfig.skipVisualization) {
      logger.info(`Visualization generation skipped for scene ${sceneId}`, { jobId });
      return { status: 'skipped' };
    }

    // Log the visualization intent
    logger.info('Starting visualization generation:', {
      type: visualizationType,
      sceneId,
      jobId,
      hasImageResult: !!imageResult,
      hasVideoPrompt: !!scene.video_prompt
    });

    // If we don't have an image result and image generation wasn't skipped, 
    // it means the image generation failed
    if (!imageResult || imageResult.status === 'failed') {
      logger.warn('No valid image available for visualization, skipping', { sceneId, jobId });
      return { 
        status: 'skipped', 
        reason: 'No valid image available for visualization' 
      };
    }

    try {
      // First check visualization type
      if (!['video', 'animation'].includes(visualizationType)) {
        throw new Error(`Invalid visualization type: ${visualizationType}`);
      }

      if (!imageResult?.publicUrl) {
        logger.error('Missing image URL for visualization', { sceneId, jobId });
        throw new Error('Image URL is required for visualization generation');
      }

      let visualResult;
      
      if (visualizationType === 'video') {
        logger.info('Executing video service...', {
          sceneId,
          jobId,
          imageUrl: imageResult.publicUrl,
          videoPrompt: scene.video_prompt,
          model: parameters.videoGenParams?.model || 'ray-2'
        });

        // For ray-1.5, we need video prompt and camera movement
        if (parameters.videoGenParams?.model === 'ray-1.5') {
          if (!scene.video_prompt) {
            logger.error('Missing video prompt for scene', { sceneId, jobId });
            throw new Error('Video prompt is required for ray-1.5 visualization generation');
          }
          
          visualResult = await this.services.video.process(
            imageResult.publicUrl,
            scene.video_prompt,
            scene.camera_movement,
            parameters.videoGenParams?.aspectRatio || '16:9',
            sceneId,
            jobId
          );
        } else {
          // For ray-2, we only need the image URL
          visualResult = await this.services.video.process(
            imageResult.publicUrl,
            null,
            null,
            null,
            sceneId,
            jobId
          );
        }
      } else { // animation
        logger.info('Executing animation service...', {
          sceneId,
          jobId,
          imageUrl: imageResult?.publicUrl,
          videoPrompt: scene.video_prompt
        });
        visualResult = await this.services.animation.process(
          imageResult?.publicUrl,
          scene.video_prompt,
          sceneId,
          jobId,
          {
            animationLength: parameters.animationGenParams?.animationLength || 5,
            ...parameters.animationGenParams
          }
        );
      }
      
      // Validate that visualResult has a status property
      if (!visualResult || !visualResult.status) {
        logger.error(`${visualizationType} service returned result without status for scene ${sceneId}`, { jobId });
        throw new Error(`${visualizationType} service result is missing status field`);
      }
      
      return visualResult;
    } catch (error) {
      logger.error(`Error in ${visualizationType} generation:`, error);
      await this.jobDataAccess.updateJobProgress(jobId, visualizationType, 'failed', {
        sceneId,
        error: error.message
      });
      return { status: 'failed', error: error.message };
    }
  }

  async saveSceneMetadata(sceneDir, metadata) {
    try {
      await MetadataManager.saveSceneMetadata(sceneDir, metadata);
    } catch (error) {
      logger.error('Error saving scene metadata:', error);
      throw error;
    }
  }

  async generateImage(scene, sceneIndex, jobId) {
    // This function is refactored to make a direct HTTP call to the image-service,
    // treating it as a proper microservice. This solves the cross-process state
    // issue where the job was queued in one process and the webhook was received in another.
    const imagePrompt = scene.visual_prompt || scene.description;

    if (!imagePrompt) {
      logger.error(`No visual_prompt or description found for scene ${sceneIndex}`, { jobId });
      throw new Error('No visual_prompt or description found for scene');
    }

    logger.info(`Calling Image Service endpoint for scene ${sceneIndex} of job ${jobId}`);

    // Immediately update progress to indicate that image generation has started.
    // This ensures its weight is included in the overall progress calculation from the beginning.
    this.jobDataAccess.updateJobProgress(jobId, 'image', 'started', {
      sceneId: sceneIndex,
      progress: 0,
      status: 'in_progress'
    });

    const maxRetries = 3;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await axios.post(`${config.services.image.url}/generate`, {
          prompt: imagePrompt,
          sceneIndex,
          jobId,
        }, {
          timeout: 300000 // 5 minute timeout, to allow for image generation
        });

        if (response.data && response.data.result) {
          logger.info(`Image service successfully returned result for scene ${sceneIndex} on attempt ${attempt}`);
          return response.data.result;
        } else {
          throw new Error('Invalid response structure from image service');
        }
      } catch (error) {
        logger.error(`Error calling image service for scene ${sceneIndex} (attempt ${attempt}/${maxRetries}):`, {
          message: error.message,
          url: `${config.services.image.url}/generate`,
          response: error.response?.data
        });

        // Check for retryable errors
        const isRetryable =
          error.response?.status >= 500 ||
          (error.message && error.message.includes('please try again later'));

        if (isRetryable && attempt < maxRetries) {
          const delay = attempt * 2000; // 2s, 4s
          logger.info(`Retryable error detected. Waiting ${delay}ms before next attempt.`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          // If not retryable or max retries reached, update progress and throw
          this.jobDataAccess.updateJobProgress(jobId, 'image', 'failed', {
            sceneId: sceneIndex,
            error: error.response?.data?.details || error.message
          });
          throw error; // Re-throw to be caught by the main scene processing loop
        }
      }
    }
  }

  async processVoice(scene, sceneId, jobId, serviceConfig, parameters) {
    // Skip if voice is disabled
    if (serviceConfig.skipVoice) {
      logger.info(`Voice generation skipped for scene ${sceneId}`);
      return {
        status: 'skipped'
      };
    }

    try {
      // First update progress to started (0%)
      this.jobDataAccess.updateJobProgress(jobId, 'voice', 'started', { 
        sceneId,
        progress: 0
      });
      
      logger.info('Executing voice service...', {
        sceneId,
        jobId,
        elevenlabsVoiceId: parameters.voiceGenParams?.elevenlabsVoiceId
      });

      // Update progress to in_progress (50%)
      this.jobDataAccess.updateJobProgress(jobId, 'voice', 'in_progress', { 
        sceneId,
        progress: 50
      });

      // Generate voice
      const voiceResult = await this.services.voice.process(
        scene.description,
        sceneId,
        jobId,
        parameters.voiceGenParams?.elevenlabsVoiceId
      );

      // Update progress to completed (100%)
      this.jobDataAccess.updateJobProgress(jobId, 'voice', voiceResult.status, { 
        sceneId,
        progress: 100,
        filePath: voiceResult.filePath,
        publicUrl: voiceResult.publicUrl,
        storageKey: voiceResult.storageKey
      });
      
      logger.info(`Voice generation for scene ${sceneId} completed with status: ${voiceResult.status}`);
      return voiceResult;
    } catch (error) {
      // Update progress to failed with error
      this.jobDataAccess.updateJobProgress(jobId, 'voice', 'failed', { 
        sceneId,
        error: error.message
      });
      
      logger.error(`Error generating voice for scene ${sceneId}:`, error);
      return {
        status: 'failed',
        error: error.message
      };
    }
  }
}

module.exports = SceneProcessor; 