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
      const { jobId, prompt, status, serviceSequence = [], parameters = {}, visualizationType } = jobData;

      // Validate jobId
      if (!jobId || typeof jobId !== 'string' || !this.isValidUUID(jobId)) {
        throw new Error(`Invalid jobId: ${jobId}`);
      }

      // Create job record
      const [jobRecord] = await knex('jobs')
        .insert({
          job_id: jobId,
          prompt,
          status,
          service_sequence: JSON.stringify(serviceSequence),
          metadata: JSON.stringify({
            parameters,
            visualizationType,
            startTime: new Date().toISOString()
          })
        })
        .returning('*');

      logger.info(`Created job record: ${jobRecord.job_id}`);
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
        metadata: this.safeJsonParse(job.metadata, {})
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
  
      const metadata = this.safeJsonParse(job.metadata, {});
      metadata.progress = metadata.progress || {};
      metadata.progress[service] = {
        status,
        ...details,
        updatedAt: new Date().toISOString()
      };
  
      await this.updateJob(jobId, {
        metadata: JSON.stringify(metadata)
      });
  
      logger.info(`Updated progress for job ${jobId}, service: ${service}, status: ${status}`);
    } catch (error) {
      logger.error('Error updating job progress:', error);
      throw error;
    }
  }
  
  // Helper method for safe JSON parsing
  safeJsonParse(value, defaultValue = null) {
    if (!value) return defaultValue;
    try {
      return JSON.parse(value);
    } catch (error) {
      logger.warn(`Error parsing JSON: ${error.message}. Using default value.`);
      return defaultValue;
    }
  }

  async updateJob(jobId, updateData) {
    try {
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