/**
 * Webhook Routes for API Gateway
 * 
 * This route is specifically designed to handle incoming webhooks (e.g., from Stripe)
 * and forward them with their raw, unparsed body to the appropriate internal service.
 * This is critical for services that need the raw body to verify request signatures.
 */
const express = require('express');
const router = express.Router();
const http = require('http'); // Use the native http module
const logger = require('../../shared/utils/logger');
const config = require('../../shared/utils/config');

const SUBSCRIPTION_SERVICE_URL = config.services?.subscription?.url;

/**
 * @route POST /api/webhook/stripe
 * @description Receives Stripe webhooks and forwards them by piping the raw request
 * stream directly to the subscription service. This is the most robust way to
 * ensure the request body is not altered, which is required for signature verification.
 * @access Public
 */
router.post('/stripe', (req, res) => {
  const url = new URL(SUBSCRIPTION_SERVICE_URL);
  const endpoint = '/webhooks/stripe';

  logger.info(`Piping Stripe webhook to: ${url.hostname}:${url.port}${endpoint}`);

  const options = {
    hostname: url.hostname,
    port: url.port,
    path: endpoint,
    method: req.method,
    headers: {
      ...req.headers,
      // Overwrite the host header to match the destination service
      host: url.host,
    },
  };

  const proxyReq = http.request(options, (proxyRes) => {
    // Forward the response from the subscription service back to the original client
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });

  proxyReq.on('error', (err) => {
    logger.error('Error piping request to subscription service:', err);
    res.status(502).json({ error: 'Bad Gateway', message: err.message });
  });

  // Pipe the incoming request body directly to the outgoing request
  req.pipe(proxyReq, { end: true });
});

module.exports = router;