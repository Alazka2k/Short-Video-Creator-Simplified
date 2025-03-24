/**
 * Payment Routes
 * 
 * Defines routes for payment-related endpoints:
 * - GET /payments/user/:userId - Get user's payment history
 * - GET /payments/summary/:userId - Get user's payment summary
 * - POST /payments - Create a payment record
 * - POST /payments/:paymentId/status - Update payment status
 * - POST /payments/token-package - Purchase a token package
 * - POST /webhooks/stripe - Handle Stripe webhook
 */

const express = require('express');
const router = express.Router();

module.exports = (paymentController) => {
  /**
   * @route GET /api/subscription/payments/user/:userId
   * @description Get user's payment history
   * @access Private
   */
  router.get('/user/:userId', paymentController.getUserPayments.bind(paymentController));

  /**
   * @route GET /api/subscription/payments/summary/:userId
   * @description Get user's payment summary
   * @access Private
   */
  router.get('/summary/:userId', paymentController.getUserPaymentSummary.bind(paymentController));

  /**
   * @route POST /api/subscription/payments
   * @description Create a payment record
   * @access Private (admin only)
   */
  router.post('/', paymentController.createPayment.bind(paymentController));

  /**
   * @route POST /api/subscription/payments/:paymentId/status
   * @description Update payment status
   * @access Private (admin only)
   */
  router.post('/:paymentId/status', paymentController.updatePaymentStatus.bind(paymentController));

  /**
   * @route POST /api/subscription/payments/token-package
   * @description Purchase a token package
   * @access Private
   */
  router.post('/token-package', paymentController.purchaseTokenPackage.bind(paymentController));

  /**
   * @route POST /api/subscription/webhooks/stripe
   * @description Handle Stripe webhook
   * @access Public (secured by Stripe signature)
   */
  router.post('/webhooks/stripe', paymentController.handleStripeWebhook.bind(paymentController));

  return router;
}; 