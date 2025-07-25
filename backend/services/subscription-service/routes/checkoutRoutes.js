/**
 * Checkout Routes
 * 
 * Routes for handling Stripe Checkout session creation for subscriptions and token packages
 */

const express = require('express');
const router = express.Router();
const checkoutController = require('../controllers/checkoutController');
const logger = require('../../../shared/utils/logger');

/**
 * @route POST /checkout/create-subscription-session
 * @description Create a Stripe Checkout session for subscription plans
 * @access Protected - requires valid user authentication
 * @body {number} userId - The user ID
 * @body {number} planId - The plan ID to subscribe to
 * @body {string} successUrl - URL to redirect to on successful payment
 * @body {string} cancelUrl - URL to redirect to on cancelled payment
 */
router.post('/create-subscription-session', async (req, res) => {
  logger.info('POST /checkout/create-subscription-session called');
  await checkoutController.createSubscriptionCheckout(req, res);
});

/**
 * @route POST /checkout/create-token-package-session
 * @description Create a Stripe Checkout session for token package purchases
 * @access Protected - requires valid user authentication
 * @body {number} userId - The user ID
 * @body {number} packageId - The token package ID to purchase
 * @body {string} successUrl - URL to redirect to on successful payment
 * @body {string} cancelUrl - URL to redirect to on cancelled payment
 */
router.post('/create-token-package-session', async (req, res) => {
  logger.info('POST /checkout/create-token-package-session called');
  await checkoutController.createTokenPackageCheckout(req, res);
});

/**
 * @route POST /checkout/create-customer-portal-session
 * @description Create a Stripe Customer Portal session for subscription management
 * @access Protected - requires valid user authentication
 * @body {number} userId - The user ID
 * @body {string} returnUrl - URL to return to after portal session
 */
router.post('/create-customer-portal-session', async (req, res) => {
  logger.info('POST /checkout/create-customer-portal-session called');
  await checkoutController.createCustomerPortalSession(req, res);
});

/**
 * @route POST /checkout/verify-session
 * @description Verify a Stripe Checkout session
 * @access Private
 */
router.post('/verify-session', async (req, res) => {
  logger.info('POST /checkout/verify-session called');
  await checkoutController.verifyCheckoutSession(req, res);
});

module.exports = router; 