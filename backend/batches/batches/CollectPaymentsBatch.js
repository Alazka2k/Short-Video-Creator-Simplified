/**
 * Collect Payments Batch
 * 
 * This batch job processes pending payments and updates their status
 * based on the payment provider's response.
 */

const BaseBatch = require('./BaseBatch');
const axios = require('axios');
const config = require('../../shared/utils/config');

class CollectPaymentsBatch extends BaseBatch {
  constructor() {
    this.id = 'collect-payments';
    this.name = 'Collect Payments';
    this.description = 'Processes pending payments and updates their status';
    this.parameters = {
      force: {
        type: 'boolean',
        required: false,
        description: 'Force collection regardless of payment status'
      }
    };
    super();
  }

  async execute(params = {}, onProgress) {
    this.log('info', 'Starting collect payments job');
    this.updateProgress(onProgress, 10);

    try {
      // Get subscription service URL from config
      const subscriptionServiceUrl = config.services.subscription.url;
      
      // Step 1: Get all open payments that need to be collected
      this.log('info', 'Fetching open payments that need to be collected');
      this.updateProgress(onProgress, 20);
      
      const paymentsToCollect = await this.fetchPaymentsToCollect(subscriptionServiceUrl, params.force);
      this.log('info', `Found ${paymentsToCollect.length} payments to collect`);
      
      if (paymentsToCollect.length === 0) {
        this.log('info', 'No payments to collect');
        this.updateProgress(onProgress, 100);
        return { collected: 0 };
      }
      
      // Step 2: Collect each payment
      let collected = 0;
      let failed = 0;
      
      for (let i = 0; i < paymentsToCollect.length; i++) {
        const payment = paymentsToCollect[i];
        const progress = 20 + Math.floor((i / paymentsToCollect.length) * 70);
        this.updateProgress(onProgress, progress);
        
        try {
          this.log('info', `Collecting payment ${payment.id} for user ${payment.user_id}`);
          
          // Collect the payment
          const result = await this.collectPayment(subscriptionServiceUrl, payment.id);
          
          if (result.success) {
            collected++;
            this.log('info', `Successfully collected payment ${payment.id}`);
          } else {
            failed++;
            this.log('error', `Failed to collect payment ${payment.id}: ${result.error}`);
          }
        } catch (error) {
          failed++;
          this.log('error', `Failed to collect payment ${payment.id}: ${error.message}`);
        }
      }
      
      this.log('info', `Completed payment collection. Successfully collected: ${collected}, Failed: ${failed}`);
      this.updateProgress(onProgress, 100);
      
      return {
        collected,
        failed,
        total: paymentsToCollect.length
      };
    } catch (error) {
      this.log('error', `Job failed: ${error.message}`);
      throw error;
    }
  }
  
  async fetchPaymentsToCollect(serviceUrl, force = false) {
    try {
      const response = await axios.get(`${serviceUrl}/api/subscription/payments/to-collect`, {
        params: { force }
      });
      return response.data;
    } catch (error) {
      this.log('error', `Failed to fetch payments to collect: ${error.message}`);
      throw error;
    }
  }
  
  async collectPayment(serviceUrl, paymentId) {
    try {
      const response = await axios.post(`${serviceUrl}/api/subscription/payments/${paymentId}/collect`);
      return response.data;
    } catch (error) {
      this.log('error', `Failed to collect payment: ${error.message}`);
      throw error;
    }
  }
}

module.exports = CollectPaymentsBatch; 