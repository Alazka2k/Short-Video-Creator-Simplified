/**
 * Webhook Controller
 * 
 * This controller handles webhooks from external services like Stripe:
 * - POST /webhooks/stripe - Process Stripe events
 */

const logger = require('../../../shared/utils/logger');

class WebhookController {
  constructor(paymentService) {
    this.paymentService = paymentService;
    logger.info('WebhookController initialized');
  }

  /**
   * Handle Stripe webhook
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async handleStripeWebhook(req, res) {
    try {
      const payload = req.body;
      const signature = req.headers['stripe-signature'];
      
      logger.info('Handling Stripe webhook:', {
        signatureLength: signature ? signature.length : 0
      });
      
      if (!signature) {
        logger.warn('Missing Stripe signature');
        return res.status(400).json({ error: 'Missing Stripe signature' });
      }
      
      const event = await this.paymentService.handleStripeWebhook(payload, signature);
      
      logger.info('Processed Stripe webhook event:', { type: event.type, id: event.id });
      
      res.json({ received: true, id: event.id });
    } catch (error) {
      logger.error('Error in handleStripeWebhook:', error.message, {
        type: error.type || 'unknown',
        raw: error.raw || {},
        header: error.header || '',
        payload: error.payload ? error.payload.substring(0, 200) + '...' : '',
        stack: error.stack
      });
      return res.status(400).json({ error: 'Webhook error', details: error.message });
    }
  }
}

module.exports = WebhookController; 