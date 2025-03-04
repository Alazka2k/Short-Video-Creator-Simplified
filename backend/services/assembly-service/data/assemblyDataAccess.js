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

  async createAssemblyOutput(jobId, userId, templateId) {
    try {
      const [result] = await knex('assembly_outputs')
        .insert({
          job_id: jobId,
          user_id: userId,
          template_id: templateId,
          status: 'pending',
          created_at: knex.fn.now(),
          updated_at: knex.fn.now()
        })
        .returning('assembly_id');

      return result.assembly_id;
    } catch (error) {
      logger.error('Error creating assembly output:', error);
      throw error;
    }
  }

  async getSceneAssets(jobId, sceneId) {
    try {
      // Get the job first to access metadata
      const job = await knex('jobs')
        .where({ job_id: jobId })
        .first();

      if (!job) {
        throw new Error(`Job not found: ${jobId}`);
      }

      // Parse metadata
      const metadata = typeof job.metadata === 'string' ? 
        JSON.parse(job.metadata) : job.metadata;

      // Find the scene in metadata
      const scene = metadata.scenes.find(s => s.sceneId === sceneId);
      if (!scene) {
        throw new Error(`Scene ${sceneId} not found in job ${jobId}`);
      }

      logger.info('Found scene assets in job metadata:', {
        jobId,
        sceneId,
        hasImage: !!scene.image,
        hasVideo: !!scene.video,
        hasVoice: !!scene.voice,
        hasAnimation: !!scene.animation
      });

      // Validate we have at least one visual asset
      if (!scene.video && !scene.animation && !scene.image) {
        throw new Error(`Missing required visual asset for scene ${sceneId}`);
      }

      // Determine which visual asset to use (prioritize video/animation over image)
      const visualAsset = scene.video || scene.animation || scene.image;

      // Refresh URLs if needed
      try {
        if (scene.image?.publicUrl) {
          scene.image.publicUrl = await StorageUrlHelper.getFreshUrl(scene.image.publicUrl);
        }
        if (scene.video?.publicUrl) {
          scene.video.publicUrl = await StorageUrlHelper.getFreshUrl(scene.video.publicUrl);
        }
        if (scene.animation?.publicUrl) {
          scene.animation.publicUrl = await StorageUrlHelper.getFreshUrl(scene.animation.publicUrl);
        }
        if (scene.voice?.publicUrl) {
          scene.voice.publicUrl = await StorageUrlHelper.getFreshUrl(scene.voice.publicUrl);
        }

        // Update job metadata with fresh URLs
        await knex('jobs')
          .where({ job_id: jobId })
          .update({ 
            metadata: JSON.stringify(metadata),
            updated_at: knex.fn.now()
          });

      } catch (error) {
        logger.error('Failed to refresh URLs for scene assets:', {
          jobId,
          sceneId,
          error: error.message
        });
        throw new Error(`Failed to refresh URLs for scene ${sceneId}: ${error.message}`);
      }

      return {
        metadata: metadata,
        visual: {
          type: scene.video ? 'video' : (scene.animation ? 'animation' : 'image'),
          asset: {
            ...visualAsset,
            storage_key: visualAsset.storageKey,
            public_url: visualAsset.publicUrl
          },
          originalImage: scene.image ? {
            ...scene.image,
            storage_key: scene.image.storageKey,
            public_url: scene.image.publicUrl
          } : null,
          isGenerated: !!(scene.video || scene.animation)
        },
        voice: scene.voice ? {
          ...scene.voice,
          storage_key: scene.voice.storageKey,
          public_url: scene.voice.publicUrl
        } : null,
        availableAssets: {
          hasImage: !!scene.image,
          hasVideo: !!scene.video,
          hasAnimation: !!scene.animation,
          hasVoice: !!scene.voice
        }
      };
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
      const result = await knex('assembly_outputs')
        .where('job_id', jobId)
        .orderBy('created_at', 'desc')
        .first();

      return result;
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

  async updateAssemblyOutput(assemblyId, updates) {
    try {
      const existingAssembly = await knex('assembly_outputs')
        .where('assembly_id', assemblyId)
        .first();

      if (!existingAssembly) {
        throw new Error(`Assembly not found with ID: ${assemblyId}`);
      }

      const updateData = {
        ...updates,
        updated_at: knex.fn.now()
      };

      // Handle metadata merging
      if (updates.metadata) {
        const existingMetadata = typeof existingAssembly.metadata === 'object' 
          ? existingAssembly.metadata 
          : JSON.parse(existingAssembly.metadata || '{}');
          
        updateData.metadata = {
          ...existingMetadata,
          ...updates.metadata
        };
      }

      // Handle assembly_config
      if (updates.assembly_config) {
        updateData.assembly_config = updates.assembly_config;
      }

      // Ensure status is properly set
      if (updates.status) {
        updateData.status = updates.status;
        logger.info('Updating assembly status:', {
          assemblyId,
          oldStatus: existingAssembly.status,
          newStatus: updates.status
        });
      }

      logger.info('Updating assembly output:', {
        assemblyId,
        status: updateData.status,
        hasStorageKey: !!updateData.storage_key,
        hasPublicUrl: !!updateData.public_url
      });

      const [result] = await knex('assembly_outputs')
        .where('assembly_id', assemblyId)
        .update(updateData)
        .returning('*');

      logger.info('Assembly output updated successfully:', {
        assemblyId,
        status: result.status,
        updatedAt: result.updated_at
      });

      return result;
    } catch (error) {
      logger.error('Error updating assembly output:', error);
      throw error;
    }
  }

  async getAssemblyOutput(assemblyId) {
    try {
      const result = await knex('assembly_outputs')
        .where('assembly_id', assemblyId)
        .first();

      return result;
    } catch (error) {
      logger.error('Error getting assembly output:', error);
      throw error;
    }
  }

  async getTemplateConfig(templateId) {
    try {
      const result = await knex('template_configs')
        .where('template_id', templateId)
        .first();
      return result?.config;
    } catch (error) {
      logger.error('Error getting template config:', error);
      throw error;
    }
  }

  async listTemplatesByAspectRatio(aspectRatio) {
    try {
      const result = await knex('template_configs')
        .where('aspect_ratio', aspectRatio)
        .orderBy('name', 'asc')
        .select('template_id', 'name', 'description', 'aspect_ratio', 'preview_url', 'metadata');
      return result;
    } catch (error) {
      logger.error('Error listing templates by aspect ratio:', error);
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

  async getLLMResultProperties(jobId, options = {}) {
    try {
      const job = await knex('jobs')
        .where({ job_id: jobId })
        .first();

      if (!job) {
        throw new Error(`Job not found: ${jobId}`);
      }

      // Parse metadata if needed
      const metadata = typeof job.metadata === 'string' ? 
        JSON.parse(job.metadata) : job.metadata;

      if (!metadata.llmResult) {
        throw new Error(`No LLM result found in job metadata for job: ${jobId}`);
      }

      const llmResult = metadata.llmResult;
      
      // Extract global properties
      const globalProperties = {
        title: llmResult.title,
        description: llmResult.description,
        hashtags: llmResult.hashtags,
        prompt: llmResult.prompt
      };

      // Extract scene-specific properties if requested
      let sceneProperties = {};
      if (options.includeScenes && Array.isArray(llmResult.scenes)) {
        sceneProperties = llmResult.scenes.reduce((acc, scene, index) => {
          acc[`scene${index + 1}`] = {
            description: scene.description,
            video_prompt: scene.video_prompt,
            visual_prompt: scene.visual_prompt
          };
          return acc;
        }, {});
      }

      logger.info('Retrieved LLM result properties:', {
        jobId,
        hasGlobalProperties: Object.keys(globalProperties).length > 0,
        hasSceneProperties: Object.keys(sceneProperties).length > 0
      });

      return {
        ...globalProperties,
        scenes: options.includeScenes ? sceneProperties : undefined
      };
    } catch (error) {
      logger.error(`Error getting LLM result properties for job ${jobId}:`, error);
      throw error;
    }
  }
}

module.exports = new AssemblyDataAccess();