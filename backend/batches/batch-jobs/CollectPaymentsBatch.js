/**
 * Collect Payments Batch
 * 
 * This batch job processes pending payments and updates their status
 * based on the payment provider's response.
 */

const axios = require('axios');
const logger = require('../../shared/utils/logger');
const config = require('../../shared/utils/config');

class CollectPaymentsBatch {
  constructor() {
    this.name = 'collect-payments';
    this.description = 'Processes pending payments and updates their status';
  }

  async execute(options = {}) {
    const { authorization } = options;
    if (!authorization) {
      throw new Error('Authorization token is required');
    }

    logger.info('Starting collect payments batch job');
    const results = {
      processed: 0,
      succeeded: 0,
      failed: 0,
      errors: []
    };

    try {
      const paymentsToCollect = await this.fetchPendingPayments(authorization);
      logger.info(`Found ${paymentsToCollect.length} payments to collect`);

      if (paymentsToCollect.length === 0) {
        logger.info('No payments to collect');
        return results;
      }

      for (const payment of paymentsToCollect) {
        try {
          await this.collectPayment(payment, authorization);
          results.succeeded++;
          logger.info(`Successfully collected payment ${payment.id}`);
        } catch (error) {
          results.failed++;
          results.errors.push({
            paymentId: payment.id,
            error: error.message
          });
          logger.error(`Failed to collect payment ${payment.id}:`, error);
        }
        results.processed++;
      }

      logger.info('Collect payments batch job completed', { results });
      return results;
    } catch (error) {
      logger.error('Collect payments batch job failed:', error);
      throw error;
    }
  }
  
  async fetchPendingPayments(authorization) {
    try {
      const apiGatewayUrl = config.services.gateway.url;
      if (!apiGatewayUrl) {
        throw new Error('API Gateway URL is not configured');
      }
      
      logger.info(`Fetching payments to collect from ${apiGatewayUrl}/api/subscription/payments/collect`);
      
      const response = await axios.get(`${apiGatewayUrl}/api/subscription/payments/collect`, {
        headers: { authorization }
      });
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch payments to collect:', error);
      throw error;
    }
  }
  
  async collectPayment(payment, authorization) {
    try {
      const apiGatewayUrl = config.services.gateway.url;
      if (!apiGatewayUrl) {
        throw new Error('API Gateway URL is not configured');
      }
      
      logger.info(`Collecting payment ${payment.id} at ${apiGatewayUrl}/api/subscription/payments/${payment.id}/collect`);
      
      await axios.post(
        `${apiGatewayUrl}/api/subscription/payments/${payment.id}/collect`,
        {},
        { headers: { authorization } }
      );
    } catch (error) {
      logger.error(`Failed to collect payment ${payment.id}:`, error);
      throw error;
    }
  }
}

module.exports = CollectPaymentsBatch; 