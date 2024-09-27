const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const logger = require('../shared/utils/logger');
const config = require('../shared/utils/config');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  logger.info(`API Gateway: Received ${req.method} request for ${req.url}`);
  next();
});

const routes = {
  '/api/llm': config.services.llm.url,
  // ... other routes ...
};

Object.entries(routes).forEach(([route, target]) => {
  logger.info(`Setting up proxy for ${route} to ${target}`);
  app.use(route, createProxyMiddleware({
    target,
    changeOrigin: true,
    pathRewrite: {
      [`^${route}`]: '',
    },
    onProxyReq: (proxyReq, req, res) => {
      logger.info(`Proxying ${req.method} request to ${target}${proxyReq.path}`);
      logger.info(`Request body: ${JSON.stringify(req.body)}`);
    },
    onProxyRes: (proxyRes, req, res) => {
      logger.info(`Received response from ${target} with status ${proxyRes.statusCode}`);
    },
    onError: (err, req, res) => {
      logger.error(`Proxy error: ${err.message}`);
      logger.error(`Error stack: ${err.stack}`);
      res.status(500).json({ error: 'Proxy error', details: err.message });
    }
  }));
});

app.use((req, res) => {
  logger.warn(`Received request for undefined route: ${req.method} ${req.url}`);
  res.status(404).json({ error: 'Not Found' });
});

app.use((err, req, res, next) => {
  logger.error(`Unhandled error: ${err.stack}`);
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

app.listen(PORT, () => {
  logger.info(`API Gateway running on port ${PORT}`);
  logger.info('Configured routes:');
  Object.entries(routes).forEach(([route, target]) => {
    logger.info(`  ${route} -> ${target}`);
  });
});

module.exports = app;