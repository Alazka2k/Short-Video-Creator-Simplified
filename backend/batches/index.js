/**
 * Batch Processing Service Entry Point
 * 
 * This file initializes the service and all its components.
 */

const logger = require('../shared/utils/logger');
const server = require('./server');
const config = require('../shared/utils/config');

// Import core components
const { JobLauncher } = require('./core/batchLauncher');
const { JobRepository } = require('./core/batchRepository');

// Import controllers
const JobController = require('./controllers/batchController');

// Import data access
const { JobDataAccess } = require('./data/batchDataAccess');

// Data access layer
const dataAccess = {
  jobs: new JobDataAccess()
};

// Core components
const jobRepository = new JobRepository(dataAccess.jobs);
const jobLauncher = new JobLauncher(jobRepository);

async function startServer() {
  try {
    logger.info('Starting Batch Processing Service...');
    
    // Initialize core components
    await jobRepository.initialize();
    await jobLauncher.initialize();
    
    // Initialize controller
    const jobController = new JobController(jobLauncher);
    
    // Create and start the server
    const app = server.createServer({
      jobController
    });
    
    // Get port from config, or use 3020 as a fallback
    let PORT;
    try {
      // First check for environment variable
      PORT = process.env.BATCH_SERVICE_PORT;
      
      // If not found, try to extract from config url
      if (!PORT) {
        const serviceUrl = config.services?.batch?.url || '';
        const portMatch = serviceUrl.match(/:(\d+)$/);
        PORT = portMatch ? parseInt(portMatch[1]) : 3020;
      }
    } catch (error) {
      PORT = 3020;
      logger.warn(`Could not parse port from config, using default port ${PORT}`);
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