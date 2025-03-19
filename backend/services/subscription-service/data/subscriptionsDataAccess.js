/**
 * Subscriptions Data Access Layer
 * 
 * This module provides methods for interacting with user subscriptions in the database.
 * It handles CRUD operations for subscriptions, including creating, retrieving, updating, 
 * cancelling, and formatting subscription data.
 * 
 * The user_subscriptions table tracks all user subscription records, including active, 
 * expired, and cancelled subscriptions, with references to the plans table for details
 * about the specific subscription tier.
 */

const knex = require('knex')(require('../../../../knexfile')[process.env.NODE_ENV || 'development']);
const logger = require('../../../shared/utils/logger');
const config = require('../../../shared/utils/config');
const path = require('path');
const fs = require('fs').promises;

class SubscriptionsDataAccess {
  constructor() {
    this.tableName = 'user_subscriptions';
    this.logger = logger;
  }

  /**
   * Get a user's active subscription
   * @param {string} userId - The user ID
   * @returns {Promise<Object|null>} - The active subscription or null if not found
   */
  async getUserActiveSubscription(userId) {
    try {
      this.logger.info('Fetching active subscription for user:', { userId });
      
      // Join with plans to get full subscription details
      const subscription = await knex(`${this.tableName} as us`)
        .join('plans as p', 'us.plan_id', 'p.plan_id')
        .select(
          'us.*',
          'p.plan_name',
          'p.billing_frequency',
          'p.monthly_price',
          'p.annual_price',
          'p.monthly_token_allocation',
          'p.video_quality',
          'p.max_scenes_per_job',
          'p.max_jobs_per_month',
          'p.allowed_content_types',
          'p.recreation_content_types',
          'p.support_level'
        )
        .where('us.user_id', userId)
        .where('us.status', 'active')
        .orderBy('us.created_at', 'desc')
        .first();
      
      if (!subscription) {
        this.logger.info('No active subscription found for user:', { userId });
        return null;
      }
      
      return this.formatSubscription(subscription);
    } catch (error) {
      this.logger.error('Error fetching user active subscription:', error);
      throw error;
    }
  }
  
  /**
   * Get all subscriptions for a user
   * @param {string} userId - The user ID
   * @returns {Promise<Array>} - List of all user subscriptions
   */
  async getUserSubscriptions(userId) {
    try {
      this.logger.info('Fetching all subscriptions for user:', { userId });
      
      // Join with plans to get full subscription details
      const subscriptions = await knex(`${this.tableName} as us`)
        .join('plans as p', 'us.plan_id', 'p.plan_id')
        .select(
          'us.*',
          'p.plan_name',
          'p.billing_frequency',
          'p.monthly_price',
          'p.annual_price',
          'p.monthly_token_allocation',
          'p.video_quality',
          'p.max_scenes_per_job',
          'p.max_jobs_per_month', 
          'p.allowed_content_types',
          'p.recreation_content_types',
          'p.support_level'
        )
        .where('us.user_id', userId)
        .orderBy('us.created_at', 'desc');
      
      return subscriptions.map(sub => this.formatSubscription(sub));
    } catch (error) {
      this.logger.error('Error fetching user subscriptions:', error);
      throw error;
    }
  }
  
  /**
   * Get a subscription by ID
   * @param {number} subscriptionId - The subscription ID
   * @returns {Promise<Object|null>} - The subscription or null if not found
   */
  async getSubscriptionById(subscriptionId) {
    try {
      this.logger.info('Fetching subscription by ID:', { subscriptionId });
      
      // Join with plans to get full subscription details
      const subscription = await knex(`${this.tableName} as us`)
        .join('plans as p', 'us.plan_id', 'p.plan_id')
        .select(
          'us.*',
          'p.plan_name',
          'p.billing_frequency',
          'p.monthly_price',
          'p.annual_price',
          'p.monthly_token_allocation',
          'p.video_quality',
          'p.max_scenes_per_job',
          'p.max_jobs_per_month',
          'p.allowed_content_types',
          'p.recreation_content_types',
          'p.support_level'
        )
        .where('us.subscription_id', subscriptionId)
        .first();
      
      if (!subscription) {
        this.logger.warn('Subscription not found:', { subscriptionId });
        return null;
      }
      
      return this.formatSubscription(subscription);
    } catch (error) {
      this.logger.error('Error fetching subscription by ID:', error);
      throw error;
    }
  }
  
  /**
   * Create a new subscription
   * @param {Object} subscriptionData - The subscription data
   * @returns {Promise<Object>} - The created subscription
   */
  async createSubscription(subscriptionData) {
    try {
      this.logger.info('Creating new subscription:', subscriptionData);
      
      // Set timestamps
      subscriptionData.created_at = knex.fn.now();
      subscriptionData.updated_at = knex.fn.now();
      
      // Insert the subscription
      const [newSubscription] = await knex(this.tableName)
        .insert(subscriptionData)
        .returning('*');
      
      this.logger.info('Subscription created successfully:', { 
        subscriptionId: newSubscription.subscription_id,
        userId: newSubscription.user_id,
        planId: newSubscription.plan_id
      });
      
      // Fetch the complete subscription with plan details
      return this.getSubscriptionById(newSubscription.subscription_id);
    } catch (error) {
      this.logger.error('Error creating subscription:', error);
      throw error;
    }
  }
  
  /**
   * Update a subscription
   * @param {number} subscriptionId - The subscription ID
   * @param {Object} subscriptionData - The updated subscription data
   * @returns {Promise<Object|null>} - The updated subscription or null if not found
   */
  async updateSubscription(subscriptionId, subscriptionData) {
    try {
      this.logger.info('Updating subscription:', { subscriptionId, subscriptionData });
      
      // Prevent updating the subscription_id
      delete subscriptionData.subscription_id;
      
      // Update the updated_at timestamp
      subscriptionData.updated_at = knex.fn.now();
      
      // Update the subscription
      const [updatedSubscription] = await knex(this.tableName)
        .where('subscription_id', subscriptionId)
        .update(subscriptionData)
        .returning('*');
      
      if (!updatedSubscription) {
        this.logger.warn('Subscription not found for update:', { subscriptionId });
        return null;
      }
      
      this.logger.info('Subscription updated successfully:', { 
        subscriptionId,
        userId: updatedSubscription.user_id,
        planId: updatedSubscription.plan_id 
      });
      
      // Fetch the complete subscription with plan details
      return this.getSubscriptionById(subscriptionId);
    } catch (error) {
      this.logger.error('Error updating subscription:', error);
      throw error;
    }
  }
  
  /**
   * Cancel a subscription
   * @param {number} subscriptionId - The subscription ID
   * @param {string} cancellationReason - The reason for cancellation
   * @returns {Promise<Object|null>} - The cancelled subscription or null if not found
   */
  async cancelSubscription(subscriptionId, cancellationReason = null) {
    try {
      this.logger.info('Cancelling subscription:', { subscriptionId, cancellationReason });
      
      // Update the subscription status
      const [cancelledSubscription] = await knex(this.tableName)
        .where('subscription_id', subscriptionId)
        .update({
          status: 'cancelled',
          cancellation_reason: cancellationReason,
          cancelled_at: knex.fn.now(),
          updated_at: knex.fn.now()
        })
        .returning('*');
      
      if (!cancelledSubscription) {
        this.logger.warn('Subscription not found for cancellation:', { subscriptionId });
        return null;
      }
      
      this.logger.info('Subscription cancelled successfully:', { 
        subscriptionId,
        userId: cancelledSubscription.user_id
      });
      
      // Fetch the complete subscription with plan details
      return this.getSubscriptionById(subscriptionId);
    } catch (error) {
      this.logger.error('Error cancelling subscription:', error);
      throw error;
    }
  }

  /**
   * Check if a user has an active subscription
   * @param {string} userId - The user ID
   * @returns {Promise<boolean>} - Whether the user has an active subscription
   */
  async hasActiveSubscription(userId) {
    try {
      this.logger.info('Checking if user has active subscription:', { userId });
      
      const subscription = await knex(this.tableName)
        .where('user_id', userId)
        .where('status', 'active')
        .first();
      
      return !!subscription;
    } catch (error) {
      this.logger.error('Error checking active subscription:', error);
      throw error;
    }
  }
  
  /**
   * Format subscription data by parsing JSON fields
   * @param {Object} subscription - The subscription data from the database
   * @returns {Object} - The formatted subscription data
   */
  formatSubscription(subscription) {
    if (!subscription) return null;
    
    const formattedSubscription = {
      ...subscription
    };
    
    // Parse JSON fields from the plan
    if (subscription.allowed_content_types) {
      try {
        formattedSubscription.allowed_content_types = JSON.parse(subscription.allowed_content_types);
      } catch (error) {
        this.logger.warn('Error parsing allowed_content_types JSON:', { 
          subscriptionId: subscription.subscription_id, 
          error: error.message 
        });
      }
    }
    
    if (subscription.recreation_content_types) {
      try {
        formattedSubscription.recreation_content_types = JSON.parse(subscription.recreation_content_types);
      } catch (error) {
        this.logger.warn('Error parsing recreation_content_types JSON:', { 
          subscriptionId: subscription.subscription_id, 
          error: error.message 
        });
      }
    }
    
    // Format dates
    formattedSubscription.created_at = subscription.created_at ? new Date(subscription.created_at).toISOString() : null;
    formattedSubscription.updated_at = subscription.updated_at ? new Date(subscription.updated_at).toISOString() : null;
    formattedSubscription.next_billing_date = subscription.next_billing_date ? new Date(subscription.next_billing_date).toISOString() : null;
    formattedSubscription.cancelled_at = subscription.cancelled_at ? new Date(subscription.cancelled_at).toISOString() : null;
    
    return formattedSubscription;
  }
}

module.exports = new SubscriptionsDataAccess(); 