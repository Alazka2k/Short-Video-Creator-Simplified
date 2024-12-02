const knex = require('knex')(require('../../../../knexfile')[process.env.NODE_ENV]);
const logger = require('../../../shared/utils/logger');
const path = require('path');
const fs = require('fs').promises;
const config = require('../../../shared/utils/config');

class AssemblyDataAccess {
  constructor() {
    this.storageBasePath = path.join(config.output.directory, 'assembly');
  }

  async createAssemblyOutput(jobId, assemblyData) {
    try {
      if (!this.isValidUUID(jobId)) {
        throw new Error(`Invalid jobId: ${jobId}`);
      }

      const dateFolder = new Date().toISOString().split('T')[0];
      const relativePath = path.join(dateFolder, jobId);
      const fullPath = path.join(this.storageBasePath, relativePath);

      await fs.mkdir(fullPath, { recursive: true });

      const fileName = 'final_video.mp4';
      const filePath = path.join(fullPath, fileName);

      const fullMetadata = {
        ...assemblyData.metadata,
        relativePath,
        fullPath: filePath,
        fileName,
        createdAt: new Date().toISOString()
      };

      const [assemblyRecord] = await knex('assembly_outputs')
        .insert({
          job_id: jobId,
          status: assemblyData.status || 'pending',
          project_id: assemblyData.projectId,
          assembly_config: assemblyData.assemblyConfig,
          metadata: JSON.stringify(fullMetadata)
        })
        .returning('*');

      logger.info(`Created assembly output record: ${assemblyRecord.assembly_id}`);
      return assemblyRecord;
    } catch (error) {
      logger.error('Error creating assembly output:', error);
      throw error;
    }
  }

  async getSceneAssets(jobId, sceneId) {
    try {
      const assets = await knex.transaction(async (trx) => {
        // Get video asset
        const video = await trx('video_outputs')
          .where({ job_id: jobId, scene_id: sceneId })
          .first();
        
        // Get voice asset
        const voice = await trx('voice_outputs')
          .where({ job_id: jobId, scene_id: sceneId })
          .first();

        // Get scene details
        const scene = await trx('llm_scenes')
          .where({ job_id: jobId, scene_id: sceneId })
          .first();
          
        if (!video || !voice || !scene) {
          throw new Error(`Missing required assets for scene ${sceneId}`);
        }

        return { video, voice, scene };
      });

      return assets;
    } catch (error) {
      logger.error(`Error fetching scene assets for job ${jobId}, scene ${sceneId}:`, error);
      throw error;
    }
  }

  async getMusicAsset(jobId) {
    try {
      const music = await knex('music_outputs')
        .where({ job_id: jobId })
        .first();
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
        .orderBy('scene_number', 'asc');
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
      const results = await Promise.all(scenes.map(async (scene) => {
        try {
          const assets = await this.getSceneAssets(jobId, scene.scene_id);
          return {
            sceneId: scene.scene_id,
            sceneNumber: scene.scene_number,
            status: 'valid',
            assets: {
              video: !!assets.video,
              voice: !!assets.voice
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

      const music = await this.getMusicAsset(jobId);
      
      return {
        scenes: results,
        music: !!music,
        isValid: results.every(result => result.status === 'valid') && !!music
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
}

module.exports = new AssemblyDataAccess();