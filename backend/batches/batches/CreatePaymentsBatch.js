/**
 * Create Payments Batch
 * 
 * This batch job creates payments for subscription renewals which are due.
 * It creates a new payment entry for subscriptions that are in 'active' status
 * and have reached their billing period end date.
 */

const BaseBatch = require('./BaseBatch');
const axios = require('axios');
const config = require('../../shared/utils/config');

class CreatePaymentsBatch extends BaseBatch {
  constructor() {
    this.id = 'create-payments';
    this.name = 'Create Payments';
    this.description = 'Creates payments for subscription renewals which are due';
    this.parameters = {
      force: {
        type: 'boolean',
        required: false,
        description: 'Force creation regardless of billing period end date'
      }
    };
    super();
  }

  async execute(params = {}, onProgress) {
    this.log('info', 'Starting create payments job');
    this.updateProgress(onProgress, 10);

    try {
      // Get subscription service URL from config
      const subscriptionServiceUrl = config.services.subscription.url;
      
      // Step 1: Get all active subscriptions that need payments
      this.log('info', 'Fetching active subscriptions that need payments');
      this.updateProgress(onProgress, 20);
      
      const subscriptionsNeedingPayments = await this.fetchSubscriptionsNeedingPayments(subscriptionServiceUrl, params.force);
      this.log('info', `Found ${subscriptionsNeedingPayments.length} subscriptions needing payments`);
      
      if (subscriptionsNeedingPayments.length === 0) {
        this.log('info', 'No subscriptions need payments');
        this.updateProgress(onProgress, 100);
        return { created: 0 };
      }
      
      // Step 2: Create payments for each subscription
      let created = 0;
      let failed = 0;
      
      for (let i = 0; i < subscriptionsNeedingPayments.length; i++) {
        const subscription = subscriptionsNeedingPayments[i];
        const progress = 20 + Math.floor((i / subscriptionsNeedingPayments.length) * 70);
        this.updateProgress(onProgress, progress);
        
        try {
          this.log('info', `Creating payment for subscription ${subscription.id} for user ${subscription.user_id}`);
          
          // Create a new payment
          await this.createPayment(
            subscriptionServiceUrl,
            subscription.user_id,
            subscription.id
          );
          
          created++;
          this.log('info', `Successfully created payment for subscription ${subscription.id}`);
        } catch (error) {
          failed++;
          this.log('error', `Failed to create payment for subscription ${subscription.id}: ${error.message}`);
        }
      }
      
      this.log('info', `Completed payment creation. Successfully created: ${created}, Failed: ${failed}`);
      this.updateProgress(onProgress, 100);
      
      return {
        created,
        failed,
        total: subscriptionsNeedingPayments.length
      };
    } catch (error) {
      this.log('error', `Job failed: ${error.message}`);
      throw error;
    }
  }
  
  async fetchSubscriptionsNeedingPayments(serviceUrl, force = false) {
    try {
      const response = await axios.get(`${serviceUrl}/api/subscription/subscriptions/needing-payments`, {
        params: { force }
      });
      return response.data;
    } catch (error) {
      this.log('error', `Failed to fetch subscriptions needing payments: ${error.message}`);
      throw error;
    }
  }
  
  async createPayment(serviceUrl, userId, subscriptionId) {
    try {
      await axios.post(`${serviceUrl}/api/subscription/payments`, {
        userId,
        paymentType: 'subscription_renewal',
        subscriptionId,
        status: 'open'
      });
    } catch (error) {
      this.log('error', `Failed to create payment: ${error.message}`);
      throw error;
    }
  }
}

module.exports = CreatePaymentsBatch; 