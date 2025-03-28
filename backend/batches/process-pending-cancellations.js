#!/usr/bin/env node

/**
 * Batch Job: Process Pending Subscription Cancellations
 * 
 * This script processes all subscription cancellations that are in pending status
 * and have reached their end date. It finalizes the cancellation and creates new
 * subscriptions based on the upcoming_plan_id if applicable.
 */

// Ensure environment is set
if (!process.env.NODE_ENV) {
  console.error('NODE_ENV must be set (development, staging, production)');
  process.exit(1);
}

// Import dependencies
const knex = require('knex')(require('../../knexfile')[process.env.NODE_ENV]);
const logger = require('../shared/utils/logger');
const subscriptionService = require('../services/subscription-service/services/subscriptionService');
const dataAccessFactory = require('../services/subscription-service');

/**
 * Main function to process pending cancellations
 */
async function processPendingCancellations() {
  logger.info('Starting batch job: process-pending-cancellations', {
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });

  try {
    // Initialize data access and services
    const dataAccess = await dataAccessFactory.createDataAccess();
    const service = new subscriptionService(dataAccess);

    // Process the pending cancellations
    const results = await service.processPendingCancellations();

    logger.info('Batch job completed successfully', {
      processed: results.processed,
      newSubscriptions: results.newSubscriptions,
      errors: results.errors
    });

    return results;
  } catch (error) {
    logger.error('Batch job failed with error', {
      error: error.message,
      stack: error.stack
    });
    throw error;
  } finally {
    // Always clean up database connections
    try {
      await knex.destroy();
      logger.info('Database connection closed');
    } catch (err) {
      logger.error('Error closing database connection', { error: err.message });
    }
  }
}

// If this script is run directly (not imported as a module)
if (require.main === module) {
  processPendingCancellations()
    .then(results => {
      console.log('Batch job completed successfully:', results);
      process.exit(0);
    })
    .catch(error => {
      console.error('Batch job failed:', error);
      process.exit(1);
    });
} else {
  // Export for use as a module
  module.exports = processPendingCancellations;
} 