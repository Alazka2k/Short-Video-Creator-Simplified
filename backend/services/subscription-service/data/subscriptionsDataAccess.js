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

// Import other data access modules
const plansDataAccess = require('./plansDataAccess');

class SubscriptionsDataAccess {
  constructor() {
    this.tableName = 'user_subscriptions';
    this.logger = logger;
    this.knex = knex; // Explicitly expose knex for transaction handling
    
    // Set up connections to other data access modules
    this.dataAccess = {
      plans: plansDataAccess
    };
  }

  /**
   * Format subscription data for API response
   * @param {Object} subscription - The subscription data from the database
   * @param {Object} plan - Optional plan data to include with the subscription
   * @returns {Object} - Formatted subscription
   */
  async formatSubscription(subscription, plan = null) {
    if (!subscription) return null;
    
    try {
      // Start with the original subscription data
      const formattedSubscription = {
        ...subscription
      };
      
      // Format dates
      formattedSubscription.start_date = subscription.start_date ? new Date(subscription.start_date).toISOString() : null;
      formattedSubscription.end_date = subscription.end_date ? new Date(subscription.end_date).toISOString() : null;
      formattedSubscription.current_period_start = subscription.current_period_start ? new Date(subscription.current_period_start).toISOString() : null;
      formattedSubscription.current_period_end = subscription.current_period_end ? new Date(subscription.current_period_end).toISOString() : null;
      formattedSubscription.canceled_at = subscription.canceled_at ? new Date(subscription.canceled_at).toISOString() : null;
      formattedSubscription.ended_at = subscription.ended_at ? new Date(subscription.ended_at).toISOString() : null;
      formattedSubscription.created_at = subscription.created_at ? new Date(subscription.created_at).toISOString() : null;
      formattedSubscription.updated_at = subscription.updated_at ? new Date(subscription.updated_at).toISOString() : null;
      
      // If we don't have plan data but have plan-related fields from a join, include them
      // Otherwise fetch plan data separately if not provided
      if (!plan && !subscription.plan_name && subscription.plan_id) {
        try {
          plan = await this.dataAccess.plans.getPlanById(subscription.plan_id);
        } catch (error) {
          this.logger.warn('Error fetching plan for subscription:', { 
            subscriptionId: subscription.subscription_id,
            error: error.message
          });
        }
      }
      
      // Include plan details if available
      if (plan) {
        formattedSubscription.plan = plan;
      } else if (subscription.plan_name) {
        // If we have plan data from a join, include it directly
        formattedSubscription.plan_name = subscription.plan_name;
        formattedSubscription.billing_frequency = subscription.billing_frequency;
        formattedSubscription.monthly_price = subscription.monthly_price;
        formattedSubscription.annual_price = subscription.annual_price;
        formattedSubscription.monthly_token_allocation = subscription.monthly_token_allocation;
        formattedSubscription.video_quality = subscription.video_quality;
        formattedSubscription.max_scenes_per_job = subscription.max_scenes_per_job;
        formattedSubscription.max_jobs_per_month = subscription.max_jobs_per_month;
        formattedSubscription.allowed_content_types = subscription.allowed_content_types;
        formattedSubscription.recreation_content_types = subscription.recreation_content_types;
        formattedSubscription.support_level = subscription.support_level;
      }
      
      return formattedSubscription;
    } catch (error) {
      this.logger.error('Error formatting subscription:', error);
      return subscription; // Return original in case of error
    }
  }

  /**
   * Get active subscription for a user
   * @param {string} userId - The user ID
   * @param {Object} trx - Optional Knex transaction object
   * @returns {Promise<Object|null>} - The active subscription or null if not found
   */
  async getUserActiveSubscription(userId, trx) {
    try {
      this.logger.info('Fetching active subscription for user:', { userId });
      
      // Determine which knex instance to use
      const query = trx ? trx(this.tableName) : knex(this.tableName);
      
      const subscription = await query
        .where({
          user_id: userId,
          status: 'active'
        })
        .orderBy('created_at', 'desc')
        .first();
      
      if (!subscription) {
        this.logger.info('No active subscription found for user:', { userId });
        return null;
      }
      
      // Get plan details
      const plan = await this.dataAccess.plans.getPlanById(subscription.plan_id);
      
      return this.formatSubscription(subscription, plan);
    } catch (error) {
      this.logger.error('Error fetching active subscription:', error);
      throw error;
    }
  }
  
  /**
   * Get all subscriptions for a user
   * @param {string} userId - The user ID
   * @returns {Promise<Array>} - List of subscriptions
   */
  async getUserSubscriptions(userId) {
    try {
      this.logger.info('Fetching subscriptions for user:', { userId });
      
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
      
      // Format each subscription
      const formattedSubscriptions = [];
      for (const subscription of subscriptions) {
        formattedSubscriptions.push(await this.formatSubscription(subscription));
      }
      
      return formattedSubscriptions;
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
      
      return await this.formatSubscription(subscription);
    } catch (error) {
      this.logger.error('Error fetching subscription by ID:', error);
      throw error;
    }
  }
  
  /**
   * Create a new subscription
   * @param {Object} subscriptionData - The subscription data
   * @param {Object} trx - Optional Knex transaction object
   * @returns {Promise<Object>} - The created subscription
   */
  async createSubscription(subscriptionData, trx) {
    try {
      this.logger.info('Creating new subscription:', subscriptionData);
      
      // Convert camelCase to snake_case for database
      const dbSubscriptionData = {
        user_id: subscriptionData.userId,
        plan_id: subscriptionData.planId,
        status: subscriptionData.status || 'active',
        start_date: subscriptionData.startDate || new Date(),
        // Only set end_date if explicitly provided
        end_date: subscriptionData.endDate || null,
        current_period_start: subscriptionData.currentPeriodStart || new Date(),
        current_period_end: subscriptionData.currentPeriodEnd || null,
        canceled_at: subscriptionData.canceledAt || null,
        ended_at: subscriptionData.endedAt || null,
        external_subscription_id: subscriptionData.externalSubscriptionId || null
      };
      
      // Set timestamps
      dbSubscriptionData.created_at = new Date();
      dbSubscriptionData.updated_at = new Date();
      
      // Ensure mandatory fields are present
      if (!dbSubscriptionData.user_id) {
        throw new Error("userId is required to create a subscription");
      }
      
      if (!dbSubscriptionData.plan_id) {
        throw new Error("planId is required to create a subscription");
      }
      
      // Calculate current_period_end based on plan if not provided
      if (!dbSubscriptionData.current_period_end && dbSubscriptionData.plan_id) {
        try {
          const plan = await this.dataAccess.plans.getPlanById(dbSubscriptionData.plan_id);
          if (plan) {
            const startDate = new Date(dbSubscriptionData.start_date);
            let periodEnd;
            
            if (plan.billing_frequency === 'monthly') {
              periodEnd = new Date(startDate);
              periodEnd.setMonth(periodEnd.getMonth() + 1);
            } else if (plan.billing_frequency === 'yearly') {
              periodEnd = new Date(startDate);
              periodEnd.setFullYear(periodEnd.getFullYear() + 1);
            }
            
            if (periodEnd) {
              dbSubscriptionData.current_period_end = periodEnd;
              // Note: We don't set end_date here - only current_period_end
            }
          }
        } catch (error) {
          this.logger.warn('Error calculating period end based on plan:', error);
        }
      }
      
      // Determine which knex instance to use
      const query = trx ? trx(this.tableName) : knex(this.tableName);
      
      // Insert the subscription
      const [newSubscription] = await query
        .insert(dbSubscriptionData)
        .returning('*');
      
      this.logger.info('Subscription created successfully:', { 
        subscriptionId: newSubscription.subscription_id,
        userId: newSubscription.user_id,
        planId: newSubscription.plan_id
      });
      
      // Get plan details
      let plan = null;
      try {
        plan = await this.dataAccess.plans.getPlanById(newSubscription.plan_id);
      } catch (planError) {
        this.logger.warn('Error fetching plan for new subscription:', planError);
      }
      
      return await this.formatSubscription(newSubscription, plan);
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
      
      // First, check if the subscription exists
      const existingSubscription = await knex(this.tableName)
        .where('subscription_id', subscriptionId)
        .first();
        
      if (!existingSubscription) {
        this.logger.error('Subscription not found for update:', { subscriptionId });
        return null;
      }
      
      // Prevent updating the subscription_id
      delete subscriptionData.subscriptionId;
      
      // Convert camelCase to snake_case for database
      const dbSubscriptionData = {};
      
      // Map camelCase props to snake_case columns, validating date fields
      // Only update user_id if it was explicitly provided and differs from the current value
      if (subscriptionData.userId !== undefined) {
        dbSubscriptionData.user_id = subscriptionData.userId;
      }
      
      if (subscriptionData.planId !== undefined) {
        dbSubscriptionData.plan_id = subscriptionData.planId;
      }
      
      if (subscriptionData.status !== undefined) {
        dbSubscriptionData.status = subscriptionData.status;
      }
      
      // Validate date fields before adding them to the update data
      if (subscriptionData.startDate !== undefined) {
        try {
          // Validate date format
          const startDate = new Date(subscriptionData.startDate);
          if (isNaN(startDate.getTime())) {
            throw new Error(`Invalid startDate format: ${subscriptionData.startDate}`);
          }
          dbSubscriptionData.start_date = startDate;
        } catch (error) {
          throw new Error(`Invalid startDate: ${error.message}`);
        }
      }
      
      if (subscriptionData.endDate !== undefined) {
        // Allow null for endDate
        if (subscriptionData.endDate === null) {
          dbSubscriptionData.end_date = null;
        } else {
          try {
            const endDate = new Date(subscriptionData.endDate);
            if (isNaN(endDate.getTime())) {
              throw new Error(`Invalid endDate format: ${subscriptionData.endDate}`);
            }
            dbSubscriptionData.end_date = endDate;
          } catch (error) {
            throw new Error(`Invalid endDate: ${error.message}`);
          }
        }
      }
      
      if (subscriptionData.currentPeriodStart !== undefined) {
        try {
          const currentPeriodStart = new Date(subscriptionData.currentPeriodStart);
          if (isNaN(currentPeriodStart.getTime())) {
            throw new Error(`Invalid currentPeriodStart format: ${subscriptionData.currentPeriodStart}`);
          }
          dbSubscriptionData.current_period_start = currentPeriodStart;
        } catch (error) {
          throw new Error(`Invalid currentPeriodStart: ${error.message}`);
        }
      }
      
      if (subscriptionData.currentPeriodEnd !== undefined) {
        try {
          const currentPeriodEnd = new Date(subscriptionData.currentPeriodEnd);
          if (isNaN(currentPeriodEnd.getTime())) {
            throw new Error(`Invalid currentPeriodEnd format: ${subscriptionData.currentPeriodEnd}`);
          }
          dbSubscriptionData.current_period_end = currentPeriodEnd;
        } catch (error) {
          throw new Error(`Invalid currentPeriodEnd: ${error.message}`);
        }
      }
      
      if (subscriptionData.canceledAt !== undefined) {
        // Allow null for canceledAt
        if (subscriptionData.canceledAt === null) {
          dbSubscriptionData.canceled_at = null;
        } else {
          try {
            const canceledAt = new Date(subscriptionData.canceledAt);
            if (isNaN(canceledAt.getTime())) {
              throw new Error(`Invalid canceledAt format: ${subscriptionData.canceledAt}`);
            }
            dbSubscriptionData.canceled_at = canceledAt;
          } catch (error) {
            throw new Error(`Invalid canceledAt: ${error.message}`);
          }
        }
      }
      
      if (subscriptionData.endedAt !== undefined) {
        // Allow null for endedAt
        if (subscriptionData.endedAt === null) {
          dbSubscriptionData.ended_at = null;
        } else {
          try {
            const endedAt = new Date(subscriptionData.endedAt);
            if (isNaN(endedAt.getTime())) {
              throw new Error(`Invalid endedAt format: ${subscriptionData.endedAt}`);
            }
            dbSubscriptionData.ended_at = endedAt;
          } catch (error) {
            throw new Error(`Invalid endedAt: ${error.message}`);
          }
        }
      }
      
      if (subscriptionData.externalSubscriptionId !== undefined) {
        dbSubscriptionData.external_subscription_id = subscriptionData.externalSubscriptionId;
      }
      
      // Only update if there's data to update
      if (Object.keys(dbSubscriptionData).length === 0) {
        this.logger.info('No changes to update for subscription:', { subscriptionId });
        return this.getSubscriptionById(subscriptionId);
      }
      
      // Update the updated_at timestamp
      dbSubscriptionData.updated_at = knex.fn.now();
      
      // Update the subscription
      const [updatedSubscription] = await knex(this.tableName)
        .where('subscription_id', subscriptionId)
        .update(dbSubscriptionData)
        .returning('*');
      
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
   * @param {string} cancellationReason - Optional reason for cancellation (stored in logs only)
   * @param {Object} trx - Optional Knex transaction object
   * @returns {Promise<Object|null>} - The cancelled subscription or null if not found
   */
  async cancelSubscription(subscriptionId, cancellationReason = null, trx) {
    try {
      this.logger.info('Cancelling subscription:', { 
        subscriptionId, 
        cancellationReason,
        statusValue: 'cancelled' // Log the status value we're using
      });
      
      // Log the cancellation reason
      if (cancellationReason) {
        this.logger.info('Cancellation reason:', { subscriptionId, reason: cancellationReason });
      }
      
      // Determine which knex instance to use
      const query = trx ? trx(this.tableName) : knex(this.tableName);
      
      // Update the subscription status - using 'cancelled' with two 'l's consistently
      const [cancelledSubscription] = await query
        .where('subscription_id', subscriptionId)
        .update({
          status: 'cancelled', // Using 'cancelled' with two 'l's consistently
          canceled_at: new Date(),
          updated_at: new Date(),
          cancellation_reason: cancellationReason
        })
        .returning('*');
      
      if (!cancelledSubscription) {
        this.logger.warn('Subscription not found for cancellation:', { subscriptionId });
        return null;
      }
      
      this.logger.info('Subscription cancelled successfully:', { 
        subscriptionId,
        userId: cancelledSubscription.user_id,
        status: cancelledSubscription.status
      });
      
      // Get plan details
      let plan = null;
      if (trx) {
        try {
          plan = await this.dataAccess.plans.getPlanById(cancelledSubscription.plan_id);
        } catch (planError) {
          this.logger.warn('Error fetching plan for cancelled subscription:', planError);
        }
        
        return await this.formatSubscription(cancelledSubscription, plan);
      }
      
      return await this.getSubscriptionById(subscriptionId);
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
}

module.exports = new SubscriptionsDataAccess(); 