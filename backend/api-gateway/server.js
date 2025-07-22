const express = require('express');
const cors = require('cors');
const axios = require('axios');
const logger = require('../shared/utils/logger');
const config = require('../shared/utils/config');
const path = require('path');
const authTestRoutes = require('../../tests/auth/auth-test');
const serviceAuth = require('./middleware/serviceAuth');

// Import route files
const authRoutes = require('./routes/auth');
const docsRoutes = require('./routes/docs');
const llmRoutes = require('./routes/llm');
const imageRoutes = require('./routes/image');
const voiceRoutes = require('./routes/voice');
const musicRoutes = require('./routes/music');
const animationRoutes = require('./routes/animation');
const videoRoutes = require('./routes/video');
const jobRoutes = require('./routes/job');
const assemblyRoutes = require('./routes/assembly');
const storageRoutes = require('./routes/storage');
const downloadRoutes = require('./routes/download');
const subscriptionRoutes = require('./routes/subscription');
const batchRoutes = require('./routes/batch');
const adminRoutes = require('./routes/admin');
const webhookRoutes = require('./routes/webhook');

// Log environment configuration
logger.info('Environment Configuration:', {
  NODE_ENV: process.env.NODE_ENV,
});

const app = express();
const PORT = process.env.API_GATEWAY_SERVICE_PORT;
//TODO: Load from config as variable

// Trust proxy configuration for proper IP detection behind reverse proxies
// This fixes X-Forwarded-For header validation errors in rate limiting
app.set('trust proxy', true);

// CORS configuration
const getFrontendUrl = () => {
  return config.services.frontend?.url;
};

const frontendUrl = getFrontendUrl();

logger.info('CORS Configuration:', {
  currentEnvironment: config.env,
  selectedFrontendUrl: frontendUrl,
  port: PORT
});

const corsOptions = {
  origin: (origin, callback) => {
    // Log the incoming origin for debugging
    //logger.info('Incoming request origin:', { origin });
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (origin === frontendUrl) {
      // logger.info('CORS: Origin allowed:', { origin });
      callback(null, true);
    } else {
      logger.warn('CORS: Origin rejected:', { 
        origin,
        expectedOrigin: frontendUrl,
        environment: process.env.NODE_ENV 
      });
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'x-user-token',
    'x-forwarded-user-token'
  ],
  credentials: true,
  maxAge: 86400 // 24 hours
};

app.use(cors(corsOptions));

app.use(express.urlencoded({ extended: true }));

// IMPORTANT: Mount the webhook router BEFORE the express.json() parser
// This ensures that for webhook routes, the body remains a raw buffer.
app.use('/api/webhooks', webhookRoutes);

// JSON parser for all other API routes
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`API Gateway: Received ${req.method} request for ${req.url}`);
  //logger.info(`Request headers: ${JSON.stringify(req.headers)}`);
  //logger.info(`Request body: ${JSON.stringify(req.body)}`);
  next();
});

// Health check endpoint for API Gateway
app.get('/health', (req, res) => {
  res.json({ status: 'API Gateway is healthy' });
});

// Docs routes
app.use('/api/docs', docsRoutes);

// Service routes with user authentication handled in the route files
app.use('/api/job', jobRoutes);
app.use('/api/llm', llmRoutes);
app.use('/api/image', imageRoutes);
app.use('/api/voice', voiceRoutes);
app.use('/api/music', musicRoutes);
app.use('/api/animation', animationRoutes);
app.use('/api/video', videoRoutes);
app.use('/api/assembly', assemblyRoutes);
app.use('/api/storage', storageRoutes);
app.use('/api/download', downloadRoutes);
app.use('/api/subscription', subscriptionRoutes);

// Admin and batch routes with admin permissions handled in the route files
app.use('/api/batch', batchRoutes);
app.use('/api/admin', adminRoutes);

// Auth routes
app.use('/api/auth', authRoutes);

// Add media serving endpoint
app.use('/media', serviceAuth, express.static(path.join(__dirname, '../../data/output')));

// Add test routes
app.use('/api/auth-test', authTestRoutes);

// Protected routes with permission checks
app.get('/api/templates', 
  async (req, res) => {
    // Template access code
    res.json({ templates: [] }); // Placeholder
});

app.post('/api/v1/*', 
  async (req, res) => {
    // API access code
    res.json({ message: 'API access granted' }); // Placeholder
});

// Auth route for Auth0 Action
const userLookupController = require('../services/auth-service/controllers/userLookupController');
app.post('/api/auth/user-lookup', serviceAuth, async (req, res) => {
    const logger = require('../shared/utils/logger');
    logger.info('User lookup request received from Auth0 Action.');
    await userLookupController.lookupUser(req, res);
});

// Catch-all route for unhandled requests
app.use('*', (req, res) => {
  logger.warn(`Received unhandled request: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ error: 'Not Found', message: 'The requested resource does not exist.' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('API Gateway Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

app.listen(PORT, () => {
  logger.info(`API Gateway listening on port ${PORT}`);
});

module.exports = app;

