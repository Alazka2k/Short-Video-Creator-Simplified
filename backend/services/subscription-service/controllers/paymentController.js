/**
 * Payment Controller
 * 
 * This controller handles HTTP requests for payment-related endpoints:
 * - GET /payments/user/:userId - Get user's payment history
 * - GET /payments/user/:userId/summary - Get user's payment summary
 * - POST /payments - Create a payment record
 * - POST /payments/update - Update a payment record
 * - POST /payments/token-package - Purchase a token package
 * - POST /payments/webhook/stripe - Handle Stripe webhook
 */

const logger = require('../../../shared/utils/logger');

class PaymentController {
  constructor(paymentService) {
    this.paymentService = paymentService;
    logger.info('PaymentController initialized');
  }

  /**
   * Get user's payment history
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getUserPayments(req, res) {
    try {
      const { userId } = req.params;
      const { limit = 100, offset = 0 } = req.query;
      
      const payments = await this.paymentService.getUserPayments(
        userId, 
        parseInt(limit), 
        parseInt(offset)
      );
      
      res.json(payments);
    } catch (error) {
      logger.error('Error fetching user payments:', error);
      res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  }

  /**
   * Get user's payment summary
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getUserPaymentSummary(req, res) {
    try {
      const { userId } = req.params;
      const summary = await this.paymentService.getUserPaymentSummary(userId);
      
      res.json(summary);
    } catch (error) {
      logger.error('Error fetching user payment summary:', error);
      res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  }

  /**
   * Create a payment record
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async createPayment(req, res) {
    try {
      const paymentData = req.body;
      
      // Validate required fields
      if (!paymentData.userId) {
        return res.status(400).json({ error: 'userId is required' });
      }
      
      if (!paymentData.paymentType) {
        return res.status(400).json({ error: 'paymentType is required' });
      }
      
      if (!paymentData.status) {
        return res.status(400).json({ error: 'status is required' });
      }
      
      // Only require paymentProvider for non-renewal payments
      if (paymentData.paymentType !== 'subscription_renewal' && !paymentData.paymentProvider) {
        return res.status(400).json({ error: 'paymentProvider is required for non-renewal payments' });
      }
      
      const payment = await this.paymentService.createPaymentRecord(paymentData);
      
      res.status(201).json({
        success: true,
        data: payment
      });
    } catch (error) {
      logger.error('Error creating payment record:', error);
      res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  }

  /**
   * Update a payment record
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async updatePayment(req, res) {
    try {
      const { paymentId, status, paymentProvider, externalPaymentId } = req.body;
      
      if (!paymentId) {
        return res.status(400).json({ error: 'paymentId is required' });
      }
      
      if (!status) {
        return res.status(400).json({ error: 'status is required' });
      }
      
      if (!['pending', 'completed', 'failed', 'open'].includes(status)) {
        return res.status(400).json({ error: 'status must be one of: pending, completed, failed, open' });
      }
      
      // Require paymentProvider and externalPaymentId when updating to completed status
      if (status === 'completed') {
        if (!paymentProvider) {
          return res.status(400).json({ error: 'paymentProvider is required when updating to completed status' });
        }
        if (!externalPaymentId) {
          return res.status(400).json({ error: 'externalPaymentId is required when updating to completed status' });
        }
      }
      
      const payment = await this.paymentService.updatePayment(paymentId, {
        status,
        paymentProvider,
        externalPaymentId
      });
      
      if (!payment) {
        return res.status(404).json({ error: 'Payment not found' });
      }
      
      res.json({
        success: true,
        data: payment
      });
    } catch (error) {
      logger.error('Error updating payment:', error);
      res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  }

  /**
   * Purchase a token package
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async purchaseTokenPackage(req, res) {
    try {
      const { userId, packageId, paymentProvider, externalPaymentId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
      }
      
      if (!packageId) {
        return res.status(400).json({ error: 'packageId is required' });
      }
      
      if (!paymentProvider) {
        return res.status(400).json({ error: 'paymentProvider is required' });
      }
      
      if (!externalPaymentId) {
        return res.status(400).json({ error: 'externalPaymentId is required' });
      }
      
      const result = await this.paymentService.purchaseTokenPackage(
        userId,
        packageId,
        paymentProvider,
        externalPaymentId
      );
      
      res.status(201).json(result);
    } catch (error) {
      logger.error('Error purchasing token package:', error);
      res.status(500).json({ error: 'Internal server error', details: error.message });
    }
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
      
      if (!signature) {
        logger.warn('Missing Stripe signature');
        return res.status(400).json({ error: 'Missing Stripe signature' });
      }
      
      const event = await this.paymentService.handleStripeWebhook(payload, signature);
      
      res.json({ received: true, id: event.id });
    } catch (error) {
      logger.error('Error handling Stripe webhook:', error);
      return res.status(400).json({ error: 'Webhook error', details: error.message });
    }
  }

  /**
   * Get payments that need to be renewed
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getPaymentsForRenewal(req, res) {
    try {
      const { force } = req.query;
      
      const payments = await this.paymentService.getPaymentsForRenewal(force === 'true');
      
      res.json({
        success: true,
        data: payments
      });
    } catch (error) {
      logger.error('Error fetching payments for renewal:', error);
      res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  }

  /**
   * Get payments that need to be collected
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getPaymentsToCollect(req, res) {
    try {
      const { force } = req.query;
      
      const payments = await this.paymentService.getPaymentsToCollect(force === 'true');
      
      res.json({
        success: true,
        data: payments
      });
    } catch (error) {
      logger.error('Error fetching payments to collect:', error);
      res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  }

  /**
   * Collect a payment
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async collectPayment(req, res) {
    try {
      const { paymentId } = req.params;
      
      if (!paymentId) {
        return res.status(400).json({ error: 'Payment ID is required' });
      }
      
      const result = await this.paymentService.collectPayment(paymentId);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Error collecting payment:', error);
      res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  }
}

module.exports = PaymentController; 