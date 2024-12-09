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

      const [voiceResult, imageResult] = await this.generateVoiceAndImage(
        scene, sceneId, jobId, serviceConfig, parameters
      );

      const visualResult = await this.generateVisualization(
        scene, sceneId, jobId, imageResult, serviceConfig, parameters, visualizationType
      );

      await this.saveSceneMetadata(sceneDir, {
        sceneId,
        scene,
        voiceResult,
        imageResult,
        visualResult,
        visualizationType
      });

      return {
        sceneId,
        voice: voiceResult,
        image: imageResult,
        [visualizationType]: visualResult
      };
    } catch (error) {
      throw error;
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
          parameters.voiceGenParams?.voiceId
        );
        await this.jobDataAccess.updateJobProgress(jobId, 'voice', 'completed', {
          sceneId,
          filePath: result.filePath,
          storage_key: result.storage_key,
          public_url: result.public_url
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

        // Normalize the URL property name
        result.public_url = result.publicUrl;

        // Log the complete image result
        logger.info('Image generation result:', {
          jobId,
          sceneId,
          filePath: result.filePath,
          storage_key: result.storage_key,
          public_url: result.public_url,
          publicUrl: result.publicUrl // Log both to verify
        });

        await this.jobDataAccess.updateJobProgress(jobId, 'image', 'completed', {
          sceneId,
          filePath: result.filePath,
          storage_key: result.storage_key,
          public_url: result.public_url
        });
        return result;
      })() : Promise.resolve(null)
    ]);

    // Verify image result has required fields
    if (imageResult && !imageResult.public_url && imageResult.publicUrl) {
      imageResult.public_url = imageResult.publicUrl; // Ensure we have the correct property
    }

    if (imageResult && !imageResult.public_url) {
      logger.error('Image result missing public_url:', {
        jobId,
        sceneId,
        imageResult
      });
    }

    return [voiceResult, imageResult];
  }

  async generateVisualization(scene, sceneId, jobId, imageResult, serviceConfig, parameters, visualizationType) {
    if (serviceConfig.skipVisualization) return null;

    // Normalize URL property
    if (imageResult && imageResult.publicUrl && !imageResult.public_url) {
      imageResult.public_url = imageResult.publicUrl;
    }

    // Log the full imageResult for debugging
    logger.info('Starting visualization generation with image result:', {
      type: visualizationType,
      sceneId,
      jobId,
      imageResult: {
        filePath: imageResult?.filePath,
        public_url: imageResult?.public_url,
        publicUrl: imageResult?.publicUrl, // Log both to verify
        storage_key: imageResult?.storage_key
      },
      hasVideoPrompt: !!scene.video_prompt,
      videoPrompt: scene.video_prompt
    });

    try {
      // First check visualization type
      if (!['video', 'animation'].includes(visualizationType)) {
        throw new Error(`Invalid visualization type: ${visualizationType}`);
      }

      if (!scene.video_prompt) {
        logger.error('Missing video prompt for scene', { sceneId, jobId });
        throw new Error('Video prompt is required for visualization generation');
      }

      if (!imageResult?.public_url) {
        logger.error('Missing image URL for visualization', { sceneId, jobId });
        throw new Error('Image URL is required for visualization generation');
      }

      if (visualizationType === 'video') {
        logger.info('Executing video service...', {
          sceneId,
          jobId,
          imageUrl: imageResult.public_url,
          videoPrompt: scene.video_prompt
        });
        return await this.services.video.process(
          imageResult.public_url,
          scene.video_prompt,
          scene.camera_movement,
          parameters.videoGenParams?.aspectRatio || '16:9',
          sceneId,
          jobId
        );
      } else { // animation
        logger.info('Executing animation service...', {
          sceneId,
          jobId,
          imageUrl: imageResult?.public_url,
          videoPrompt: scene.video_prompt
        });
        return await this.services.animation.process(
          imageResult?.public_url,
          scene.video_prompt,
          sceneId,
          jobId,
          parameters.animationGenParams
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
}

module.exports = SceneProcessor; 