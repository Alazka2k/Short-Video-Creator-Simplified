/**
 * Payment Routes
 * 
 * Defines routes for payment-related endpoints:
 * - GET /payments/user/:userId - Get user's payment history
 * - GET /payments/summary/:userId - Get user's payment summary
 * - POST /payments - Create a payment record
 * - POST /payments/update - Update a payment record
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
   * @route POST /api/subscription/payments/update
   * @description Update a payment record (e.g., mark as completed with payment provider details)
   * @access Private (admin only)
   */
  router.post('/update', paymentController.updatePayment.bind(paymentController));

  /**
   * @route POST /api/subscription/webhooks/stripe
   * @description Handle Stripe webhook
   * @access Public (secured by Stripe signature)
   */
  router.post('/webhooks/stripe', paymentController.handleStripeWebhook.bind(paymentController));

  /**
   * @route GET /api/subscription/payments/renewal
   * @description Get payments that need to be renewed
   * @access Private (admin only)
   */
  router.get('/renewal', paymentController.getPaymentsForRenewal.bind(paymentController));

  /**
   * @route GET /api/subscription/payments/collect
   * @description Get payments that need to be collected
   * @access Private (admin only)
   */
  router.get('/collect', paymentController.getPaymentsToCollect.bind(paymentController));

  /**
   * @route POST /api/subscription/payments/:paymentId/collect
   * @description Collect a specific payment
   * @access Private (admin only)
   */
  router.post('/:paymentId/collect', paymentController.collectPayment.bind(paymentController));

  return router;
}; 