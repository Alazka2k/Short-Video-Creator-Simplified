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

      /*logger.info(`Creating job record for jobId: ${jobId}`, { 
        userId,
        serviceConfig: serviceConfigFromParams,
        visualizationType: metadata.visualizationType,
        serviceSequence
      });*/

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

      // Only refresh URLs if the job is completed and URLs haven't been refreshed recently
      const metadata = processedJob.metadata;
      const lastUrlRefresh = metadata.lastUrlRefresh ? new Date(metadata.lastUrlRefresh) : null;
      const now = new Date();
      
      // Check if we need to refresh URLs
      const shouldRefresh = job.status === 'completed' && 
                           (!lastUrlRefresh || (now - lastUrlRefresh) > 1800000); // Refresh if more than 30mins has passed

      if (shouldRefresh) {
        // Check if URLs are actually expired
        const hasExpiredUrls = this._checkForExpiredUrls(processedJob);
        
        if (hasExpiredUrls) {
          // Refresh URLs in the job metadata
          const updatedJob = await this.storageUrlHelper.updateJobUrls(processedJob);
          
          // Only update if URLs actually changed
          if (JSON.stringify(updatedJob.metadata) !== JSON.stringify(processedJob.metadata)) {
            // Add lastUrlRefresh timestamp
            updatedJob.metadata.lastUrlRefresh = now.toISOString();
            
            /*logger.info('Refreshing URLs for completed job:', { 
              jobId,
              lastRefresh: lastUrlRefresh?.toISOString(),
              timeSinceLastRefresh: lastUrlRefresh ? `${Math.round((now - lastUrlRefresh) / 1000)}s` : 'never'
            });*/
            
            await this.updateJob(jobId, {
              metadata: JSON.stringify(updatedJob.metadata)
            });
            
            return updatedJob;
          }
        }
      }

      return processedJob;
    } catch (error) {
      logger.error('Error getting job:', error);
      throw error;
    }
  }

  async addResultToScene(jobId, sceneId, serviceName, status, resultData) {
    logger.info(`Adding result to job ${jobId}, scene ${sceneId}`, { serviceName, status });

    const job = await knex('jobs').where({ job_id: jobId }).first();
    if (!job) {
      throw new Error(`Job not found: ${jobId}`);
    }

    let metadata = typeof job.metadata === 'string' ? JSON.parse(job.metadata) : job.metadata;

    if (!metadata.scenes) {
      metadata.scenes = [];
    }

    let scene = metadata.scenes.find(s => s.sceneId === sceneId);
    if (!scene) {
      // If scene doesn't exist, create a placeholder. This might happen if services report out of order.
      scene = { sceneId: sceneId };
      metadata.scenes.push(scene);
    }
    
    // Atomically add or update the service result for the scene
    scene[serviceName] = {
      status,
      ...resultData,
      completedAt: new Date().toISOString()
    };

    // Sort scenes by sceneId to maintain order
    metadata.scenes.sort((a, b) => a.sceneId - b.sceneId);

    const updatedJob = await this.updateJob(jobId, {
      metadata: JSON.stringify(metadata)
    });

    logger.info(`Successfully added ${serviceName} result to scene ${sceneId} for job ${jobId}`);

    // Return the job with the updated metadata, not the whole job object from DB
    return { ...job, metadata };
  }

  async getJobById(jobId) {
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
        service_sequence: this.safeJsonParse(job.service_sequence) || [],
        metadata: this.safeJsonParse(job.metadata) || {}
      };

      // Only refresh URLs for completed jobs
      if (job.status === 'completed') {
        const metadata = processedJob.metadata;
        const lastUrlRefresh = metadata.lastUrlRefresh ? new Date(metadata.lastUrlRefresh) : null;
        const now = new Date();
        const shouldRefresh = !lastUrlRefresh || (now - lastUrlRefresh) > 3600000; // Refresh if more than 1 hour has passed

        if (shouldRefresh) {
          // Refresh URLs for each job
          const updatedJob = await this.storageUrlHelper.updateJobUrls(processedJob);
          
          // Only update if URLs actually changed
          if (JSON.stringify(updatedJob.metadata) !== JSON.stringify(processedJob.metadata)) {
            // Add lastUrlRefresh timestamp
            updatedJob.metadata.lastUrlRefresh = now.toISOString();
            
            /*logger.info('Refreshing URLs for completed job in list:', { 
              jobId: job.job_id,
              lastRefresh: lastUrlRefresh?.toISOString(),
              timeSinceLastRefresh: lastUrlRefresh ? `${Math.round((now - lastUrlRefresh) / 1000)}s` : 'never'
            });*/
            
            await this.updateJob(job.job_id, {
              metadata: JSON.stringify(updatedJob.metadata)
            });
            
            return updatedJob;
          }
        }
      }

      return processedJob;
    } catch (error) {
      logger.error('Error getting job:', error);
      throw error;
    }
  }

  // Helper method to check if any URLs in the job are expired
  _checkForExpiredUrls(job) {
    const metadata = job.metadata;
    if (!metadata) return false;

    // Check scene URLs
    if (metadata.scenes) {
      for (const scene of metadata.scenes) {
        if (scene.image?.publicUrl && this._isUrlExpired(scene.image.publicUrl)) return true;
        if (scene.voice?.publicUrl && this._isUrlExpired(scene.voice.publicUrl)) return true;
        if (scene.video?.publicUrl && this._isUrlExpired(scene.video.publicUrl)) return true;
        if (scene.animation?.publicUrl && this._isUrlExpired(scene.animation.publicUrl)) return true;
      }
    }

    // Check music URL
    if (metadata.music?.publicUrl && this._isUrlExpired(metadata.music.publicUrl)) return true;

    return false;
  }

  // Helper method to check if a URL is expired
  _isUrlExpired(url) {
    try {
      const urlObj = new URL(url);
      const expiresAt = urlObj.searchParams.get('Expires');
      if (!expiresAt) return true;
      
      const expiresTimestamp = parseInt(expiresAt) * 1000; // Convert to milliseconds
      return Date.now() >= expiresTimestamp;
    } catch (error) {
      return true; // If URL is invalid, consider it expired
    }
  }

  async updateJobProgress(jobId, progressData) {
    if (!jobId) {
      logger.warn('Cannot update progress, jobId is missing.');
      return;
    }

    try {
      const job = await knex('jobs').where({ job_id: jobId }).first();
      if (!job) {
        logger.warn(`Cannot update progress, job not found: ${jobId}`);
        return;
      }

      let metadata = this.safeJsonParse(job.metadata) || {};

      // Embed the progress object into the metadata
      metadata.progress = progressData;

      const updatePayload = {
        metadata: JSON.stringify(metadata),
        status: progressData.status,
      };

      if (progressData.status === 'failed' && !job.completed_at) {
        updatePayload.completed_at = new Date();
      }

      await this.updateJob(jobId, updatePayload);
      logger.info(`Persisted job progress for ${jobId} to metadata: ${progressData.overallProgress}% (${progressData.status})`);

    } catch (error) {
      logger.error(`Failed to persist job progress for ${jobId}:`, error);
    }
  }

  async finalizeJob(jobId) {
    if (!jobId) {
      logger.warn('Cannot finalize job, jobId is missing.');
      return;
    }

    try {
      const job = await knex('jobs').where({ job_id: jobId }).first();
      if (!job) {
        logger.warn(`Cannot finalize job, job not found: ${jobId}`);
        return;
      }

      let metadata = this.safeJsonParse(job.metadata) || {};

      // Remove the progress object from metadata
      delete metadata.progress;

      // Add completion timestamp to metadata
      metadata.completedAt = new Date().toISOString();

      const updatePayload = {
        metadata: JSON.stringify(metadata),
        status: 'completed',
        completed_at: new Date()
      };

      await this.updateJob(jobId, updatePayload);
      logger.info(`Successfully finalized job ${jobId} and cleaned progress from metadata.`);

    } catch (error) {
      logger.error(`Failed to finalize job ${jobId}:`, error);
      throw error; // Re-throw to be handled by the caller
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

      // Process results and refresh URLs only for completed jobs
      const processedJobs = await Promise.all(jobs.map(async job => {
        const processedJob = {
          ...job,
          service_sequence: this.safeJsonParse(job.service_sequence) || [],
          metadata: this.safeJsonParse(job.metadata) || {}
        };

        // Only refresh URLs for completed jobs
        if (job.status === 'completed') {
          const metadata = processedJob.metadata;
          const lastUrlRefresh = metadata.lastUrlRefresh ? new Date(metadata.lastUrlRefresh) : null;
          const now = new Date();
          const shouldRefresh = !lastUrlRefresh || (now - lastUrlRefresh) > 3600000; // Refresh if more than 1 hour has passed

          if (shouldRefresh) {
            // Refresh URLs for each job
            const updatedJob = await this.storageUrlHelper.updateJobUrls(processedJob);
            
            // Only update if URLs actually changed
            if (JSON.stringify(updatedJob.metadata) !== JSON.stringify(processedJob.metadata)) {
              // Add lastUrlRefresh timestamp
              updatedJob.metadata.lastUrlRefresh = now.toISOString();
              
              /*logger.info('Refreshing URLs for completed job in list:', { 
                jobId: job.job_id,
                lastRefresh: lastUrlRefresh?.toISOString(),
                timeSinceLastRefresh: lastUrlRefresh ? `${Math.round((now - lastUrlRefresh) / 1000)}s` : 'never'
              });*/
              
              await this.updateJob(job.job_id, {
                metadata: JSON.stringify(updatedJob.metadata)
              });
              
              return updatedJob;
            }
          }
        }

        return processedJob;
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