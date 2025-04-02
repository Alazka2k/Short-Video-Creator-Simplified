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
        
        logger.info(`Using elevenlabsVoiceId for scene ${sceneId}:`, { 
          elevenlabsVoiceId
        });
        
        voiceResult = await this.generateVoice(
          scene, 
          sceneId, 
          jobId, 
          elevenlabsVoiceId
        );
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
    const maxRetries = 3;
    let lastError = null;

    // Use the visual_prompt property consistently
    const imagePrompt = scene.visual_prompt;
    
    // Log the scene properties for debugging
    logger.info(`Scene properties for image generation:`, {
      sceneIndex,
      hasVisualPrompt: !!scene.visual_prompt,
      hasVisualPromptProperty: scene.hasOwnProperty('visual_prompt'),
      propertyNames: Object.keys(scene)
    });
    
    if (!imagePrompt) {
      // Fallback to description only if needed
      if (scene.description) {
        logger.warn(`No visual_prompt found for scene ${sceneIndex}, using description as fallback`, { jobId });
        const fallbackPrompt = scene.description;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            logger.info(`Generating image with fallback prompt for scene ${sceneIndex}, attempt ${attempt}/${maxRetries}`);
            
            if (!await this.services.image.service.isHealthy()) {
              await this.services.image.initialize();
            }

            const result = await this.services.image.process(
              fallbackPrompt,
              sceneIndex,
              jobId
            );
            return result;
          } catch (error) {
            lastError = error;
            logger.error(`Image generation attempt ${attempt} failed:`, error);
            
            if (attempt < maxRetries && (
                error.message.includes('WebSocket') || 
                error.message.includes('ENOTFOUND') || 
                error.message.includes('not initialized'))) {
              const delay = attempt * 5000;
              await new Promise(resolve => setTimeout(resolve, delay));
            } else {
              break;
            }
          }
        }
        
        throw new Error(`Failed to generate image with fallback prompt after ${maxRetries} attempts: ${lastError?.message}`);
      } else {
        logger.error(`No visual_prompt or fallback found for scene ${sceneIndex}`, { jobId });
        throw new Error('No visual_prompt found for scene');
      }
    }
    
    logger.info(`Using image prompt for scene ${sceneIndex}: ${imagePrompt.substring(0, 100)}...`);

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
          imagePrompt,
          sceneIndex,
          jobId
        );
        
        // Ensure result has status field
        if (result && !result.status) {
          result.status = 'completed';
        }
        
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
            } catch (initError) {
              logger.error('Failed to reinitialize image service:', initError);
            }
            
            const delay = attempt * 5000;
            logger.info(`Waiting ${delay}ms before next attempt...`);
            await new Promise(resolve => setTimeout(resolve, delay));
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

  async generateVoice(scene, sceneId, jobId, elevenlabsVoiceId) {
    logger.info('Executing voice service...', { 
      sceneId, 
      jobId,
      elevenlabsVoiceId 
    });
    
    try {
      const result = await this.services.voice.process(
        scene.description,
        sceneId,
        jobId,
        elevenlabsVoiceId
      );
      
      // Verify result has required properties
      if (result && result.publicUrl && result.filePath) {
        await this.jobDataAccess.updateJobProgress(jobId, 'voice', 'completed', {
          sceneId,
          filePath: result.filePath,
          storageKey: result.storageKey,
          publicUrl: result.publicUrl
        });
        
        // Validate that result has a status property
        if (!result.status) {
          logger.error(`Voice service returned result without status for scene ${sceneId}`, { jobId });
          throw new Error('Voice service result is missing status field');
        }
        
        return result;
      } else {
        throw new Error('Voice service returned an incomplete result');
      }
    } catch (error) {
      // Check for rate limit errors specifically
      const isRateLimitError = 
        error.message?.includes('Status code: 429') || 
        error.statusCode === 429 ||
        error.status === 429;
        
      if (isRateLimitError) {
        logger.error(`Rate limit exceeded in voice generation for scene ${sceneId}:`, error);
        await this.jobDataAccess.updateJobProgress(jobId, 'voice', 'failed', {
          sceneId,
          error: 'ElevenLabs API rate limit exceeded. Try again later.'
        });
        return { 
          status: 'failed', 
          error: 'ElevenLabs API rate limit exceeded. Try again later.'
        };
      } else {
        // Handle other errors
        logger.error(`Error in voice generation for scene ${sceneId}:`, error);
        await this.jobDataAccess.updateJobProgress(jobId, 'voice', 'failed', {
          sceneId,
          error: error.message
        });
        return { status: 'failed', error: error.message };
      }
    }
  }
}

module.exports = SceneProcessor; 