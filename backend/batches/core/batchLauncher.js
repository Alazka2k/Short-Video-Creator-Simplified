/**
 * Batch Launcher
 * 
 * This file handles the core functionality of launching and managing batch jobs.
 */

const logger = require('../../shared/utils/logger');
const path = require('path');
const fs = require('fs').promises;

class BatchLauncher {
  constructor(batchRepository) {
    this.batchRepository = batchRepository;
    this.batches = new Map();
    this.runningBatches = new Map();
  }

  async initialize() {
    try {
      // Load all batch implementations
      const batchesDir = path.join(__dirname, '../batches');
      const batchFiles = await fs.readdir(batchesDir);
      
      for (const file of batchFiles) {
        if (file.endsWith('Batch.js') && file !== 'BaseBatch.js') {
          const batchModule = require(path.join(batchesDir, file));
          const batch = new batchModule();
          this.batches.set(batch.id, batch);
          await this.batchRepository.registerBatch(batch);
        }
      }
      
      logger.info(`Initialized ${this.batches.size} batch jobs`);
    } catch (error) {
      logger.error('Error initializing batch launcher:', error);
      throw error;
    }
  }

  async getAvailableBatches() {
    return Array.from(this.batches.values()).map(batch => ({
      id: batch.id,
      name: batch.name,
      description: batch.description,
      parameters: batch.parameters
    }));
  }

  async getBatchStatus(batchId) {
    const batch = this.batches.get(batchId);
    if (!batch) {
      throw new Error(`Batch ${batchId} not found`);
    }

    const execution = this.runningBatches.get(batchId);
    if (execution) {
      return {
        status: 'running',
        startTime: execution.startTime,
        progress: execution.progress
      };
    }

    return {
      status: 'idle',
      lastRun: await this.batchRepository.getLastRun(batchId)
    };
  }

  async runBatch(batchId, params) {
    const batch = this.batches.get(batchId);
    if (!batch) {
      throw new Error(`Batch ${batchId} not found`);
    }

    if (this.runningBatches.has(batchId)) {
      throw new Error(`Batch ${batchId} is already running`);
    }

    const execution = {
      startTime: new Date(),
      progress: 0
    };
    this.runningBatches.set(batchId, execution);

    try {
      const result = await batch.execute(params, (progress) => {
        execution.progress = progress;
      });

      await this.batchRepository.recordExecution(batchId, {
        startTime: execution.startTime,
        endTime: new Date(),
        status: 'completed',
        result
      });

      return result;
    } catch (error) {
      await this.batchRepository.recordExecution(batchId, {
        startTime: execution.startTime,
        endTime: new Date(),
        status: 'failed',
        error: error.message
      });

      throw error;
    } finally {
      this.runningBatches.delete(batchId);
    }
  }

  async getBatchHistory(batchId) {
    return await this.batchRepository.getBatchHistory(batchId);
  }

  async getBatchLogs(batchId) {
    return await this.batchRepository.getBatchLogs(batchId);
  }

  async shutdown() {
    // Wait for running batches to complete
    const runningBatches = Array.from(this.runningBatches.entries());
    if (runningBatches.length > 0) {
      logger.info(`Waiting for ${runningBatches.length} batches to complete...`);
      await Promise.all(runningBatches.map(([batchId]) => this.getBatchStatus(batchId)));
    }
  }
}

module.exports = { BatchLauncher }; 