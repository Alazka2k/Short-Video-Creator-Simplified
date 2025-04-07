/**
 * Subscription Renewals Batch
 * 
 * This batch job updates the current_period_start and current_period_end for active subscriptions
 * and allocates tokens for the users subscriptions.
 */

const BaseBatch = require('./BaseBatch');
const axios = require('axios');
const config = require('../../shared/utils/config');

class SubscriptionRenewalsBatch extends BaseBatch {
  constructor() {
    this.id = 'subscription-renewals';
    this.name = 'Subscription Renewals';
    this.description = 'Updates subscription periods and allocates tokens for active subscriptions';
    this.parameters = {
      force: {
        type: 'boolean',
        required: false,
        description: 'Force renewal regardless of period end date'
      }
    };
    super();
  }

  async execute(params = {}, onProgress) {
    this.log('info', 'Starting subscription renewals job');
    this.updateProgress(onProgress, 10);

    try {
      // Get subscription service URL from config
      const subscriptionServiceUrl = config.services.subscription.url;
      
      // Step 1: Get all active subscriptions that need renewal
      this.log('info', 'Fetching active subscriptions that need renewal');
      this.updateProgress(onProgress, 20);
      
      const subscriptionsToRenew = await this.fetchSubscriptionsToRenew(subscriptionServiceUrl, params.force);
      this.log('info', `Found ${subscriptionsToRenew.length} subscriptions to renew`);
      
      if (subscriptionsToRenew.length === 0) {
        this.log('info', 'No subscriptions to renew');
        this.updateProgress(onProgress, 100);
        return { renewed: 0 };
      }
      
      // Step 2: Process each subscription renewal
      let renewed = 0;
      let failed = 0;
      
      for (let i = 0; i < subscriptionsToRenew.length; i++) {
        const subscription = subscriptionsToRenew[i];
        const progress = 20 + Math.floor((i / subscriptionsToRenew.length) * 70);
        this.updateProgress(onProgress, progress);
        
        try {
          this.log('info', `Renewing subscription ${subscription.id} for user ${subscription.user_id}`);
          
          // Call the renewal endpoint
          await this.renewSubscription(subscriptionServiceUrl, subscription.user_id);
          
          renewed++;
          this.log('info', `Successfully renewed subscription ${subscription.id}`);
        } catch (error) {
          failed++;
          this.log('error', `Failed to renew subscription ${subscription.id}: ${error.message}`);
        }
      }
      
      this.log('info', `Completed renewals. Successfully renewed: ${renewed}, Failed: ${failed}`);
      this.updateProgress(onProgress, 100);
      
      return {
        renewed,
        failed,
        total: subscriptionsToRenew.length
      };
    } catch (error) {
      this.log('error', `Job failed: ${error.message}`);
      throw error;
    }
  }
  
  async fetchSubscriptionsToRenew(serviceUrl, force = false) {
    try {
      const response = await axios.get(`${serviceUrl}/api/subscription/subscriptions/to-renew`, {
        params: { force }
      });
      return response.data;
    } catch (error) {
      this.log('error', `Failed to fetch subscriptions to renew: ${error.message}`);
      throw error;
    }
  }
  
  async renewSubscription(serviceUrl, userId) {
    try {
      await axios.put(`${serviceUrl}/api/subscription/subscriptions/${userId}/renew`);
    } catch (error) {
      this.log('error', `Failed to renew subscription: ${error.message}`);
      throw error;
    }
  }
}

module.exports = SubscriptionRenewalsBatch; 