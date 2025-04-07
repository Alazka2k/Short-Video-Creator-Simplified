/**
 * Batch Controller
 * 
 * This file handles the business logic for batch job management.
 */

const logger = require('../../shared/utils/logger');

class BatchController {
  constructor(batchLauncher) {
    this.batchLauncher = batchLauncher;
  }

  async getAvailableBatches() {
    try {
      return await this.batchLauncher.getAvailableBatches();
    } catch (error) {
      logger.error('Error getting available batches:', error);
      throw error;
    }
  }

  async getBatchStatus(batchId) {
    try {
      return await this.batchLauncher.getBatchStatus(batchId);
    } catch (error) {
      logger.error(`Error getting status for batch ${batchId}:`, error);
      throw error;
    }
  }

  async runBatch(batchId, params) {
    try {
      return await this.batchLauncher.runBatch(batchId, params);
    } catch (error) {
      logger.error(`Error running batch ${batchId}:`, error);
      throw error;
    }
  }

  async getBatchHistory(batchId) {
    try {
      return await this.batchLauncher.getBatchHistory(batchId);
    } catch (error) {
      logger.error(`Error getting history for batch ${batchId}:`, error);
      throw error;
    }
  }

  async getBatchLogs(batchId) {
    try {
      return await this.batchLauncher.getBatchLogs(batchId);
    } catch (error) {
      logger.error(`Error getting logs for batch ${batchId}:`, error);
      throw error;
    }
  }
}

module.exports = BatchController; 