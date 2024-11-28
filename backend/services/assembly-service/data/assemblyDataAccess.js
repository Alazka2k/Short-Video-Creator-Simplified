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
      // Validate jobId
      if (!jobId || typeof jobId !== 'string' || !this.isValidUUID(jobId)) {
        throw new Error(`Invalid jobId: ${jobId}`);
      }

      // Create relative and full paths
      const dateFolder = new Date().toISOString().split('T')[0];
      const relativePath = path.join(dateFolder, jobId);
      const fullPath = path.join(this.storageBasePath, relativePath);

      // Ensure directory exists
      await fs.mkdir(fullPath, { recursive: true });

      // Define file name and path
      const fileName = 'final_video.mp4';
      const filePath = path.join(fullPath, fileName);

      // Prepare metadata
      const fullMetadata = {
        ...assemblyData.metadata,
        relativePath,
        fullPath: filePath,
        fileName,
        createdAt: new Date().toISOString()
      };

      // Create database record
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

  isValidUUID(uuid) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }
}

module.exports = new AssemblyDataAccess(); 