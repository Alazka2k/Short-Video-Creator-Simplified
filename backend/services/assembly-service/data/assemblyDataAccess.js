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

        // Refresh URLs and update database
        try {
          if (imageAsset) {
            imageAsset.public_url = await StorageUrlHelper.getFreshUrl(imageAsset.public_url);
            await trx('image_outputs')
              .where('image_id', imageAsset.image_id)
              .update({ public_url: imageAsset.public_url });
          }

          if (videoAsset) {
            videoAsset.public_url = await StorageUrlHelper.getFreshUrl(videoAsset.public_url);
            await trx('video_outputs')
              .where('video_id', videoAsset.video_id)
              .update({ public_url: videoAsset.public_url });
          }

          if (animationAsset) {
            animationAsset.public_url = await StorageUrlHelper.getFreshUrl(animationAsset.public_url);
            await trx('animation_outputs')
              .where('animation_id', animationAsset.animation_id)
              .update({ public_url: animationAsset.public_url });
          }

          if (voiceAsset) {
            voiceAsset.public_url = await StorageUrlHelper.getFreshUrl(voiceAsset.public_url);
            await trx('voice_outputs')
              .where('voice_id', voiceAsset.voice_id)
              .update({ public_url: voiceAsset.public_url });
          }
        } catch (error) {
          logger.error('Failed to refresh URLs for scene assets:', {
            jobId,
            sceneId,
            error: error.message
          });
          throw new Error(`Failed to refresh URLs for scene ${sceneId}: ${error.message}`);
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
        try {
          // Refresh URL and update database
          music.public_url = await StorageUrlHelper.getFreshUrl(music.public_url);
          await knex('music_outputs')
            .where('music_id', music.music_id)
            .update({ public_url: music.public_url });

          logger.info('Found and refreshed music asset:', {
            jobId,
            musicId: music.music_id,
            publicUrl: music.public_url
          });
        } catch (error) {
          logger.error('Failed to refresh URL for music asset:', {
            jobId,
            musicId: music.music_id,
            error: error.message
          });
          throw new Error(`Failed to refresh URL for music asset: ${error.message}`);
        }
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

      // Handle metadata
      if (assembly.metadata) {
        try {
          assembly.metadata = typeof assembly.metadata === 'string' ? 
            JSON.parse(assembly.metadata) : assembly.metadata;
        } catch (e) {
          logger.error('Error parsing metadata:', e);
          assembly.metadata = null;
        }
      }

      // Handle assembly config
      if (assembly.assembly_config) {
        try {
          assembly.assembly_config = typeof assembly.assembly_config === 'string' ? 
            JSON.parse(assembly.assembly_config) : assembly.assembly_config;
        } catch (e) {
          logger.error('Error parsing assembly_config:', e);
          assembly.assembly_config = null;
        }
      }

      return assembly;
    } catch (error) {
      logger.error('Error getting assembly by job ID:', {
        jobId,
        error: error.message,
        stack: error.stack
      });
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

  async updateAssemblyOutput(assemblyId, updateData, videoUrl = null) {
    try {
      let dbUpdate = {
        ...updateData,
        updated_at: knex.fn.now()
      };

      // If we have a video URL, handle file storage
      if (videoUrl) {
        // Create date-based folder structure
        const dateFolder = new Date().toISOString().split('T')[0];
        const outputPath = path.join(
          this.storageBasePath,
          dateFolder,
          updateData.job_id
        );
        
        const fileName = 'assembled_video.mp4';
        const localPath = path.join(outputPath, fileName);

        // Download the video locally first
        await this.downloadFile(videoUrl, localPath);

        // Upload to storage
        const storageResult = await storageService.uploadFile(localPath, 'assembly');

        // Save metadata
        const metadataPath = path.join(outputPath, 'metadata.json');
        await fs.writeFile(
          metadataPath, 
          JSON.stringify({
            jobId: updateData.job_id,
            videoUrl,
            createdAt: new Date().toISOString(),
            ...updateData
          }, null, 2)
        );

        logger.info('File uploaded to storage:', {
          localPath,
          publicUrl: storageResult.url,
          storageKey: storageResult.storageKey
        });

        // Create database update object with correct column names
        dbUpdate = {
          ...dbUpdate,
          file_path: localPath.replace(/\\/g, '/'),
          storage_key: storageResult.storageKey,
          public_url: storageResult.url,
          status: 'completed'
        };

        // Log the update data
        logger.info('Updating database with:', {
          projectId: updateData.project_id,
          filePath: dbUpdate.file_path,
          storageKey: dbUpdate.storage_key,
          publicUrl: dbUpdate.public_url,
          status: dbUpdate.status
        });

        // Find assembly by project_id and update
        const [updated] = await knex('assembly_outputs')
          .where('project_id', updateData.project_id)
          .update(dbUpdate)
          .returning('*');

        if (!updated) {
          throw new Error(`No assembly found with project_id: ${updateData.project_id}`);
        }

        // Verify the update
        logger.info('Database update result:', {
          projectId: updated.project_id,
          status: updated.status,
          filePath: updated.file_path,
          storageKey: updated.storage_key,
          publicUrl: updated.public_url
        });

        return updated;
      } else {
        // Regular update without file handling
        const [updated] = await knex('assembly_outputs')
          .where('project_id', updateData.project_id)
          .update(dbUpdate)
          .returning('*');

        return updated;
      }
    } catch (error) {
      logger.error('Error updating assembly output:', {
        error: error.message,
        stack: error.stack,
        projectId: updateData.project_id,
        updateData
      });
      throw error;
    }
  }

  async downloadFile(url, localPath) {
    try {
      // Ensure directory exists
      const directory = path.dirname(localPath);
      await fs.mkdir(directory, { recursive: true });

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to download file: ${response.statusText}`);
      }

      const buffer = await response.buffer();
      await fs.writeFile(localPath, buffer);

      logger.info('File downloaded successfully:', { url, localPath });
    } catch (error) {
      logger.error('Error downloading file:', {
        url,
        localPath,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }
}

module.exports = new AssemblyDataAccess();