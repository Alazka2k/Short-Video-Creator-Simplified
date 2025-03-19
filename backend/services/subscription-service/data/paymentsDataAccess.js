/**
 * Payments Data Access Layer
 * 
 * This module provides methods for interacting with payment records in the database.
 * It handles operations related to creating, retrieving, and updating payment information
 * for subscriptions, token purchases, and other financial transactions.
 * 
 * The payments table tracks all financial transactions in the system, including subscription
 * payments, token package purchases, and any other monetary exchanges between users and
 * the platform.
 */

const knex = require('knex')(require('../../../../knexfile')[process.env.NODE_ENV || 'development']);
const logger = require('../../../shared/utils/logger');
const config = require('../../../shared/utils/config');
const path = require('path');
const fs = require('fs').promises;

class PaymentsDataAccess {
  constructor() {
    this.tableName = 'payments';
    this.logger = logger;
  }

  /**
   * Get all payments for a user
   * @param {string} userId - The user ID
   * @param {number} limit - The maximum number of payments to return (default: 100)
   * @param {number} offset - The offset to start from (default: 0)
   * @returns {Promise<Array>} - List of payments
   */
  async getUserPayments(userId, limit = 100, offset = 0) {
    try {
      this.logger.info('Fetching payments for user:', { userId, limit, offset });
      
      const payments = await knex(this.tableName)
        .where('user_id', userId)
        .orderBy('created_at', 'desc')
        .limit(limit)
        .offset(offset);
      
      return payments.map(payment => this.formatPayment(payment));
    } catch (error) {
      this.logger.error('Error fetching user payments:', error);
      throw error;
    }
  }
  
  /**
   * Get a payment by ID
   * @param {number} paymentId - The payment ID
   * @returns {Promise<Object|null>} - The payment or null if not found
   */
  async getPaymentById(paymentId) {
    try {
      this.logger.info('Fetching payment by ID:', { paymentId });
      
      const payment = await knex(this.tableName)
        .where('payment_id', paymentId)
        .first();
      
      if (!payment) {
        this.logger.warn('Payment not found:', { paymentId });
        return null;
      }
      
      return this.formatPayment(payment);
    } catch (error) {
      this.logger.error('Error fetching payment by ID:', error);
      throw error;
    }
  }
  
  /**
   * Create a new payment record
   * @param {Object} paymentData - The payment data
   * @returns {Promise<Object>} - The created payment
   */
  async createPayment(paymentData) {
    try {
      this.logger.info('Creating new payment record:', paymentData);
      
      // Set timestamps
      paymentData.created_at = knex.fn.now();
      paymentData.updated_at = knex.fn.now();
      
      const [newPayment] = await knex(this.tableName)
        .insert(paymentData)
        .returning('*');
      
      this.logger.info('Payment record created successfully:', { 
        paymentId: newPayment.payment_id,
        userId: newPayment.user_id,
        amount: newPayment.amount,
        paymentType: newPayment.payment_type
      });
      return this.formatPayment(newPayment);
    } catch (error) {
      this.logger.error('Error creating payment record:', error);
      throw error;
    }
  }
  
  /**
   * Create a subscription payment record
   * @param {string} userId - The user ID
   * @param {number} subscriptionId - The subscription ID
   * @param {number} planId - The plan ID
   * @param {number} amount - The payment amount
   * @param {string} paymentProvider - The payment provider (e.g., 'stripe', 'paypal')
   * @param {string} externalPaymentId - The external payment ID from the provider
   * @param {string} paymentType - The payment type ('subscription_initial' or 'subscription_renewal')
   * @param {Object} billingPeriod - The billing period details {start: Date, end: Date}
   * @returns {Promise<Object>} - The created payment record
   */
  async createSubscriptionPayment(userId, subscriptionId, planId, amount, paymentProvider, externalPaymentId, paymentType = 'subscription_initial', billingPeriod = {}) {
    try {
      this.logger.info('Creating subscription payment record:', {
        userId, subscriptionId, planId, amount, paymentType
      });
      
      const paymentData = {
        user_id: userId,
        amount,
        payment_provider: paymentProvider,
        external_payment_id: externalPaymentId,
        payment_type: paymentType,
        status: 'completed',
        plan_id: planId,
        subscription_id: subscriptionId,
        billing_period_start: billingPeriod.start || null,
        billing_period_end: billingPeriod.end || null,
        payment_metadata: JSON.stringify({
          paymentFor: 'subscription',
          subscriptionId,
          planId
        })
      };
      
      return this.createPayment(paymentData);
    } catch (error) {
      this.logger.error('Error creating subscription payment record:', error);
      throw error;
    }
  }
  
  /**
   * Create a token package purchase payment record
   * @param {string} userId - The user ID
   * @param {number} packageId - The token package ID
   * @param {number} amount - The payment amount
   * @param {string} paymentProvider - The payment provider (e.g., 'stripe', 'paypal')
   * @param {string} externalPaymentId - The external payment ID from the provider
   * @returns {Promise<Object>} - The created payment record
   */
  async createTokenPackagePayment(userId, packageId, amount, paymentProvider, externalPaymentId) {
    try {
      this.logger.info('Creating token package payment record:', {
        userId, packageId, amount
      });
      
      const paymentData = {
        user_id: userId,
        amount,
        payment_provider: paymentProvider,
        external_payment_id: externalPaymentId,
        payment_type: 'token_package',
        status: 'completed',
        package_id: packageId,
        payment_metadata: JSON.stringify({
          paymentFor: 'tokenPackage',
          packageId
        })
      };
      
      return this.createPayment(paymentData);
    } catch (error) {
      this.logger.error('Error creating token package payment record:', error);
      throw error;
    }
  }
  
  /**
   * Update a payment record
   * @param {number} paymentId - The payment ID
   * @param {Object} paymentData - The updated payment data
   * @returns {Promise<Object|null>} - The updated payment or null if not found
   */
  async updatePayment(paymentId, paymentData) {
    try {
      this.logger.info('Updating payment record:', { paymentId, paymentData });
      
      // Prevent updating the payment_id
      delete paymentData.payment_id;
      
      // Update the updated_at timestamp
      paymentData.updated_at = knex.fn.now();
      
      const [updatedPayment] = await knex(this.tableName)
        .where('payment_id', paymentId)
        .update(paymentData)
        .returning('*');
      
      if (!updatedPayment) {
        this.logger.warn('Payment not found for update:', { paymentId });
        return null;
      }
      
      this.logger.info('Payment record updated successfully:', { 
        paymentId,
        status: updatedPayment.status
      });
      return this.formatPayment(updatedPayment);
    } catch (error) {
      this.logger.error('Error updating payment record:', error);
      throw error;
    }
  }
  
  /**
   * Get all payments related to a subscription
   * @param {number} subscriptionId - The subscription ID
   * @returns {Promise<Array>} - List of payments for the subscription
   */
  async getSubscriptionPayments(subscriptionId) {
    try {
      this.logger.info('Fetching payments for subscription:', { subscriptionId });
      
      const payments = await knex(this.tableName)
        .where('payment_type', 'subscription_initial')
        .orWhere('payment_type', 'subscription_renewal')
        .where('subscription_id', subscriptionId)
        .orderBy('created_at', 'desc');
      
      return payments.map(payment => this.formatPayment(payment));
    } catch (error) {
      this.logger.error('Error fetching subscription payments:', error);
      throw error;
    }
  }
  
  /**
   * Get user payment summary with total amounts and counts
   * @param {string} userId - The user ID
   * @returns {Promise<Object>} - Payment summary
   */
  async getUserPaymentSummary(userId) {
    try {
      this.logger.info('Fetching payment summary for user:', { userId });
      
      // Get total amount spent
      const totalResult = await knex(this.tableName)
        .where('user_id', userId)
        .where('status', 'completed')
        .sum('amount as total')
        .first();
      
      // Get payment counts by type
      const typesCount = await knex(this.tableName)
        .where('user_id', userId)
        .where('status', 'completed')
        .select('payment_type')
        .count('payment_id as count')
        .groupBy('payment_type');
      
      // Get payment counts by month
      const monthlyPayments = await knex(this.tableName)
        .where('user_id', userId)
        .where('status', 'completed')
        .select(
          knex.raw("DATE_TRUNC('month', created_at) as month"),
          knex.raw('SUM(amount) as total')
        )
        .groupBy('month')
        .orderBy('month', 'desc')
        .limit(12);
      
      // Create summary object
      const summary = {
        userId,
        totalSpent: parseFloat(totalResult.total) || 0,
        paymentsByType: typesCount.reduce((acc, type) => {
          acc[type.payment_type] = parseInt(type.count);
          return acc;
        }, {}),
        monthlySpending: monthlyPayments.map(item => ({
          month: item.month,
          amount: parseFloat(item.total) || 0
        }))
      };
      
      return summary;
    } catch (error) {
      this.logger.error('Error fetching user payment summary:', error);
      throw error;
    }
  }
  
  /**
   * Format payment data
   * @param {Object} payment - The payment data from the database
   * @returns {Object} - The formatted payment data
   */
  formatPayment(payment) {
    if (!payment) return null;
    
    const formattedPayment = {
      ...payment
    };
    
    // Format dates
    formattedPayment.created_at = payment.created_at ? new Date(payment.created_at).toISOString() : null;
    formattedPayment.updated_at = payment.updated_at ? new Date(payment.updated_at).toISOString() : null;
    formattedPayment.billing_period_start = payment.billing_period_start ? new Date(payment.billing_period_start).toISOString() : null;
    formattedPayment.billing_period_end = payment.billing_period_end ? new Date(payment.billing_period_end).toISOString() : null;
    
    // Format amount as float
    formattedPayment.amount = parseFloat(payment.amount) || 0;
    
    // Parse payment_metadata if it exists
    if (payment.payment_metadata) {
      try {
        formattedPayment.payment_metadata = JSON.parse(payment.payment_metadata);
      } catch (error) {
        this.logger.warn('Error parsing payment metadata JSON:', { 
          paymentId: payment.payment_id, 
          error: error.message 
        });
      }
    }
    
    return formattedPayment;
  }
}

module.exports = new PaymentsDataAccess(); 