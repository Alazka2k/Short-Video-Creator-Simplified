const knex = require('knex')(require('../../../../knexfile')[process.env.NODE_ENV || 'development']);
const logger = require('../../../shared/utils/logger');
const path = require('path');
const fs = require('fs').promises;
const config = require('../../../shared/utils/config');

class JobDataAccess {
  constructor() {
    this.storageBasePath = path.join(config.output.directory, 'jobs');
  }

  async createJob(jobData) {
    try {
      const { 
        jobId, 
        prompt, 
        status, 
        parameters = {}, 
        visualizationType,
        serviceConfig = {} 
      } = jobData;

      // Validate jobId
      if (!jobId || typeof jobId !== 'string' || !this.isValidUUID(jobId)) {
        throw new Error(`Invalid jobId: ${jobId}`);
      }

      // Get service config from parameters if available
      const serviceConfigFromParams = parameters.serviceConfig || {};

      // Initialize service sequence based on config
      const serviceSequence = ['llm']; // LLM is always first
      if (!serviceConfigFromParams.skipImage) serviceSequence.push('image');
      if (!serviceConfigFromParams.skipVoice) serviceSequence.push('voice');
      if (!serviceConfigFromParams.skipMusic) serviceSequence.push('music');
      if (!serviceConfigFromParams.skipVisualization) serviceSequence.push(visualizationType);

      // Create metadata object with all configurations
      const metadata = {
        parameters,
        startTime: new Date().toISOString(),
        serviceConfig: serviceConfigFromParams,
        visualizationType: parameters.visualizationType || visualizationType || null
      };

      // Create job record
      const [jobRecord] = await knex('jobs')
        .insert({
          job_id: jobId,
          prompt,
          status,
          service_sequence: JSON.stringify(serviceSequence),
          metadata: JSON.stringify(metadata)
        })
        .returning('*');

      logger.info(`Created job record: ${jobRecord.job_id}`, {
        serviceConfig: serviceConfigFromParams,
        visualizationType: metadata.visualizationType,
        serviceSequence
      });

      return jobRecord;
    } catch (error) {
      logger.error('Error creating job:', error);
      throw error;
    }
  }

  async getJob(jobId) {
    try {
      if (!this.isValidUUID(jobId)) {
        throw new Error(`Invalid jobId: ${jobId}`);
      }
  
      const job = await knex('jobs')
        .where('job_id', jobId)
        .first();
  
      if (!job) return null;
  
      return {
        ...job,
        service_sequence: this.safeJsonParse(job.service_sequence, []),
        metadata: this.safeJsonParse(job.metadata, {}),
        serviceConfig: {
          skipVoice: job.skip_voice,
          skipMusic: job.skip_music,
          skipImage: job.skip_image,
          skipVisualization: job.skip_visualization
        }
      };
    } catch (error) {
      logger.error('Error getting job:', error);
      throw error;
    }
  }
  
  async updateJobProgress(jobId, service, status, details = {}) {
    try {
      const job = await this.getJob(jobId);
      if (!job) throw new Error(`Job not found: ${jobId}`);
  
      const metadata = this.safeJsonParse(job.metadata) || {};
      const serviceSequence = this.safeJsonParse(job.service_sequence) || [];
  
      // Add service to sequence if not already present
      if (!serviceSequence.includes(service)) {
        serviceSequence.push(service);
      }
  
      metadata.progress = metadata.progress || {};
      metadata.progress[service] = {
        status,
        ...(details || {}),
        updatedAt: new Date().toISOString()
      };
  
      // If any service failed, store the error
      if (status === 'failed' && details.error) {
        metadata.errors = metadata.errors || [];
        metadata.errors.push({
          service,
          error: details.error,
          timestamp: new Date().toISOString()
        });
      }
  
      await this.updateJob(jobId, {
        metadata: JSON.stringify(metadata),
        service_sequence: JSON.stringify(serviceSequence)
      });
  
      logger.info(`Updated progress for job ${jobId}, service: ${service}, status: ${status}`);
    } catch (error) {
      logger.error('Error updating job progress:', error);
      throw error;
    }
  }
  
  // Helper method for safe JSON parsing
  safeJsonParse(value) {
    if (!value) return null;
    if (typeof value === 'object') return value;
    try {
      return JSON.parse(value);
    } catch (error) {
      logger.warn(`Error parsing JSON: ${error.message}. Using default value.`);
      return null;
    }
  }

  async updateJob(jobId, updateData) {
    try {
      // If there's an error in the metadata, ensure it's properly stored
      if (updateData.metadata && typeof updateData.metadata === 'string') {
        try {
          const metadata = JSON.parse(updateData.metadata);
          if (metadata.error) {
            updateData.error = metadata.error; // Store error in dedicated column
          }
        } catch (parseError) {
          logger.warn('Error parsing metadata JSON:', parseError);
        }
      }

      const [updated] = await knex('jobs')
        .where('job_id', jobId)
        .update({
          ...updateData,
          updated_at: knex.fn.now()
        })
        .returning('*');

      return updated;
    } catch (error) {
      logger.error('Error updating job:', error);
      throw error;
    }
  }

  async getAllJobs(filters = {}) {
    try {
      let query = knex('jobs');

      if (filters.status) {
        query = query.where('status', filters.status);
      }

      const jobs = await query.orderBy('created_at', 'desc');

      return jobs.map(job => ({
        ...job,
        service_sequence: JSON.parse(job.service_sequence || '[]'),
        metadata: JSON.parse(job.metadata || '{}')
      }));
    } catch (error) {
      logger.error('Error getting all jobs:', error);
      throw error;
    }
  }

  isValidUUID(uuid) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }
}

module.exports = new JobDataAccess();