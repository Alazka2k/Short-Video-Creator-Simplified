const express = require('express');
const cors = require('cors');
const axios = require('axios');
const logger = require('../shared/utils/logger');
const config = require('../shared/utils/config');
const path = require('path');
const authTestRoutes = require('../../tests/auth/auth-test');
const serviceAuthMiddleware = require('./middleware/serviceAuth');
const { verifyAuth0Token, checkPermission } = require('../services/auth-service/middleware/auth0-verify.middleware');

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

// Log environment configuration
logger.info('Environment Configuration:', {
  NODE_ENV: process.env.NODE_ENV,
  isDefined: process.env.NODE_ENV !== undefined,
  type: typeof process.env.NODE_ENV
});

const app = express();
const PORT = process.env.PORT || 3000;

// CORS configuration
const getFrontendUrl = () => {
  const env = process.env.NODE_ENV || 'development';
  
  // Log available frontend URLs for debugging
  logger.info('Available Frontend URLs:', {
    development: process.env.DEVELOPMENT_FRONTEND_URL || `http://localhost:${process.env.DEVELOPMENT_FRONTEND_PORT || 4000}`,
    staging: process.env.STAGING_FRONTEND_URL,
    production: process.env.PRODUCTION_FRONTEND_URL
  });

  switch (env) {
    case 'development':
      return process.env.DEVELOPMENT_FRONTEND_URL || `http://localhost:${process.env.DEVELOPMENT_FRONTEND_PORT || 4000}`;
    case 'staging':
      return process.env.STAGING_FRONTEND_URL;
    case 'production':
      return process.env.PRODUCTION_FRONTEND_URL;
    default:
      return `http://localhost:4000`; // Fallback for safety
  }
};

const frontendUrl = getFrontendUrl();

logger.info('CORS Configuration:', {
  currentEnvironment: process.env.NODE_ENV,
  selectedFrontendUrl: frontendUrl,
  port: PORT
});

const corsOptions = {
  origin: (origin, callback) => {
    // Log the incoming origin for debugging
    logger.info('Incoming request origin:', { origin });
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (origin === frontendUrl) {
      logger.info('CORS: Origin allowed:', { origin });
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
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

app.use(cors(corsOptions));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`API Gateway: Received ${req.method} request for ${req.url}`);
  logger.info(`Request headers: ${JSON.stringify(req.headers)}`);
  logger.info(`Request body: ${JSON.stringify(req.body)}`);
  next();
});

// Health check endpoint for API Gateway
app.get('/health', (req, res) => {
  res.json({ status: 'API Gateway is healthy' });
});

// Mount route files
app.use('/api/auth', authRoutes);
app.use('/api/docs', docsRoutes);
app.use('/api/llm', llmRoutes);
app.use('/api/image', imageRoutes);
app.use('/api/voice', voiceRoutes);
app.use('/api/music', musicRoutes);
app.use('/api/animation', animationRoutes);
app.use('/api/video', videoRoutes);
app.use('/api/job', jobRoutes);
app.use('/api/assembly', assemblyRoutes);

// Add media serving endpoint
app.use('/media', serviceAuthMiddleware, express.static(path.join(__dirname, '../../data/output')));

// Add test routes
app.use('/api/auth-test', authTestRoutes);

// Protected routes with permission checks
app.get('/api/templates', 
  verifyAuth0Token, 
  checkPermission('/api/templates'), 
  async (req, res) => {
    // Template access code
    res.json({ templates: [] }); // Placeholder
});

app.post('/api/v1/*', 
  verifyAuth0Token, 
  checkPermission('/api/v1'), 
  async (req, res) => {
    // API access code
    res.json({ message: 'API access granted' }); // Placeholder
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

