/**
 * Retry Failed Payments Batch
 * 
 * This batch job retries failed payments for subscriptions that are in the status 'failed'.
 * Retry should be done twice. If the payment is still not successful, the payment status is set to 'failed'
 * and the counter is incremented.
 */

const axios = require('axios');
const logger = require('../../shared/utils/logger');
const config = require('../../shared/utils/config');

class RetryFailedPaymentsBatch {
  constructor() {
    this.name = 'retry-failed-payments';
    this.description = 'Retries failed payments for subscriptions that are in the status failed';
  }

  async execute(options = {}) {
    const { authorization } = options;
    if (!authorization) {
      throw new Error('Authorization token is required');
    }

    logger.info('Starting retry failed payments batch job');
    const results = {
      processed: 0,
      succeeded: 0,
      failed: 0,
      errors: []
    };

    try {
      const failedPayments = await this.fetchFailedPayments(authorization);
      logger.info(`Found ${failedPayments.length} failed payments to retry`);

      if (failedPayments.length === 0) {
        logger.info('No failed payments to retry');
        return results;
      }

      for (const payment of failedPayments) {
        try {
          await this.retryPayment(payment, authorization);
          results.succeeded++;
          logger.info(`Successfully retried payment ${payment.id}`);
        } catch (error) {
          results.failed++;
          results.errors.push({
            paymentId: payment.id,
            error: error.message
          });
          logger.error(`Failed to retry payment ${payment.id}:`, error);
        }
        results.processed++;
      }

      logger.info('Retry failed payments batch job completed', { results });
      return results;
    } catch (error) {
      logger.error('Retry failed payments batch job failed:', error);
      throw error;
    }
  }
  
  async fetchFailedPayments(authorization) {
    try {
      const apiGatewayUrl = config.services.gateway.url;
      if (!apiGatewayUrl) {
        throw new Error('API Gateway URL is not configured');
      }
      
      const endpoint = `${apiGatewayUrl}/api/subscription/payments/failed`; // COMPARE WITH THE ENDPOINT IN THE DOCUMENTATION
      logger.info(`Fetching failed payments from ${endpoint}`);
      
      const response = await axios.get(endpoint, {
        headers: { authorization }
      });
      
      // Check if the response has the expected structure with a data property
      if (response.data && response.data.data) {
        logger.info(`Successfully retrieved ${response.data.data.length} failed payments`);
        return response.data.data;
      } else {
        logger.warn('Response does not have the expected structure with a data property');
        // Return an empty array if the expected structure is not found
        return [];
      }
    } catch (error) {
      logger.error('Failed to fetch failed payments:', error);
      throw error;
    }
  }
  
  async retryPayment(payment, authorization) {
    try {
      const apiGatewayUrl = config.services.gateway.url;
      if (!apiGatewayUrl) {
        throw new Error('API Gateway URL is not configured');
      }
      
      const endpoint = `${apiGatewayUrl}/api/subscription/payments/${payment.id}/retry`; // NEEDS TO BE IMPLEMENTED?
      logger.info(`Retrying payment ${payment.id} at ${endpoint}`);
      
      await axios.post(
        endpoint,
        {},
        { headers: { authorization } }
      );
    } catch (error) {
      logger.error(`Failed to retry payment ${payment.id}:`, error);
      throw error;
    }
  }
}

module.exports = RetryFailedPaymentsBatch; 