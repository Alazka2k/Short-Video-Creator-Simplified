const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const logger = require('../shared/utils/logger');
const config = require('../shared/utils/config');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware for parsing JSON and url-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

// Define routes and their corresponding microservices
const routes = {
  '/api/llm': config.services.llm.url,
  '/api/image': config.services.image.url,
  '/api/voice': config.services.voice.url,
  '/api/animation': config.services.animation.url,
  '/api/music': config.services.music.url,
  '/api/video': config.services.video.url,
  '/api/auth': config.services.auth.url,
  '/api/job': config.services.job.url,
  '/api/billing': config.services.billing.url
};

// Set up proxy middleware for each route
Object.entries(routes).forEach(([route, target]) => {
  app.use(route, createProxyMiddleware({ 
    target, 
    changeOrigin: true,
    pathRewrite: {
      [`^${route}`]: '',
    },
  }));
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).send('Something went wrong!');
});

// Start the server
app.listen(PORT, () => {
  logger.info(`API Gateway running on port ${PORT}`);
});

module.exports = app;