/**
 * Batch Repository
 * 
 * This file handles the persistence of batch metadata and execution history.
 */

const logger = require('../../shared/utils/logger');

class BatchRepository {
  constructor(batchDataAccess) {
    this.batchDataAccess = batchDataAccess;
  }

  async initialize() {
    try {
      await this.batchDataAccess.initialize();
      logger.info('Batch repository initialized');
    } catch (error) {
      logger.error('Error initializing batch repository:', error);
      throw error;
    }
  }

  async registerBatch(batch) {
    try {
      await this.batchDataAccess.upsertBatch({
        id: batch.id,
        name: batch.name,
        description: batch.description,
        parameters: batch.parameters,
        lastUpdated: new Date()
      });
    } catch (error) {
      logger.error(`Error registering batch ${batch.id}:`, error);
      throw error;
    }
  }

  async getLastRun(batchId) {
    try {
      return await this.batchDataAccess.getLastExecution(batchId);
    } catch (error) {
      logger.error(`Error getting last run for batch ${batchId}:`, error);
      throw error;
    }
  }

  async recordExecution(batchId, execution) {
    try {
      await this.batchDataAccess.recordExecution(batchId, execution);
    } catch (error) {
      logger.error(`Error recording execution for batch ${batchId}:`, error);
      throw error;
    }
  }

  async getBatchHistory(batchId) {
    try {
      return await this.batchDataAccess.getBatchHistory(batchId);
    } catch (error) {
      logger.error(`Error getting history for batch ${batchId}:`, error);
      throw error;
    }
  }

  async getBatchLogs(batchId) {
    try {
      return await this.batchDataAccess.getBatchLogs(batchId);
    } catch (error) {
      logger.error(`Error getting logs for batch ${batchId}:`, error);
      throw error;
    }
  }
}

module.exports = { BatchRepository }; 