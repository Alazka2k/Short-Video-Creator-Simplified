/**
 * Batch Processing Service Server Setup
 * 
 * This file sets up the Express server with middleware and routes for batch job processing.
 */

const express = require('express');
const cors = require('cors');
const logger = require('../shared/utils/logger');
const config = require('../shared/utils/config');
const batchRoutes = require('./routes/batchRoutes');
const adminRoutes = require('./routes/adminRoutes');

// Initialize the batch service
const initializeBatchService = async () => {
  try {
    const { BatchLauncher } = require('./services/BatchLauncher');
    const { BatchRepository } = require('./services/BatchRepository');
    const { BatchDataAccess } = require('./data/batchDataAccess');
    
    // Initialize data access
    const batchDataAccess = new BatchDataAccess();
    await batchDataAccess.initialize();
    
    // Initialize repository
    const batchRepository = new BatchRepository(batchDataAccess);
    await batchRepository.initialize();
    
    // Initialize batch launcher
    const batchLauncher = new BatchLauncher(batchRepository);
    await batchLauncher.initialize();
    
    logger.info('Batch service initialized successfully');
    
    return { batchLauncher, batchRepository };
  } catch (error) {
    logger.error('Failed to initialize batch service:', error);
    throw error;
  }
};

// Create Express app
const app = express();
// Get batch service port from config
const PORT = config.services.batch.port;
if (!PORT) {
  logger.error('Batch service port not found in config');
  process.exit(1);
}

// Simple CORS configuration that works for both API Gateway and direct access
app.use(cors());

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`Batch Service: Received ${req.method} request for ${req.url}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'Batch Service is healthy' });
});

// Initialize service and set up routes
let batchLauncher, batchRepository;

initializeBatchService()
  .then(({ batchLauncher: bl, batchRepository: br }) => {
    batchLauncher = bl;
    batchRepository = br;
    
    // Set up routes with the initialized components
    app.use('/api/batch', batchRoutes(batchLauncher, batchRepository));
    app.use('/api/admin', adminRoutes(batchLauncher, batchRepository));
    
    // Start the server
    app.listen(PORT, () => {
      logger.info(`Batch Service listening on port ${PORT}`);
    });
  })
  .catch(error => {
    logger.error('Failed to start batch service:', error);
    process.exit(1);
  });

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down batch service');
  
  if (batchLauncher) {
    await batchLauncher.shutdown();
  }
  
  process.exit(0);
});

module.exports = app; 