/**
 * Create Payments Batch
 * 
 * This batch job creates payments for subscription renewals which are due.
 * It creates a new payment entry for subscriptions that are in 'active' status
 * and have reached their billing period end date.
 */

const axios = require('axios');
const logger = require('../../shared/utils/logger');
const config = require('../../shared/utils/config');
const batchUserService = require('../utils/batchUserService');

class CreatePaymentsBatch {
  constructor() {
    this.name = 'create-payments';
    this.description = 'Creates payments for subscription renewals which are due';
  }

  async execute(options = {}) {
    const { authorization } = options;
    if (!authorization) {
      throw new Error('Authorization token is required');
    }

    logger.info('Starting create payments batch job');
    const results = {
      processed: 0,
      succeeded: 0,
      failed: 0,
      errors: []
    };

    try {
      // Get the batch user ID
      const batchUserId = await batchUserService.getBatchUserId();
      logger.info(`Using batch user ID: ${batchUserId}`);

      const payments = await this.fetchPaymentsForRenewal(authorization);
      logger.info(`Found ${payments.length} payments for renewal`);

      if (payments.length === 0) {
        logger.info('No payments to create');
        return results;
      }

      for (const payment of payments) {
        try {
          await this.createPayment(payment, authorization, batchUserId);
          results.succeeded++;
          logger.info(`Created payment for subscription ${payment.subscription_id}`);
        } catch (error) {
          results.failed++;
          results.errors.push({
            subscriptionId: payment.subscription_id,
            error: error.message
          });
          logger.error(`Failed to create payment for subscription ${payment.subscription_id}:`, error);
        }
        results.processed++;
      }

      logger.info('Create payments batch job completed', { results });
      return results;
    } catch (error) {
      logger.error('Create payments batch job failed:', error);
      throw error;
    }
  }

  async fetchPaymentsForRenewal(authorization) {
    try {
      const apiGatewayUrl = config.services.gateway.url;
      if (!apiGatewayUrl) {
        throw new Error('API Gateway URL is not configured');
      }
      
      const endpoint = `${apiGatewayUrl}/api/subscription/payments/renewal`;
      logger.info(`Fetching payments for renewal from ${endpoint}`);
      
      const response = await axios.get(endpoint, {
        headers: { authorization }
      });
      
      // Check if the response has the expected structure with a data property
      if (response.data && response.data.data) {
        logger.info(`Successfully retrieved ${response.data.data.length} payments for renewal`);
        return response.data.data;
      } else {
        logger.warn('Response does not have the expected structure with a data property');
        // Return an empty array if the expected structure is not found
        return [];
      }
    } catch (error) {
      logger.error('Failed to fetch payments for renewal:', error);
      throw error;
    }
  }

  async createPayment(payment, authorization, batchUserId) {
    try {
      const apiGatewayUrl = config.services.gateway.url;
      if (!apiGatewayUrl) {
        throw new Error('API Gateway URL is not configured');
      }
      
      const endpoint = `${apiGatewayUrl}/api/subscription/payments`;
      logger.info(`Creating payment at ${endpoint}`);
      
      // Create a clean payment data object with only the required fields
      // Remove any payment_id to avoid primary key conflicts
      const { payment_id, ...paymentWithoutId } = payment;
      
      // Add the batch user ID, payment type, status, and billing period dates to the payment data
      const paymentData = {
        ...paymentWithoutId,
        userId: batchUserId,
        paymentType: 'subscription_renewal',
        status: 'open',
        subscriptionId: payment.subscription_id, // Use the subscription_id from the payment data
        planId: payment.plan_id, // Ensure we use the plan_id from the original payment
        billing_period_start: payment.next_billing_period_start, // Use the next billing period start from the payment data
        billing_period_end: payment.next_billing_period_end // Use the next billing period end from the payment data
      };
      
      // Check if billing period dates are provided
      if (!paymentData.billing_period_start || !paymentData.billing_period_end) {
        logger.error(`Missing billing period dates for subscription ${payment.subscription_id}. Skipping payment creation.`);
        throw new Error('billing_period_start and billing_period_end are required for subscription renewal payments');
      }
      
      logger.info(`Creating payment with data: ${JSON.stringify(paymentData)}`);
      
      const response = await axios.post(
        endpoint,
        paymentData,
        { headers: { authorization } }
      );
      
      logger.info(`Payment created successfully with ID: ${response.data.data.payment_id}`);
      return response.data.data;
    } catch (error) {
      logger.error(`Failed to create payment for subscription ${payment.subscription_id}:`, error);
      throw error;
    }
  }
}

module.exports = CreatePaymentsBatch; 