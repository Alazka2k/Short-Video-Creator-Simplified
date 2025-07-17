const path = require('path');
const fs = require('fs').promises;
const logger = require('../../../shared/utils/logger');
const MetadataManager = require('../utils/metadata-manager');
const axios = require('axios');
const config = require('../../../shared/utils/config');

class SceneProcessor {
  constructor(services, jobDataAccess, progressTracker) {
    this.services = services;
    this.jobDataAccess = jobDataAccess;
    this.progressTracker = progressTracker;
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
        imageResult = await this.generateImage(scene, sceneId, jobId, parameters);
        logger.info(`Image generation request for scene ${sceneId} accepted, current status: ${imageResult?.status || 'unknown'}`);
        
        // Ensure image result has a status field
        if (imageResult && !imageResult.status) {
          logger.warn(`Image result for scene ${sceneId} is missing status field, setting to 'completed'`);
          imageResult.status = 'completed';
        }
      } else {
        imageResult = { status: 'skipped' };
        logger.info(`Image generation skipped for scene ${sceneId}`);
      }

      // Visualization is now triggered by the image-service webhook chain.
      // The logic to generate or handle visualization results has been removed
      // from this processor to prevent data corruption (e.g., the 'undefined' key).

      // Save scene metadata with complete results
      const metadataToSave = {
        sceneId,
        text: scene?.description,
        visualPrompt: scene?.visual_prompt,
        videoPrompt: scene?.video_prompt,
        voice: voiceResult,
        image: imageResult, // This is now just a status object like { status: 'in_progress' }
        generatedAt: new Date().toISOString()
      };
      logger.info(`[Scene Processor] Saving final metadata for scene ${sceneId}:`, metadataToSave);
      await this.saveSceneMetadata(sceneDir, metadataToSave);

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

      // Visualization result is no longer available in this context and is removed.

      // Log the final scene result before returning
      /*logger.info(`Final scene ${sceneId} result:`, {
        sceneId: sceneResult.sceneId,
        status: sceneResult.status,
        hasVoice: !!sceneResult.voice,
        hasImage: !!sceneResult.image,
        voiceStatus: sceneResult.voice?.status,
        imageStatus: sceneResult.image?.status,
        visualizationType: visualizationType,
        visualizationStatus: sceneResult[visualizationType]?.status
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

  // The generateVisualization method is now obsolete and has been removed.
  // The video/animation generation is triggered by the image-service upon image completion.

  async saveSceneMetadata(sceneDir, metadata) {
    try {
      await MetadataManager.saveSceneMetadata(sceneDir, metadata);
    } catch (error) {
      logger.error('Error saving scene metadata:', error);
      throw error;
    }
  }

  async generateImage(scene, sceneIndex, jobId, parameters) {
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
    const progressData = this.progressTracker.updateSceneProgress(jobId, sceneIndex, 'image', 0, 'in_progress');
    await this.jobDataAccess.updateJobProgress(jobId, progressData);


    const maxRetries = 3;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await axios.post(`${config.services.image.url}/generate`, {
          prompt: {
            image_prompt: imagePrompt,
            video_prompt: scene.video_prompt,
            parameters: parameters
          },
          sceneIndex,
          jobId,
        }, {
          timeout: 30000 // A short timeout, since the service should respond immediately
        });

        if (response.status === 202) {
          logger.info(`Image service accepted request for scene ${sceneIndex} on attempt ${attempt}`);
          return { status: 'in_progress' }; // Return a temporary status
        } else {
          throw new Error(`Invalid response status from image service: ${response.status}`);
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
          const failureProgress = this.progressTracker.updateSceneProgress(jobId, sceneIndex, 'image', 100, 'failed', {
            error: error.response?.data?.details || error.message
          });
          await this.jobDataAccess.updateJobProgress(jobId, failureProgress);
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
      let progressData = this.progressTracker.updateSceneProgress(jobId, sceneId, 'voice', 0, 'started');
      await this.jobDataAccess.updateJobProgress(jobId, progressData);
      
      logger.info('Executing voice service...', {
        sceneId,
        jobId,
        elevenlabsVoiceId: parameters.voiceGenParams?.elevenlabsVoiceId
      });

      // Update progress to in_progress (50%)
      progressData = this.progressTracker.updateSceneProgress(jobId, sceneId, 'voice', 50, 'in_progress');
      await this.jobDataAccess.updateJobProgress(jobId, progressData);

      // Generate voice
      const voiceResult = await this.services.voice.process(
        scene.description,
        sceneId,
        jobId,
        parameters.voiceGenParams?.elevenlabsVoiceId
      );

      // Update progress to completed (100%)
      progressData = this.progressTracker.updateSceneProgress(jobId, sceneId, 'voice', 100, voiceResult.status, {
        filePath: voiceResult.filePath,
        publicUrl: voiceResult.publicUrl,
        storageKey: voiceResult.storageKey
      });
      await this.jobDataAccess.updateJobProgress(jobId, progressData);
      
      logger.info(`Voice generation for scene ${sceneId} completed with status: ${voiceResult.status}`);
      return voiceResult;
    } catch (error) {
      // Update progress to failed with error
      const failureProgress = this.progressTracker.updateSceneProgress(jobId, sceneId, 'voice', 100, 'failed', { 
        error: error.message
      });
      await this.jobDataAccess.updateJobProgress(jobId, failureProgress);
      
      logger.error(`Error generating voice for scene ${sceneId}:`, error);
      return {
        status: 'failed',
        error: error.message
      };
    }
  }
}

module.exports = SceneProcessor; 