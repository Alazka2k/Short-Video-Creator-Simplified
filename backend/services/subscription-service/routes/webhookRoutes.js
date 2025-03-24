/**
 * Webhook Routes
 * 
 * Defines routes for handling webhooks from external services:
 * - POST /webhooks/stripe - Process Stripe events
 */

const express = require('express');
const router = express.Router();

module.exports = (webhookController) => {
  /**
   * @route POST /api/subscription/webhooks/stripe
   * @description Handle Stripe webhook events
   * @access Public (secured by Stripe signature)
   */
  router.post('/stripe', webhookController.handleStripeWebhook.bind(webhookController));

  return router;
}; 