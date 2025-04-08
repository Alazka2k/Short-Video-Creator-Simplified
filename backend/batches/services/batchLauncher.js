/**
 * Batch Launcher
 * 
 * This file handles the core functionality of launching and managing batch jobs.
 */

const logger = require('../../shared/utils/logger');
const path = require('path');
const fs = require('fs').promises;
const m2mAuthService = require('../utils/m2mAuthService');

class BatchLauncher {
  constructor(batchRepository) {
    this.batchRepository = batchRepository;
    this.batches = new Map();
    this.runningBatches = new Map();
  }

  async initialize() {
    try {
      // Load all batch implementations
      const batchesDir = path.join(__dirname, '../batch-jobs');
      const batchFiles = await fs.readdir(batchesDir);
      
      logger.info(`Found ${batchFiles.length} files in batch-jobs directory`);
      
      for (const file of batchFiles) {
        if (file.endsWith('Batch.js') && file !== 'BaseBatch.js') {
          logger.info(`Loading batch job from file: ${file}`);
          const batchModule = require(path.join(batchesDir, file));
          const batch = new batchModule();
          
          // Get the batch ID from the filename (remove 'Batch.js' and convert to kebab-case)
          const batchId = file.replace('Batch.js', '').replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '');
          
          // Set the ID on the batch instance
          batch.id = batchId;
          
          logger.info(`Registered batch job with ID: ${batchId}`);
          this.batches.set(batchId, batch);
          await this.batchRepository.registerBatch(batch);
        }
      }
      
      logger.info(`Initialized ${this.batches.size} batch jobs`);
      logger.info(`Available batch jobs: ${Array.from(this.batches.keys()).join(', ')}`);
    } catch (error) {
      logger.error('Error initializing batch launcher:', error);
      throw error;
    }
  }

  async getAvailableBatches() {
    return Array.from(this.batches.values()).map(batch => ({
      id: batch.id,
      name: batch.name,
      description: batch.description
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

  async runBatch(batchId, options = {}) {
    try {
      const batch = this.batches.get(batchId);
      if (!batch) {
        throw new Error(`Batch ${batchId} not found`);
      }

      // Get M2M token for the batch job
      const authorization = await m2mAuthService.getToken();
      
      // Add authorization to options
      const batchOptions = {
        ...options,
        authorization
      };

      //logger.info(`Starting batch ${batchId}`, { options: batchOptions });
      
      const jobId = Date.now().toString();
      const job = {
        id: jobId,
        batchId,
        status: 'running',
        startTime: new Date(),
        options: batchOptions
      };

      this.runningBatches.set(jobId, job);
      
      // Execute the batch with authorization
      const result = await batch.execute(batchOptions);
      
      job.status = 'completed';
      job.endTime = new Date();
      job.result = result;
      
      logger.info(`Batch ${batchId} completed`, { jobId, result });
      
      return job;
    } catch (error) {
      logger.error(`Error running batch ${batchId}:`, error);
      throw error;
    }
  }

  async getBatchHistory(batchId) {
    return await this.batchRepository.getBatchHistory(batchId);
  }

  async getBatchLogs(batchId) {
    return await this.batchRepository.getBatchLogs(batchId);
  }

  async cancelBatch(batchId) {
    const execution = this.runningBatches.get(batchId);
    if (!execution) {
      throw new Error(`Batch ${batchId} is not running`);
    }

    // Set a flag to indicate cancellation
    execution.cancelled = true;
    
    // Record the cancellation in the repository
    await this.batchRepository.recordExecution(batchId, {
      startTime: execution.startTime,
      endTime: new Date(),
      status: 'cancelled'
    });

    // Remove from running batches
    this.runningBatches.delete(batchId);
    
    logger.info(`Batch ${batchId} cancelled successfully`);
    return { jobId: batchId, status: 'cancelled' };
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