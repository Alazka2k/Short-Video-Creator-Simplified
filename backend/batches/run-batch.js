#!/usr/bin/env node

/**
 * Batch Job Runner
 * 
 * This script runs a specified batch job with proper logging and error handling.
 * 
 * Usage:
 *   NODE_ENV=development node run-batch.js process-pending-cancellations
 */

// Ensure environment is set
if (!process.env.NODE_ENV) {
  console.error('NODE_ENV must be set (development, staging, production)');
  process.exit(1);
}

const fs = require('fs');
const path = require('path');
const logger = require('../shared/utils/logger');

/**
 * Main runner function
 */
async function runBatch(batchName) {
  logger.info('Batch runner started', {
    batch: batchName,
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });

  if (!batchName) {
    console.error('No batch job name provided');
    logger.error('No batch job name provided');
    console.error('Usage: NODE_ENV=development node run-batch.js <batch-name>');
    process.exit(1);
  }

  // Normalize batch name to match file convention
  const normalizedName = batchName.endsWith('.js') 
    ? batchName 
    : `${batchName}.js`;

  // Check if the batch exists
  const batchPath = path.join(__dirname, normalizedName);
  
  if (!fs.existsSync(batchPath)) {
    console.error(`Batch job not found: ${normalizedName}`);
    logger.error(`Batch job not found: ${normalizedName}`);
    process.exit(1);
  }

  try {
    // Import and run the batch
    const batchModule = require(batchPath);
    
    if (typeof batchModule !== 'function') {
      throw new Error(`Batch job ${normalizedName} does not export a function`);
    }

    logger.info(`Running batch job: ${normalizedName}`);
    console.log(`Running batch job: ${normalizedName}...`);
    
    const result = await batchModule();
    
    logger.info('Batch job completed successfully', { result });
    console.log('Batch job completed successfully:', result);
    
    return result;
  } catch (error) {
    logger.error('Batch job failed with error', {
      batch: normalizedName,
      error: error.message,
      stack: error.stack
    });
    console.error('Batch job failed:', error);
    process.exit(1);
  }
}

// If this script is run directly (not imported as a module)
if (require.main === module) {
  const batchName = process.argv[2];
  runBatch(batchName)
    .then(() => {
      process.exit(0);
    })
    .catch(() => {
      process.exit(1);
    });
} else {
  // Export for use as a module
  module.exports = runBatch;
} 