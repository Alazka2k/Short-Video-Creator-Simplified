const path = require('path');
const fs = require('fs').promises;
const logger = require('../../../shared/utils/logger');
const MetadataManager = require('../utils/metadata-manager');

class SceneProcessor {
  constructor(services, jobDataAccess) {
    this.services = services;
    this.jobDataAccess = jobDataAccess;
  }

  async processScene(scene, sceneId, jobId, sceneDir, serviceConfig, parameters, visualizationType) {
    try {
      logger.info(`Processing scene ${sceneId}...`, { jobId, sceneId, sceneDir });

      // Initialize result object
      let result = { sceneId };

      try {
        const [voiceResult, imageResult] = await this.generateVoiceAndImage(
          scene, sceneId, jobId, serviceConfig, parameters
        );
        
        // Add successful results
        if (voiceResult) result.voice = voiceResult;
        if (imageResult) result.image = imageResult;

        try {
          const visualResult = await this.generateVisualization(
            scene, sceneId, jobId, imageResult, serviceConfig, parameters, visualizationType
          );
          if (visualResult) result[visualizationType] = visualResult;
        } catch (visualError) {
          logger.error(`Error in visualization for scene ${sceneId}:`, visualError);
          // Don't fail the whole scene, just mark visualization as failed
          result[visualizationType] = { status: 'failed', error: visualError.message };
        }

      } catch (genError) {
        logger.error(`Error in voice/image generation for scene ${sceneId}:`, genError);
        // Keep any successful generations in the result
        result.status = 'failed';
        result.error = genError.message;
      }

      // Save whatever metadata we have
      await this.saveSceneMetadata(sceneDir, {
        sceneId,
        scene,
        voiceResult: result.voice,
        imageResult: result.image,
        visualResult: result[visualizationType],
        visualizationType
      });

      return result;
    } catch (error) {
      logger.error(`Fatal error processing scene ${sceneId}:`, error);
      return {
        sceneId,
        status: 'failed',
        error: error.message
      };
    }
  }

  async generateVoiceAndImage(scene, sceneId, jobId, serviceConfig, parameters) {
    // Before voice and image generation
    logger.info('Starting parallel voice and image generation...', {
      skipVoice: serviceConfig.skipVoice,
      skipImage: serviceConfig.skipImage
    });

    const [voiceResult, imageResult] = await Promise.all([
      !serviceConfig.skipVoice ? (async () => {
        logger.info('Executing voice service...', { sceneId, jobId });
        const result = await this.services.voice.process(
          scene.description,
          sceneId,
          jobId,
          parameters.voiceGenParams?.elevenlabsVoiceId
        );
        await this.jobDataAccess.updateJobProgress(jobId, 'voice', 'completed', {
          sceneId,
          filePath: result.filePath,
          storageKey: result.storageKey,
          publicUrl: result.publicUrl
        });
        return result;
      })() : Promise.resolve(null),
      !serviceConfig.skipImage ? (async () => {
        logger.info('Executing image service...', { sceneId, jobId });
        const result = await this.services.image.process(
          scene.visual_prompt,
          sceneId,
          jobId
        );

        // Log the complete image result
        logger.info('Image generation result:', {
          jobId,
          sceneId,
          filePath: result.filePath,
          storageKey: result.storageKey,
          publicUrl: result.publicUrl
        });

        await this.jobDataAccess.updateJobProgress(jobId, 'image', 'completed', {
          sceneId,
          filePath: result.filePath,
          storageKey: result.storageKey,
          publicUrl: result.publicUrl
        });
        return result;
      })() : Promise.resolve(null)

    ]);

    return [voiceResult, imageResult];
  }

  async generateVisualization(scene, sceneId, jobId, imageResult, serviceConfig, parameters, visualizationType) {
    if (serviceConfig.skipVisualization) return null;

    // Log the full imageResult for debugging
    logger.info('Starting visualization generation with image result:', {
      type: visualizationType,
      sceneId,
      jobId,
      imageResult: {
        filePath: imageResult?.filePath,
        publicUrl: imageResult?.publicUrl,
        storageKey: imageResult?.storageKey
      },
      hasVideoPrompt: !!scene.video_prompt,
      videoPrompt: scene.video_prompt
    });

    try {
      // First check visualization type
      if (!['video', 'animation'].includes(visualizationType)) {
        throw new Error(`Invalid visualization type: ${visualizationType}`);
      }

      if (!imageResult?.publicUrl) {
        logger.error('Missing image URL for visualization', { sceneId, jobId });
        throw new Error('Image URL is required for visualization generation');
      }

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
          
          return await this.services.video.process(
            imageResult.publicUrl,
            scene.video_prompt,
            scene.camera_movement,
            parameters.videoGenParams?.aspectRatio || '16:9',
            sceneId,
            jobId
          );
        } else {
          // For ray-2, we only need the image URL
          return await this.services.video.process(
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
        return await this.services.animation.process(
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
    } catch (error) {
      logger.error(`Error in ${visualizationType} generation:`, error);
      await this.jobDataAccess.updateJobProgress(jobId, visualizationType, 'failed', {
        sceneId,
        error: error.message
      });
      throw error;
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
    const maxRetries = 3;
    let lastError = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        logger.info(`Generating image for scene ${sceneIndex}, attempt ${attempt}/${maxRetries}`);
        
        // Check if service needs initialization
        if (!await this.services.image.service.isHealthy()) {
          logger.info('Image service unhealthy, attempting to reinitialize...');
          await this.services.image.initialize();
          logger.info('Image service reinitialized');
        }

        const result = await this.services.image.process(
          scene.imagePrompt,
          sceneIndex,
          jobId
        );
        return result;
      } catch (error) {
        lastError = error;
        logger.error(`Image generation attempt ${attempt} failed:`, error);

        // Check if it's a connection-related error
        if (error.message.includes('WebSocket') || 
            error.message.includes('ENOTFOUND') || 
            error.message.includes('not initialized')) {
          if (attempt < maxRetries) {
            logger.info('Attempting to reinitialize image service...');
            try {
              await this.services.image.initialize();
              logger.info('Successfully reinitialized image service');
              // Restart the job service after successful reinitialization
              process.exit(0); // PM2 will automatically restart the service
            } catch (initError) {
              logger.error('Failed to reinitialize image service:', initError);
              const delay = attempt * 5000;
              logger.info(`Waiting ${delay}ms before next attempt...`);
              await new Promise(resolve => setTimeout(resolve, delay));
            }
          }
        } else {
          // If it's not a connection error, don't retry
          break;
        }
      }
    }

    // If we get here, all attempts failed
    throw new Error(`Failed to generate image after ${maxRetries} attempts: ${lastError?.message}`);
  }
}

module.exports = SceneProcessor; 