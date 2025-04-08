/**
 * Subscription Renewals Batch
 * 
 * This batch job updates the current_period_start and current_period_end for active subscriptions
 * and allocates tokens for the users subscriptions.
 */

const axios = require('axios');
const logger = require('../../shared/utils/logger');
const config = require('../../shared/utils/config');
const batchUserService = require('../utils/batchUserService');

class SubscriptionRenewalsBatch {
  constructor() {
    this.name = 'subscription-renewals';
    this.description = 'Process subscription renewals';
  }

  async execute(options = {}) {
    const { authorization } = options;
    if (!authorization) {
      throw new Error('Authorization token is required');
    }

    logger.info('Starting subscription renewals batch job');
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

      const subscriptions = await this.fetchSubscriptionsForRenewal(authorization);
      logger.info(`Found ${subscriptions.length} subscriptions to renew`);

      if (subscriptions.length === 0) {
        logger.info('No subscriptions to renew');
        return results;
      }

      for (const subscription of subscriptions) {
        try {
          await this.renewSubscription(subscription, authorization, batchUserId);
          results.succeeded++;
          logger.info(`Successfully renewed subscription ${subscription.id}`);
        } catch (error) {
          results.failed++;
          results.errors.push({
            subscriptionId: subscription.id,
            error: error.message
          });
          logger.error(`Failed to renew subscription ${subscription.id}:`, error);
        }
        results.processed++;
      }

      logger.info('Subscription renewals batch job completed', { results });
      return results;
    } catch (error) {
      logger.error('Subscription renewals batch job failed:', error);
      throw error;
    }
  }

  async fetchSubscriptionsForRenewal(authorization) {
    try {
      const apiGatewayUrl = config.services.gateway.url;
      if (!apiGatewayUrl) {
        throw new Error('API Gateway URL is not configured');
      }
      
      const endpoint = `${apiGatewayUrl}/api/subscription/for-renewal`;
      logger.info(`Fetching subscriptions for renewal from ${endpoint}`);
      
      const response = await axios.get(endpoint, {
        headers: { authorization }
      });
      
      if (response.data && response.data.data) {
        logger.info(`Successfully retrieved ${response.data.data.length} subscriptions for renewal`);
        return response.data.data;
      } else {
        logger.warn('Response does not have the expected structure with a data property');
        return [];
      }
    } catch (error) {
      logger.error('Failed to fetch subscriptions for renewal:', error);
      throw error;
    }
  }

  async renewSubscription(subscription, authorization, batchUserId) {
    try {
      const apiGatewayUrl = config.services.gateway.url;
      if (!apiGatewayUrl) {
        throw new Error('API Gateway URL is not configured');
      }
      
      const endpoint = `${apiGatewayUrl}/api/subscription/user/${batchUserId}/renew`;
      logger.info(`Renewing subscription ${subscription.id} at ${endpoint}`);
      
      await axios.post(
        endpoint,
        {},
        { headers: { authorization } }
      );
      logger.info(`Successfully renewed subscription ${subscription.id}`);
    } catch (error) {
      logger.error(`Failed to renew subscription ${subscription.id}:`, error);
      throw error;
    }
  }
}

module.exports = SubscriptionRenewalsBatch; 