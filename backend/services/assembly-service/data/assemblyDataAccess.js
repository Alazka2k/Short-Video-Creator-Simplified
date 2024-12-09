const knex = require('knex')(require('../../../../knexfile')[process.env.NODE_ENV]);
const logger = require('../../../shared/utils/logger');
const path = require('path');
const fs = require('fs').promises;
const config = require('../../../shared/utils/config');
const storageService = require('../../../shared/utils/storage');
const StorageUrlHelper = require('../../../shared/utils/storage-url-helper');
const fetch = require('node-fetch');

class AssemblyDataAccess {
  constructor() {
    this.storageBasePath = path.join(config.output.directory, 'assembly');
    this.mediaBaseUrl = process.env.MEDIA_BASE_URL || config.services.gateway?.url || 'http://localhost:3000/media';
    
    // Log the paths we're using
    logger.info('Assembly Data Access initialized with paths:', {
      storageBasePath: this.storageBasePath,
      mediaBaseUrl: this.mediaBaseUrl
    });
  }

  async createAssemblyOutput(jobId, assemblyData) {
    try {
      const [assemblyRecord] = await knex('assembly_outputs')
        .insert({
          job_id: jobId,
          status: assemblyData.status || 'pending',
          project_id: assemblyData.projectId,
          assembly_config: assemblyData.assemblyConfig,
          metadata: JSON.stringify(assemblyData.metadata),
          file_path: assemblyData.filePath,
          storage_key: assemblyData.storageKey,
          public_url: assemblyData.publicUrl,
          user_id: assemblyData.userId
        })
        .returning('*');

      return assemblyRecord;
    } catch (error) {
      logger.error('Error creating assembly output:', error);
      throw error;
    }
  }

  async getSceneAssets(jobId, sceneId) {
    try {
      const assets = await knex.transaction(async (trx) => {
        // First get the image asset as base
        const imageAsset = await trx('image_outputs')
          .where({ job_id: jobId, scene_id: sceneId })
          .first();

        // Check if there's a video or animation generated from this image
        const videoAsset = await trx('video_outputs')
          .where({ job_id: jobId, scene_id: sceneId })
          .first();

        const animationAsset = await trx('animation_outputs')
          .where({ job_id: jobId, scene_id: sceneId })
          .first();

        // Get voice asset if exists
        const voiceAsset = await trx('voice_outputs')
          .where({ job_id: jobId, scene_id: sceneId })
          .first();

        // Determine which visual asset to use (prioritize video/animation over image)
        const visualAsset = videoAsset || animationAsset || imageAsset;

        // Log all found assets and their relationships
        logger.info('Asset lookup results:', {
          jobId,
          sceneId,
          results: {
            image: imageAsset ? {
              id: imageAsset.image_id,
              public_url: imageAsset.public_url,
              hasGeneratedContent: !!(videoAsset || animationAsset)
            } : null,
            video: videoAsset ? {
              id: videoAsset.video_id,
              public_url: videoAsset.public_url,
              generatedFromImage: true
            } : null,
            animation: animationAsset ? {
              id: animationAsset.animation_id,
              public_url: animationAsset.public_url,
              generatedFromImage: true
            } : null,
            voice: voiceAsset ? {
              id: voiceAsset.voice_id,
              public_url: voiceAsset.public_url
            } : null,
            selectedVisual: visualAsset ? {
              type: videoAsset ? 'video' : (animationAsset ? 'animation' : 'image'),
              id: visualAsset.video_id || visualAsset.animation_id || visualAsset.image_id,
              public_url: visualAsset.public_url
            } : null
          }
        });

        // Require at least one visual asset
        if (!visualAsset) {
          throw new Error(`Missing required visual asset for scene ID ${sceneId}`);
        }

        // Refresh and update URLs if needed
        if (imageAsset) {
          const freshUrl = await StorageUrlHelper.getFreshUrl(imageAsset.public_url);
          if (freshUrl !== imageAsset.public_url) {
            await trx('image_outputs')
              .where('image_id', imageAsset.image_id)
              .update({ public_url: freshUrl });
            imageAsset.public_url = freshUrl;
          }
        }

        if (videoAsset) {
          const freshUrl = await StorageUrlHelper.getFreshUrl(videoAsset.public_url);
          if (freshUrl !== videoAsset.public_url) {
            await trx('video_outputs')
              .where('video_id', videoAsset.video_id)
              .update({ public_url: freshUrl });
            videoAsset.public_url = freshUrl;
          }
        }

        if (animationAsset) {
          const freshUrl = await StorageUrlHelper.getFreshUrl(animationAsset.public_url);
          if (freshUrl !== animationAsset.public_url) {
            await trx('animation_outputs')
              .where('animation_id', animationAsset.animation_id)
              .update({ public_url: freshUrl });
            animationAsset.public_url = freshUrl;
          }
        }

        if (voiceAsset) {
          const freshUrl = await StorageUrlHelper.getFreshUrl(voiceAsset.public_url);
          if (freshUrl !== voiceAsset.public_url) {
            await trx('voice_outputs')
              .where('voice_id', voiceAsset.voice_id)
              .update({ public_url: freshUrl });
            voiceAsset.public_url = freshUrl;
          }
        }

        return {
          visual: {
            type: videoAsset ? 'video' : (animationAsset ? 'animation' : 'image'),
            asset: visualAsset,
            originalImage: imageAsset,
            isGenerated: !!(videoAsset || animationAsset)
          },
          voice: voiceAsset,
          availableAssets: {
            hasImage: !!imageAsset,
            hasVideo: !!videoAsset,
            hasAnimation: !!animationAsset,
            hasVoice: !!voiceAsset
          }
        };
      });

      return assets;
    } catch (error) {
      logger.error(`Error fetching scene assets for job ${jobId}, scene ID ${sceneId}:`, error);
      throw error;
    }
  }

  async getMusicAsset(jobId) {
    try {
      const music = await knex('music_outputs')
        .where({ job_id: jobId })
        .first();

      if (music) {
        // Refresh URL if needed
        const freshUrl = await StorageUrlHelper.getFreshUrl(music.public_url);
        if (freshUrl !== music.public_url) {
          await knex('music_outputs')
            .where('music_id', music.music_id)
            .update({ public_url: freshUrl });
          music.public_url = freshUrl;
        }

        logger.info('Found music asset:', {
          jobId,
          musicId: music.music_id,
          publicUrl: music.public_url
        });
      } else {
        logger.info(`No music asset found for job ${jobId}`);
      }

      return music;
    } catch (error) {
      logger.error(`Error fetching music asset for job ${jobId}:`, error);
      throw error;
    }
  }

  async getAssemblyByJobId(jobId) {
    try {
      if (!this.isValidUUID(jobId)) {
        throw new Error(`Invalid jobId: ${jobId}`);
      }

      const assembly = await knex('assembly_outputs')
        .where('job_id', jobId)
        .first();

      if (!assembly) {
        return null;
      }

      return {
        ...assembly,
        metadata: JSON.parse(assembly.metadata)
      };
    } catch (error) {
      logger.error('Error getting assembly by job ID:', error);
      throw error;
    }
  }

  async getAllScenes(jobId) {
    try {
      const scenes = await knex('llm_scenes')
        .where('job_id', jobId)
        .orderBy('scene_id', 'asc');
      return scenes;
    } catch (error) {
      logger.error(`Error fetching all scenes for job ${jobId}:`, error);
      throw error;
    }
  }

  async updateAssemblyStatus(assemblyId, status, metadata = {}) {
    try {
      const existingAssembly = await knex('assembly_outputs')
        .where('assembly_id', assemblyId)
        .first();

      if (!existingAssembly) {
        throw new Error(`Assembly not found with ID: ${assemblyId}`);
      }

      const existingMetadata = JSON.parse(existingAssembly.metadata);
      const updatedMetadata = {
        ...existingMetadata,
        ...metadata,
        updatedAt: new Date().toISOString()
      };

      const [updated] = await knex('assembly_outputs')
        .where('assembly_id', assemblyId)
        .update({
          status: status,
          metadata: JSON.stringify(updatedMetadata),
          updated_at: knex.fn.now()
        })
        .returning('*');

      return {
        ...updated,
        metadata: JSON.parse(updated.metadata)
      };
    } catch (error) {
      logger.error('Error updating assembly status:', error);
      throw error;
    }
  }

  async updateVideoUrl(assemblyId, videoFileUrl) {
    try {
      const [updated] = await knex('assembly_outputs')
        .where('assembly_id', assemblyId)
        .update({
          video_file_url: videoFileUrl,
          status: 'completed',
          updated_at: knex.fn.now()
        })
        .returning('*');

      return updated;
    } catch (error) {
      logger.error('Error updating video URL:', error);
      throw error;
    }
  }

  async validateAssemblyAssets(jobId) {
    try {
      const scenes = await this.getAllScenes(jobId);
      logger.info('Validating assets for scenes:', {
        jobId,
        sceneCount: scenes.length
      });

      const results = await Promise.all(scenes.map(async (scene) => {
        try {
          const assets = await this.getSceneAssets(jobId, scene.scene_id);
          return {
            sceneId: scene.scene_id,
            sceneNumber: scene.scene_number,
            status: 'valid',
            assets: {
              visualType: assets.visual.type,
              isGenerated: assets.visual.isGenerated,
              hasVoice: !!assets.voice
            }
          };
        } catch (error) {
          return {
            sceneId: scene.scene_id,
            sceneNumber: scene.scene_number,
            status: 'invalid',
            error: error.message
          };
        }
      }));

      const musicAsset = await this.getMusicAsset(jobId);
      
      return {
        scenes: results,
        music: !!musicAsset,
        isValid: results.every(result => result.status === 'valid')
      };
    } catch (error) {
      logger.error(`Error validating assembly assets for job ${jobId}:`, error);
      throw error;
    }
  }

  isValidUUID(uuid) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  async updateAssemblyOutput(assemblyId, updateData) {
    try {
      // If we have a video URL, upload it to storage
      if (updateData.videoUrl) {
        const fileName = `final_video_${assemblyId}.mp4`;
        const localPath = path.join(this.storageBasePath, fileName);

        // Download the video locally first
        await this.downloadFile(updateData.videoUrl, localPath);

        // Upload to storage
        const storageResult = await storageService.uploadFile(localPath, 'assembly');

        // Update the data with storage info
        updateData = {
          ...updateData,
          file_path: localPath,
          storage_key: storageResult.storageKey,
          public_url: storageResult.url
        };

        // Clean up local file
        await fs.unlink(localPath);
      }

      const [updated] = await knex('assembly_outputs')
        .where('assembly_id', assemblyId)
        .update({
          ...updateData,
          updated_at: knex.fn.now()
        })
        .returning('*');

      return updated;
    } catch (error) {
      logger.error('Error updating assembly output:', error);
      throw error;
    }
  }

  async downloadFile(url, localPath) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to download file: ${response.statusText}`);
      }

      const buffer = await response.buffer();
      await fs.writeFile(localPath, buffer);

      logger.info('File downloaded successfully:', { url, localPath });
    } catch (error) {
      logger.error('Error downloading file:', error);
      throw error;
    }
  }
}

module.exports = new AssemblyDataAccess();