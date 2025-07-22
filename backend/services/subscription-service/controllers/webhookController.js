/**
 * Webhook Controller
 * 
 * This controller handles webhooks from external services like Stripe:
 * - POST /webhooks/stripe - Process Stripe events
 */

const logger = require('../../../shared/utils/logger');
const webhookEventsDataAccess = require('../data/webhookEventsDataAccess');

class WebhookController {
  constructor(paymentService, stripeService) {
    this.paymentService = paymentService;
    this.stripeService = stripeService; // Injected dependency
    logger.info('WebhookController initialized');
  }

  /**
   * Handle Stripe webhook with idempotency check
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async handleStripeWebhook(req, res) {
    let event;
    try {
      const payload = req.body;
      const signature = req.headers['stripe-signature'];
      
      if (!signature) {
        logger.warn('Missing Stripe signature');
        return res.status(400).json({ error: 'Missing Stripe signature' });
      }
      
      event = this.stripeService.constructEvent(payload, signature);

      // Idempotency Check
      const existingEvent = await webhookEventsDataAccess.findEventById(event.id);
      if (existingEvent && existingEvent.processed_at) {
        logger.info(`Webhook event ${event.id} already processed. Skipping.`);
        return res.json({ received: true, status: 'duplicate' });
      }

      // Log the new event if it's not a retry of a failed one
      if (!existingEvent) {
        await webhookEventsDataAccess.logEvent(event);
      }

      // Process the business logic
      await this.paymentService.processWebhookEvent(event);

      // Mark as successfully processed
      await webhookEventsDataAccess.updateEvent(event.id, {
        processed_at: new Date(),
        last_error: null,
      });

      logger.info('Processed Stripe webhook event successfully:', { type: event.type, id: event.id });
      res.json({ received: true, id: event.id, status: 'processed' });

    } catch (error) {
      logger.error('Error in handleStripeWebhook:', {
        eventId: event?.id,
        error: error.message,
        stack: error.stack
      });

      // Log the error to the database for retries
      if (event) {
        await webhookEventsDataAccess.updateEvent(event.id, {
          last_error: error.message,
        });
      }

      return res.status(400).json({ error: 'Webhook error', details: error.message });
    }
  }
}

module.exports = WebhookController; 