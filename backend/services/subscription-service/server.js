/**
 * Subscription Service Server
 * 
 * This file sets up the Express server with routes and middleware.
 */

const express = require('express');
const cors = require('cors');
const logger = require('../../shared/utils/logger');
const errorHandler = require('./middleware/errorHandler');

// Import route creators
const planRoutes = require('./routes/planRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const tokenRoutes = require('./routes/tokenRoutes');
const tokenPackageRoutes = require('./routes/tokenPackageRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const webhookRoutes = require('./routes/webhookRoutes');

/**
 * Create and configure an Express server with all routes
 * @param {Object} controllers - Object containing all controller instances
 * @returns {Object} - Configured Express app
 */
function createServer(controllers) {
  const app = express();

  // Basic middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  
  // CORS configuration
  app.use(cors());
  
  // Request logging middleware
  app.use((req, res, next) => {
    logger.info(`${req.method} ${req.url}`);
    next();
  });

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ status: 'Subscription service is healthy' });
  });

  // Mount API routes
  app.use('/plans', planRoutes(controllers.planController));
  app.use('/subscriptions', subscriptionRoutes(controllers.subscriptionController));
  app.use('/tokens', tokenRoutes(controllers.tokenController));
  app.use('/token-packages', tokenPackageRoutes(controllers.tokenPackageController));
  app.use('/payments', paymentRoutes(controllers.paymentController));
  app.use('/webhooks', webhookRoutes(controllers.webhookController));
  
  // Error handler middleware - must be defined last
  app.use(errorHandler);
  
  return app;
}

module.exports = { createServer }; 