/**
 * Validation Middleware
 * 
 * This middleware provides validation functions for various API endpoints.
 */

const logger = require('../../../shared/utils/logger');

/**
 * Validate user ID parameter
 */
function validateUserId(req, res, next) {
  const { userId } = req.params;
  
  if (!userId) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      details: 'User ID is required',
      code: 'MISSING_USER_ID'
    });
  }
  
  // For UUID validation (if using UUIDs)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (userId.match(uuidRegex) === null) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      details: 'Invalid User ID format',
      code: 'INVALID_USER_ID'
    });
  }
  
  next();
}

/**
 * Validate subscription data in request body
 */
function validateSubscriptionData(req, res, next) {
  const { userId, planId, startDate } = req.body;
  
  if (!userId) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      details: 'User ID is required',
      code: 'MISSING_USER_ID'
    });
  }
  
  if (!planId) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      details: 'Plan ID is required',
      code: 'MISSING_PLAN_ID'
    });
  }
  
  // Validate date format if provided
  if (startDate && isNaN(Date.parse(startDate))) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      details: 'Invalid date format for startDate',
      code: 'INVALID_DATE'
    });
  }
  
  next();
}

/**
 * Validate payment data in request body
 */
function validatePaymentData(req, res, next) {
  const { userId, amount, paymentMethod } = req.body;
  
  if (!userId) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      details: 'User ID is required',
      code: 'MISSING_USER_ID'
    });
  }
  
  if (!amount || isNaN(parseFloat(amount))) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      details: 'Valid amount is required',
      code: 'INVALID_AMOUNT'
    });
  }
  
  if (!paymentMethod) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      details: 'Payment method is required',
      code: 'MISSING_PAYMENT_METHOD'
    });
  }
  
  next();
}

/**
 * Validate token package purchase data
 */
function validateTokenPackagePurchase(req, res, next) {
  const { userId, packageId, paymentProvider, externalPaymentId } = req.body;
  
  if (!userId) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      details: 'User ID is required',
      code: 'MISSING_USER_ID'
    });
  }
  
  if (!packageId) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      details: 'Package ID is required',
      code: 'MISSING_PACKAGE_ID'
    });
  }
  
  if (!paymentProvider) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      details: 'Payment provider is required',
      code: 'MISSING_PAYMENT_PROVIDER'
    });
  }
  
  if (!externalPaymentId) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      details: 'External payment ID is required',
      code: 'MISSING_EXTERNAL_PAYMENT_ID'
    });
  }
  
  next();
}

module.exports = {
  validateUserId,
  validateSubscriptionData,
  validatePaymentData,
  validateTokenPackagePurchase
}; 