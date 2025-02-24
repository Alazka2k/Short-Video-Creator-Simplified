const knex = require('knex')(require('../../../../knexfile')[process.env.NODE_ENV || 'development']);
const logger = require('../../../shared/utils/logger');
const path = require('path');
const fs = require('fs').promises;
const config = require('../../../shared/utils/config');
const StorageUrlHelper = require('../../../shared/utils/storage-url-helper');

class JobDataAccess {
  constructor() {
    this.storageBasePath = path.join(config.output.directory, 'jobs');
    this.storageUrlHelper = StorageUrlHelper.getInstance();
  }

  async createJob(jobData) {
    try {
      const { 
        jobId, 
        prompt, 
        status, 
        parameters = {}, 
        visualizationType,
        serviceConfig = {},
        userId = null
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

      logger.info(`Creating job record for jobId: ${jobId}`, { 
        userId,
        serviceConfig: serviceConfigFromParams,
        visualizationType: metadata.visualizationType,
        serviceSequence
      });

      // Create job record
      const [jobRecord] = await knex('jobs')
        .insert({
          job_id: jobId,
          user_id: userId,
          prompt,
          status,
          service_sequence: JSON.stringify(serviceSequence),
          metadata: JSON.stringify(metadata),
          created_at: new Date(),
          updated_at: new Date()
        })
        .returning('*');

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
  
      const processedJob = {
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

      // Refresh URLs in the job metadata
      const updatedJob = await this.storageUrlHelper.updateJobUrls(processedJob);
      
      // If URLs were refreshed, update the database
      if (JSON.stringify(updatedJob.metadata) !== JSON.stringify(processedJob.metadata)) {
        logger.info('Updating job with refreshed URLs:', { jobId });
        await this.updateJob(jobId, {
          metadata: JSON.stringify(updatedJob.metadata)
        });
      }

      return updatedJob;
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

      // Apply filters
      if (filters.status) {
        query = query.where('status', filters.status);
      }

      if (filters.userId) {
        query = query.where('user_id', filters.userId);
      }

      // Filter by services in service_sequence
      if (filters.services && Array.isArray(filters.services)) {
        query = query.where(function() {
          this.where(function() {
            this.whereRaw('service_sequence::text ILIKE ?', [`%${filters.services[0]}%`]);
          });
          // Add additional service conditions if there are more services
          for (let i = 1; i < filters.services.length; i++) {
            this.orWhereRaw('service_sequence::text ILIKE ?', [`%${filters.services[i]}%`]);
          }
        });
      }

      // Get total count before pagination
      const [{ count }] = await query.clone().count();

      // Apply sorting
      const sortBy = filters.sortBy || 'created_at';
      const sortOrder = filters.sortOrder?.toLowerCase() === 'asc' ? 'asc' : 'desc';
      query = query.orderBy(sortBy, sortOrder);

      // Apply pagination
      const page = parseInt(filters.page) || 1;
      const limit = parseInt(filters.limit) || 20;
      const offset = (page - 1) * limit;
      query = query.offset(offset).limit(limit);

      // Execute query
      const jobs = await query;

      // Process results and refresh URLs
      const processedJobs = await Promise.all(jobs.map(async job => {
        const processedJob = {
          ...job,
          service_sequence: this.safeJsonParse(job.service_sequence) || [],
          metadata: this.safeJsonParse(job.metadata) || {}
        };

        // Refresh URLs for each job
        const updatedJob = await this.storageUrlHelper.updateJobUrls(processedJob);
        
        // If URLs were refreshed, update the database
        if (JSON.stringify(updatedJob.metadata) !== JSON.stringify(processedJob.metadata)) {
          logger.info('Updating job with refreshed URLs:', { jobId: job.job_id });
          await this.updateJob(job.job_id, {
            metadata: JSON.stringify(updatedJob.metadata)
          });
        }

        return updatedJob;
      }));

      // Return paginated response
      return {
        data: processedJobs,
        pagination: {
          total: parseInt(count),
          page,
          limit,
          totalPages: Math.ceil(count / limit)
        }
      };
    } catch (error) {
      logger.error('Error getting jobs:', error);
      throw error;
    }
  }

  isValidUUID(uuid) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }
}

module.exports = new JobDataAccess();