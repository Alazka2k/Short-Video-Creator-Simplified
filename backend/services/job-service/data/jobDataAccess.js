const { Pool } = require('pg');
const config = require('../../../shared/utils/config');
const logger = require('../../../shared/utils/logger');

class JobDataAccess {
  constructor() {
    this.pool = new Pool(config.database);
  }

  async createJob({ jobId, prompt, status, parameters, visualizationType, startTime }) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const query = `
        INSERT INTO jobs (
          job_id, prompt, status, service_sequence, metadata, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;

      const serviceSequence = ['llm', 'voice', 'image', visualizationType];
      if (visualizationType === 'animation') {
        serviceSequence.push('animation');
      } else {
        serviceSequence.push('video');
      }

      const metadata = {
        parameters,
        visualizationType,
        startTime,
        serviceSequence
      };

      const result = await client.query(query, [
        jobId,
        prompt,
        status,
        JSON.stringify(serviceSequence),
        JSON.stringify(metadata),
        new Date()
      ]);

      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error creating job:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async updateJob(jobId, updates) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const query = `
        UPDATE jobs 
        SET status = $1, 
            metadata = jsonb_set(
              metadata::jsonb, 
              '{endTime}',
              to_jsonb($2::text),
              true
            )
        WHERE job_id = $3
        RETURNING *
      `;

      const result = await client.query(query, [
        updates.status,
        updates.endTime,
        jobId
      ]);

      if (updates.error) {
        await client.query(`
          UPDATE jobs 
          SET metadata = jsonb_set(
            metadata::jsonb,
            '{error}',
            to_jsonb($1::text),
            true
          )
          WHERE job_id = $2
        `, [updates.error, jobId]);
      }

      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error updating job:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async getJob(jobId) {
    try {
      const query = `
        SELECT * FROM jobs WHERE job_id = $1
      `;
      const result = await this.pool.query(query, [jobId]);
      return result.rows[0];
    } catch (error) {
      logger.error('Error getting job:', error);
      throw error;
    }
  }

  async getAllJobs(filters = {}) {
    try {
      let query = 'SELECT * FROM jobs';
      const values = [];
      const conditions = [];
  
      if (filters.status) {
        conditions.push(`status = $${values.length + 1}`);
        values.push(filters.status);
      }
  
      if (filters.startDate) {
        conditions.push(`created_at >= $${values.length + 1}`);
        values.push(filters.startDate);
      }
  
      if (filters.endDate) {
        conditions.push(`created_at <= $${values.length + 1}`);
        values.push(filters.endDate);
      }
  
      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }
  
      query += ' ORDER BY created_at DESC';
  
      if (filters.limit) {
        query += ` LIMIT ${parseInt(filters.limit)}`;
      }
  
      if (filters.offset) {
        query += ` OFFSET ${parseInt(filters.offset)}`;
      }
  
      // Changed 'result' to 'queryResult' to avoid duplicate declaration
      const queryResult = await this.pool.query(query, values);
      return queryResult.rows;
    } catch (error) {
      logger.error('Error getting all jobs:', error);
      throw error;
    }
  }

async deleteJob(jobId) {
const client = await this.pool.connect();
try {
await client.query('BEGIN');

// Delete related records from other service tables
await client.query('DELETE FROM llm_inputs WHERE job_id = $1', [jobId]);
await client.query('DELETE FROM image_outputs WHERE job_id = $1', [jobId]);
await client.query('DELETE FROM voice_outputs WHERE job_id = $1', [jobId]);
await client.query('DELETE FROM animation_outputs WHERE job_id = $1', [jobId]);
await client.query('DELETE FROM video_outputs WHERE job_id = $1', [jobId]);
await client.query('DELETE FROM music_outputs WHERE job_id = $1', [jobId]);

// Finally, delete the job record
const query = 'DELETE FROM jobs WHERE job_id = $1 RETURNING *';
const result = await client.query(query, [jobId]);

await client.query('COMMIT');
return result.rows[0];
} catch (error) {
await client.query('ROLLBACK');
logger.error('Error deleting job:', error);
throw error;
} finally {
client.release();
}
}

async getJobsStats() {
try {
const query = `
  SELECT 
    status,
    COUNT(*) as count,
    MIN(created_at) as oldest_job,
    MAX(created_at) as newest_job,
    AVG(
      CASE 
        WHEN metadata->>'endTime' IS NOT NULL 
        THEN EXTRACT(EPOCH FROM (
          (metadata->>'endTime')::timestamp - created_at
        ))
        ELSE NULL 
      END
    ) as avg_duration_seconds
  FROM jobs 
  GROUP BY status
`;
const result = await this.pool.query(query);
return result.rows;
} catch (error) {
logger.error('Error getting jobs stats:', error);
throw error;
}
}

async cleanupOldJobs(daysToKeep = 30) {
const client = await this.pool.connect();
try {
await client.query('BEGIN');

const cutoffDate = new Date();
cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

// Get jobs to be deleted
const jobsToDelete = await client.query(
  'SELECT job_id FROM jobs WHERE created_at < $1',
  [cutoffDate]
);

for (const job of jobsToDelete.rows) {
  await this.deleteJob(job.job_id);
}

await client.query('COMMIT');
return jobsToDelete.rows.length;
} catch (error) {
await client.query('ROLLBACK');
logger.error('Error cleaning up old jobs:', error);
throw error;
} finally {
client.release();
}
}

async updateJobProgress(jobId, serviceType, status, progressData = {}) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
  
      // Get current metadata
      const currentJob = await client.query(
        'SELECT metadata, service_sequence FROM jobs WHERE job_id = $1',
        [jobId]
      );
  
      if (!currentJob.rows.length) {
        throw new Error('Job not found');
      }
  
      let metadata = currentJob.rows[0].metadata;
      if (typeof metadata === 'string') {
        metadata = JSON.parse(metadata);
      }
  
      // Update progress information
      if (!metadata.progress) {
        metadata.progress = {};
      }
      metadata.progress[serviceType] = {
        status,
        ...progressData,
        updatedAt: new Date().toISOString()
      };
  
      // Update job status if all services are complete
      const allServices = Array.isArray(currentJob.rows[0].service_sequence) 
        ? currentJob.rows[0].service_sequence 
        : JSON.parse(currentJob.rows[0].service_sequence);
        
      const allComplete = allServices.every(
        service => metadata.progress[service]?.status === 'completed'
      );
  
      const query = `
        UPDATE jobs 
        SET 
          metadata = $1,
          status = $2
        WHERE job_id = $3
        RETURNING *
      `;
  
      const result = await client.query(query, [
        JSON.stringify(metadata),
        allComplete ? 'completed' : 'in_progress',
        jobId
      ]);
  
      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error updating job progress:', error);
      throw error;
    } finally {
      client.release();
    }
  }
}

const jobDataAccess = new JobDataAccess();
module.exports = jobDataAccess;  // Export the instance, not the class