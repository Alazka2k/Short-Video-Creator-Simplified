/**
 * Batch Data Access
 * 
 * This file handles the database operations for batch metadata and execution history.
 */

const knex = require('knex')(require('../../../knexfile')[process.env.NODE_ENV]);
const logger = require('../../shared/utils/logger');
const config = require('../../shared/utils/config');

class BatchDataAccess {
  constructor() {
    this.batchJobsTable = 'batch_jobs';
    this.batchJobExecutionsTable = 'batch_job_executions';
    this.batchJobLogsTable = 'batch_job_logs';
    this.logger = logger;
  }

  async initialize() {
    try {
      // Tables are now created via migrations
      this.logger.info('Batch data access initialized');
    } catch (error) {
      this.logger.error('Error initializing batch data access:', error);
      throw error;
    }
  }

  async upsertBatch(batch) {
    try {
      this.logger.info('Upserting batch:', { batchId: batch.id });
      
      const batchData = {
        id: batch.id,
        name: batch.name,
        description: batch.description,
        parameters: JSON.stringify(batch.parameters),
        last_updated: batch.lastUpdated
      };
      
      const result = await knex(this.batchJobsTable)
        .insert(batchData)
        .onConflict('id')
        .merge();
      
      return result;
    } catch (error) {
      this.logger.error(`Error upserting batch ${batch.id}:`, error);
      throw error;
    }
  }

  async getLastExecution(batchId) {
    try {
      this.logger.info('Getting last execution for batch:', { batchId });
      
      const execution = await knex(this.batchJobExecutionsTable)
        .where('batch_id', batchId)
        .orderBy('start_time', 'desc')
        .first();
      
      return execution || null;
    } catch (error) {
      this.logger.error(`Error getting last execution for batch ${batchId}:`, error);
      throw error;
    }
  }

  async recordExecution(batchId, execution) {
    try {
      this.logger.info('Recording execution for batch:', { batchId });
      
      const executionData = {
        batch_id: batchId,
        start_time: execution.startTime,
        end_time: execution.endTime,
        status: execution.status,
        result: execution.result ? JSON.stringify(execution.result) : null,
        error: execution.error
      };
      
      const result = await knex(this.batchJobExecutionsTable)
        .insert(executionData)
        .returning('id');
      
      return result[0].id;
    } catch (error) {
      this.logger.error(`Error recording execution for batch ${batchId}:`, error);
      throw error;
    }
  }

  async getBatchHistory(batchId) {
    try {
      this.logger.info('Getting history for batch:', { batchId });
      
      const history = await knex(this.batchJobExecutionsTable)
        .where('batch_id', batchId)
        .orderBy('start_time', 'desc')
        .limit(100);
      
      return history;
    } catch (error) {
      this.logger.error(`Error getting history for batch ${batchId}:`, error);
      throw error;
    }
  }

  async getBatchLogs(batchId) {
    try {
      this.logger.info('Getting logs for batch:', { batchId });
      
      const logs = await knex(this.batchJobLogsTable)
        .select(`${this.batchJobLogsTable}.*`, `${this.batchJobExecutionsTable}.start_time as execution_start_time`)
        .leftJoin(this.batchJobExecutionsTable, `${this.batchJobLogsTable}.execution_id`, `${this.batchJobExecutionsTable}.id`)
        .where(`${this.batchJobLogsTable}.batch_id`, batchId)
        .orderBy(`${this.batchJobLogsTable}.created_at`, 'desc')
        .limit(1000);
      
      return logs;
    } catch (error) {
      this.logger.error(`Error getting logs for batch ${batchId}:`, error);
      throw error;
    }
  }

  async log(batchId, executionId, level, message) {
    try {
      this.logger.info('Logging message for batch:', { batchId, level });
      
      const logData = {
        batch_id: batchId,
        execution_id: executionId,
        level: level,
        message: message,
        created_at: knex.fn.now()
      };
      
      await knex(this.batchJobLogsTable)
        .insert(logData);
    } catch (error) {
      this.logger.error(`Error logging message for batch ${batchId}:`, error);
      throw error;
    }
  }
}

module.exports = { BatchDataAccess }; 