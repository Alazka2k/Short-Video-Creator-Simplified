// backend/services/voice-service/data/voiceDataAccess.js
const knex = require('knex')(require('../../../../knexfile')[process.env.NODE_ENV]);
const logger = require('../../../shared/utils/logger');
const path = require('path');
const fs = require('fs').promises;
const config = require('../../../shared/utils/config');

class VoiceDataAccess {
  constructor() {
    this.storageBasePath = path.join(config.output.directory, 'voice');
  }

  async createVoiceOutput(jobId, sceneId, voiceData) {
    try {
      // Validate jobId
      if (!jobId || typeof jobId !== 'string' || !this.isValidUUID(jobId)) {
        throw new Error(`Invalid jobId: ${jobId}`);
      }

      // Create relative and full paths
      const dateFolder = new Date().toISOString().split('T')[0];
      const relativePath = path.join(dateFolder, jobId, `scene_${sceneId}`);
      const fullPath = path.join(this.storageBasePath, relativePath);

      // Ensure directory exists
      await fs.mkdir(fullPath, { recursive: true });

      // Define file name and path
      const fileName = `voice_scene_${sceneId}.mp3`;
      const filePath = path.join(fullPath, fileName);

      // Copy the temporary file to its final location
      await fs.copyFile(voiceData.tempFilePath, filePath);

      // Prepare metadata
      const fullMetadata = {
        ...voiceData.metadata,
        relativePath,
        fullPath: filePath,
        fileName,
        voiceId: voiceData.voiceId,
        duration: voiceData.duration,
        createdAt: new Date().toISOString()
      };

      // Create database record with S3 information
      const [voiceRecord] = await knex('voice_outputs')
        .insert({
          job_id: jobId,
          scene_id: sceneId,
          elevenlabs_voice_id: voiceData.voiceId,
          file_path: voiceData.tempFilePath,  // Keep local path for backup
          storage_key: voiceData.storageKey,       // Add S3 storage key
          public_url: voiceData.publicUrl,         // Add S3 public URL
          metadata: JSON.stringify({
            ...voiceData.metadata,
            storage: {
              key: voiceData.storageKey,
              url: voiceData.publicUrl
            }
          })
        })
        .returning('*');

      logger.info('Created voice output record:', {
        voiceId: voiceRecord.voice_id,
        storageKey: voiceData.storageKey
      });

      return voiceRecord;
    } catch (error) {
      logger.error('Error creating voice output:', error);
      throw error;
    }
  }

  async getVoicesByJobId(jobId) {
    try {
      if (!this.isValidUUID(jobId)) {
        throw new Error(`Invalid jobId: ${jobId}`);
      }

      const voices = await knex('voice_outputs')
        .where('job_id', jobId)
        .orderBy('created_at');

      return voices.map(voice => ({
        ...voice,
        metadata: JSON.parse(voice.metadata)
      }));
    } catch (error) {
      logger.error('Error getting voices by job ID:', error);
      throw error;
    }
  }

  async getVoiceBySceneId(sceneId) {
    try {
      const voice = await knex('voice_outputs')
        .where('scene_id', sceneId)
        .first();

      if (!voice) {
        return null;
      }

      return {
        ...voice,
        metadata: JSON.parse(voice.metadata)
      };
    } catch (error) {
      logger.error('Error getting voice by scene ID:', error);
      throw error;
    }
  }

  async updateVoiceMetadata(voiceId, metadata) {
    try {
      const existingVoice = await knex('voice_outputs')
        .where('voice_id', voiceId)
        .first();

      if (!existingVoice) {
        throw new Error(`Voice not found with ID: ${voiceId}`);
      }

      const existingMetadata = JSON.parse(existingVoice.metadata);
      const updatedMetadata = {
        ...existingMetadata,
        ...metadata,
        updatedAt: new Date().toISOString()
      };

      const [updated] = await knex('voice_outputs')
        .where('voice_id', voiceId)
        .update({
          metadata: JSON.stringify(updatedMetadata),
          updated_at: knex.fn.now()
        })
        .returning('*');

      return {
        ...updated,
        metadata: JSON.parse(updated.metadata)
      };
    } catch (error) {
      logger.error('Error updating voice metadata:', error);
      throw error;
    }
  }

  async deleteVoice(voiceId) {
    try {
      const voice = await knex('voice_outputs')
        .where('voice_id', voiceId)
        .first();

      if (!voice) {
        throw new Error(`Voice not found with ID: ${voiceId}`);
      }

      if (voice.metadata) {
        const metadata = JSON.parse(voice.metadata);
        if (metadata.fullPath) {
          try {
            await fs.unlink(metadata.fullPath);
            logger.info(`Deleted physical file: ${metadata.fullPath}`);
          } catch (fileError) {
            logger.warn(`Could not delete physical file: ${metadata.fullPath}`, fileError);
          }
        }
      }

      await knex('voice_outputs')
        .where('voice_id', voiceId)
        .del();

      logger.info(`Deleted voice record with ID: ${voiceId}`);
      return true;
    } catch (error) {
      logger.error('Error deleting voice:', error);
      throw error;
    }
  }

  isValidUUID(uuid) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }
}

module.exports = new VoiceDataAccess();