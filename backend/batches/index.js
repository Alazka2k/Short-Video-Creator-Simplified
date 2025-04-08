/**
 * Batch Processing Service Entry Point
 * 
 * This file initializes the service and all its components.
 */

const logger = require('../shared/utils/logger');
const server = require('./server');
const config = require('../shared/utils/config');

// Import core components
const { BatchLauncher } = require('./services/batchLauncher');
const { BatchRepository } = require('./services/batchRepository');

// Import controllers
const BatchController = require('./controllers/batchController');

// Import data access
const { BatchDataAccess } = require('./data/batchDataAccess');

// Data access layer
const dataAccess = {
  jobs: new BatchDataAccess()
};

// Core components
const jobRepository = new BatchRepository(dataAccess.jobs);
const jobLauncher = new BatchLauncher(jobRepository);

async function startServer() {
  try {
    logger.info('Starting Batch Processing Service...');
    
    // Initialize core components
    await jobRepository.initialize();
    await jobLauncher.initialize();
    
    // Initialize controller
    const jobController = new BatchController(jobLauncher);
    
    // Create and start the server
    const app = server.createServer({
      jobController
    });
    
    // Get batch service port from config
    let PORT;
    try {
      // First check for environment variable
      PORT = config.services.batch.port;
      if (!PORT) {
        logger.error('Batch service port not found in config');
        process.exit(1);
      }
    } catch (error) {
      logger.error('Failed to get batch service port from config:', error);
      process.exit(1);
    }

    app.listen(PORT, () => {
      logger.info(`Batch Processing Service running on port ${PORT}`);
    });
    
    // Handle graceful shutdown
    const shutdown = async () => {
      logger.info('Shutting down Batch Processing Service...');
      await jobLauncher.shutdown();
      process.exit(0);
    };
    
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
    
  } catch (error) {
    logger.error('Failed to start Batch Processing Service:', error);
    process.exit(1);
  }
}

// Start the server if this file is run directly
if (require.main === module) {
  startServer();
}

module.exports = { startServer }; 