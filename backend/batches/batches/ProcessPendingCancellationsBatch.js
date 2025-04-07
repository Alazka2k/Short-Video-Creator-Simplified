/**
 * Process Pending Cancellations Batch
 * 
 * This batch job processes subscriptions that are marked for cancellation and have reached their end date.
 * It handles downgrades, frequency changes, and cancellations to free tier.
 */

const BaseBatch = require('./BaseBatch');
const axios = require('axios');
const config = require('../../shared/utils/config');

class ProcessPendingCancellationsBatch extends BaseBatch {
  constructor() {
    this.id = 'process-pending-cancellations';
    this.name = 'Process Pending Cancellations';
    this.description = 'Processes subscriptions that are marked for cancellation and have reached their end date';
    this.parameters = {
      force: {
        type: 'boolean',
        required: false,
        description: 'Force processing regardless of end date'
      }
    };
    super();
  }

  async execute(params = {}, onProgress) {
    this.log('info', 'Starting pending cancellations processing job');
    this.updateProgress(onProgress, 10);

    try {
      // Get subscription service URL from config
      const subscriptionServiceUrl = config.services.subscription.url;
      
      // Step 1: Get all pending cancellations
      this.log('info', 'Fetching pending cancellations');
      this.updateProgress(onProgress, 20);
      
      const pendingCancellations = await this.fetchPendingCancellations(subscriptionServiceUrl, params.force);
      this.log('info', `Found ${pendingCancellations.length} pending cancellations to process`);
      
      if (pendingCancellations.length === 0) {
        this.log('info', 'No pending cancellations to process');
        this.updateProgress(onProgress, 100);
        return { processed: 0 };
      }
      
      // Step 2: Process each pending cancellation
      let processed = 0;
      let failed = 0;
      
      for (let i = 0; i < pendingCancellations.length; i++) {
        const subscription = pendingCancellations[i];
        const progress = 20 + Math.floor((i / pendingCancellations.length) * 70);
        this.updateProgress(onProgress, progress);
        
        try {
          this.log('info', `Processing subscription ${subscription.id} for user ${subscription.user_id}`);
          
          // Step 2.1: Update the subscription status to cancelled
          await this.updateSubscriptionStatus(subscriptionServiceUrl, subscription.id, 'cancelled');
          
          // Step 2.2: Create a new subscription based on the upcoming plan
          if (subscription.upcoming_plan_id) {
            await this.createNewSubscription(
              subscriptionServiceUrl, 
              subscription.user_id, 
              subscription.upcoming_plan_id
            );
          } else {
            // If no upcoming plan, create a free tier subscription
            await this.createNewSubscription(
              subscriptionServiceUrl, 
              subscription.user_id, 
              1 // Free tier plan ID
            );
          }
          
          processed++;
          this.log('info', `Successfully processed subscription ${subscription.id}`);
        } catch (error) {
          failed++;
          this.log('error', `Failed to process subscription ${subscription.id}: ${error.message}`);
        }
      }
      
      this.log('info', `Completed processing. Successfully processed: ${processed}, Failed: ${failed}`);
      this.updateProgress(onProgress, 100);
      
      return {
        processed,
        failed,
        total: pendingCancellations.length
      };
    } catch (error) {
      this.log('error', `Job failed: ${error.message}`);
      throw error;
    }
  }
  
  async fetchPendingCancellations(serviceUrl, force = false) {
    try {
      const response = await axios.get(`${serviceUrl}/api/subscription/subscriptions/pending-cancellations`, {
        params: { force }
      });
      return response.data;
    } catch (error) {
      this.log('error', `Failed to fetch pending cancellations: ${error.message}`);
      throw error;
    }
  }
  
  async updateSubscriptionStatus(serviceUrl, subscriptionId, status) {
    try {
      await axios.put(`${serviceUrl}/api/subscription/subscriptions/${subscriptionId}`, {
        status
      });
    } catch (error) {
      this.log('error', `Failed to update subscription status: ${error.message}`);
      throw error;
    }
  }
  
  async createNewSubscription(serviceUrl, userId, planId) {
    try {
      await axios.post(`${serviceUrl}/api/subscription/subscriptions`, {
        userId,
        planId,
        status: 'active'
      });
    } catch (error) {
      this.log('error', `Failed to create new subscription: ${error.message}`);
      throw error;
    }
  }
}

module.exports = ProcessPendingCancellationsBatch; 