/**
 * Process Pending Cancellations Batch
 * 
 * This batch job processes subscriptions that are marked for cancellation and have reached their end date.
 * It handles downgrades, frequency changes, and cancellations to free tier.
 */

const BaseBatch = require('./BaseBatch');
const axios = require('axios');
const config = require('../../shared/utils/config');
const logger = require('../../shared/utils/logger');

class ProcessPendingCancellationsBatch extends BaseBatch {
  constructor() {
    super();
    this.id = 'process-pending-cancellations';
    this.name = 'Process Pending Cancellations';
    this.description = 'Processes subscriptions that are marked for cancellation and have reached their end date';
    this.parameters = {
      authorization: {
        type: 'string',
        required: true,
        description: 'Authorization token'
      }
    };
  }

  async execute(options = {}) {
    const { authorization } = options;
    if (!authorization) {
      throw new Error('Authorization token is required');
    }

    logger.info('Starting pending cancellations batch job');
    const results = {
      processed: 0,
      succeeded: 0,
      failed: 0,
      errors: []
    };

    try {
      const pendingCancellations = await this.fetchPendingCancellations(authorization);
      logger.info(`Found ${pendingCancellations.length} pending cancellations to process`);

      if (pendingCancellations.length === 0) {
        logger.info('No pending cancellations to process');
        return results;
      }

      for (const cancellation of pendingCancellations) {
        try {
          await this.processCancellation(cancellation, authorization);
          results.succeeded++;
          logger.info(`Successfully processed cancellation ${cancellation.id}`);
        } catch (error) {
          results.failed++;
          results.errors.push({
            cancellationId: cancellation.id,
            error: error.message
          });
          logger.error(`Failed to process cancellation ${cancellation.id}:`, error);
        }
        results.processed++;
      }

      logger.info('Pending cancellations batch job completed', { results });
      return results;
    } catch (error) {
      logger.error('Pending cancellations batch job failed:', error);
      throw error;
    }
  }

  async fetchPendingCancellations(authorization) {
    try {
      const apiGatewayUrl = config.services.gateway.url;
      if (!apiGatewayUrl) {
        throw new Error('API Gateway URL is not configured');
      }
      
      const endpoint = `${apiGatewayUrl}/api/subscription/cancellations/pending`;
      logger.info(`Fetching pending cancellations from ${endpoint}`);
      
      const response = await axios.get(endpoint, {
        headers: { authorization }
      });
      
      if (response.data && response.data.data) {
        logger.info(`Successfully retrieved ${response.data.data.length} pending cancellations`);
        return response.data.data;
      } else {
        logger.warn('Response does not have the expected structure with a data property');
        return [];
      }
    } catch (error) {
      logger.error('Failed to fetch pending cancellations:', error);
      throw error;
    }
  }

  async processCancellation(cancellation, authorization) {
    try {
      await this.updateSubscriptionStatus(cancellation.subscriptionId, 'cancelled', authorization);
      
      if (cancellation.createNewSubscription) {
        await this.createNewSubscription(cancellation, authorization);
      }
      
      logger.info(`Successfully processed cancellation ${cancellation.id}`);
    } catch (error) {
      logger.error(`Failed to process cancellation ${cancellation.id}:`, error);
      throw error;
    }
  }

  async updateSubscriptionStatus(subscriptionId, status, authorization) {
    try {
      const apiGatewayUrl = config.services.gateway.url;
      if (!apiGatewayUrl) {
        throw new Error('API Gateway URL is not configured');
      }
      
      const endpoint = `${apiGatewayUrl}/api/subscription/${subscriptionId}/status`;
      logger.info(`Updating subscription ${subscriptionId} status to ${status} at ${endpoint}`);
      
      await axios.patch(
        endpoint,
        { status },
        { headers: { authorization } }
      );
    } catch (error) {
      logger.error(`Failed to update subscription ${subscriptionId} status:`, error);
      throw error;
    }
  }

  async createNewSubscription(cancellation, authorization) {
    try {
      const apiGatewayUrl = config.services.gateway.url;
      if (!apiGatewayUrl) {
        throw new Error('API Gateway URL is not configured');
      }
      
      logger.info(`Creating new subscription for user ${cancellation.userId} at ${apiGatewayUrl}/api/subscription`);
      
      await axios.post(
        `${apiGatewayUrl}/api/subscription`,
        {
          userId: cancellation.userId,
          planId: cancellation.newPlanId,
          startDate: new Date().toISOString()
        },
        { headers: { authorization } }
      );
      logger.info(`Created new subscription for user ${cancellation.userId}`);
    } catch (error) {
      logger.error(`Failed to create new subscription for user ${cancellation.userId}:`, error);
      throw error;
    }
  }
}

module.exports = ProcessPendingCancellationsBatch; 