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
   * @param {string} status - Optional filter by status (e.g., 'active', 'cancelled')
   * @returns {Promise<Array>} - List of subscriptions
   */
  async getUserSubscriptions(userId, status = null) {
    try {
      this.logger.info('Fetching subscriptions for user:', { userId, status });
      
      // Build the base query
      let query = knex(`${this.tableName} as us`)
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
        .where('us.user_id', userId);
      
      // Apply status filter if provided
      if (status) {
        query = query.where('us.status', status);
      }
      
      // Get the results
      const subscriptions = await query.orderBy('us.created_at', 'desc');
      
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
        // Only set end_date if explicitly provided in subscriptionData
        end_date: subscriptionData.endDate || null,
        // Initialize current_period_start to start_date if not provided
        current_period_start: subscriptionData.currentPeriodStart || subscriptionData.startDate || new Date(),
        // Initialize current_period_end as null, we'll calculate it below if not provided
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
            const startDate = new Date(dbSubscriptionData.current_period_start);
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
              // IMPORTANT: We do NOT set end_date here - only current_period_end
            }
          }
        } catch (error) {
          this.logger.warn('Error calculating period end based on plan:', error);
        }
      }
      
      // Create a clean version of the data for logging (without complex objects)
      const logData = { ...dbSubscriptionData };
      
      // Safely convert dates to strings for logging
      const formatDateForLog = (date) => {
        if (!date) return null;
        if (date instanceof Date) return date.toISOString();
        if (date === knex.fn.now()) return 'CURRENT_TIMESTAMP';
        if (typeof date === 'string') return date;
        return String(date); // Fallback for any other type
      };
      
      // Apply the safe formatting to all date fields
      if (logData.created_at) logData.created_at = formatDateForLog(logData.created_at);
      if (logData.updated_at) logData.updated_at = formatDateForLog(logData.updated_at);
      if (logData.start_date) logData.start_date = formatDateForLog(logData.start_date);
      if (logData.end_date) logData.end_date = formatDateForLog(logData.end_date);
      if (logData.current_period_start) logData.current_period_start = formatDateForLog(logData.current_period_start);
      if (logData.current_period_end) logData.current_period_end = formatDateForLog(logData.current_period_end);
      if (logData.canceled_at) logData.canceled_at = formatDateForLog(logData.canceled_at);
      if (logData.ended_at) logData.ended_at = formatDateForLog(logData.ended_at);
      
      this.logger.info('Creating subscription with data:', { dbSubscriptionData: logData });
      
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
      
      // Map camelCase AND snake_case props to snake_case columns, validating date fields
      
      // Handle user_id (both formats)
      if (subscriptionData.userId !== undefined) {
        dbSubscriptionData.user_id = subscriptionData.userId;
      } else if (subscriptionData.user_id !== undefined) {
        dbSubscriptionData.user_id = subscriptionData.user_id;
      }
      
      // Handle plan_id (both formats)
      if (subscriptionData.planId !== undefined) {
        dbSubscriptionData.plan_id = subscriptionData.planId;
      } else if (subscriptionData.plan_id !== undefined) {
        dbSubscriptionData.plan_id = subscriptionData.plan_id;
      }
      
      // Handle status (both formats)
      if (subscriptionData.status !== undefined) {
        dbSubscriptionData.status = subscriptionData.status;
      }
      
      // Handle external_subscription_id (both formats)
      if (subscriptionData.externalSubscriptionId !== undefined) {
        dbSubscriptionData.external_subscription_id = subscriptionData.externalSubscriptionId;
      } else if (subscriptionData.external_subscription_id !== undefined) {
        dbSubscriptionData.external_subscription_id = subscriptionData.external_subscription_id;
      }
      
      // Handle billing_frequency (both formats)
      if (subscriptionData.billingFrequency !== undefined) {
        dbSubscriptionData.billing_frequency = subscriptionData.billingFrequency;
      } else if (subscriptionData.billing_frequency !== undefined) {
        dbSubscriptionData.billing_frequency = subscriptionData.billing_frequency;
      }
      
      // Handle auto_renew (both formats)
      if (subscriptionData.autoRenew !== undefined) {
        dbSubscriptionData.auto_renew = subscriptionData.autoRenew;
      } else if (subscriptionData.auto_renew !== undefined) {
        dbSubscriptionData.auto_renew = subscriptionData.auto_renew;
      }
      
      // Handle cancellation_reason (both formats)
      if (subscriptionData.cancellationReason !== undefined) {
        dbSubscriptionData.cancellation_reason = subscriptionData.cancellationReason;
      } else if (subscriptionData.cancellation_reason !== undefined) {
        dbSubscriptionData.cancellation_reason = subscriptionData.cancellation_reason;
      }
      
      // Validate date fields before adding them to the update data - handle both camelCase and snake_case
      
      // Handle start_date (both formats)
      const startDate = subscriptionData.startDate || subscriptionData.start_date;
      if (startDate !== undefined) {
        try {
          // Validate date format
          const dateObj = new Date(startDate);
          if (isNaN(dateObj.getTime())) {
            throw new Error(`Invalid start date format: ${startDate}`);
          }
          dbSubscriptionData.start_date = dateObj;
        } catch (error) {
          throw new Error(`Invalid start date: ${error.message}`);
        }
      }
      
      // Handle end_date (both formats) - Only set if explicitly provided
      const endDate = subscriptionData.endDate || subscriptionData.end_date;
      if (endDate !== undefined) {
        // Allow null for endDate
        if (endDate === null) {
          dbSubscriptionData.end_date = null;
        } else {
          try {
            const dateObj = new Date(endDate);
            if (isNaN(dateObj.getTime())) {
              throw new Error(`Invalid end date format: ${endDate}`);
            }
            dbSubscriptionData.end_date = dateObj;
          } catch (error) {
            throw new Error(`Invalid end date: ${error.message}`);
          }
        }
      }
      // Important: Don't touch end_date if not explicitly provided
      
      // Handle current_period_start (both formats)
      const currentPeriodStart = subscriptionData.currentPeriodStart || subscriptionData.current_period_start;
      if (currentPeriodStart !== undefined) {
        try {
          const dateObj = new Date(currentPeriodStart);
          if (isNaN(dateObj.getTime())) {
            throw new Error(`Invalid current period start format: ${currentPeriodStart}`);
          }
          dbSubscriptionData.current_period_start = dateObj;
        } catch (error) {
          throw new Error(`Invalid current period start: ${error.message}`);
        }
      }
      
      // Handle current_period_end (both formats)
      const currentPeriodEnd = subscriptionData.currentPeriodEnd || subscriptionData.current_period_end;
      if (currentPeriodEnd !== undefined) {
        try {
          const dateObj = new Date(currentPeriodEnd);
          if (isNaN(dateObj.getTime())) {
            throw new Error(`Invalid current period end format: ${currentPeriodEnd}`);
          }
          dbSubscriptionData.current_period_end = dateObj;
        } catch (error) {
          throw new Error(`Invalid current period end: ${error.message}`);
        }
      }
      
      // Handle canceled_at (both formats)
      const canceledAt = subscriptionData.canceledAt || subscriptionData.canceled_at;
      if (canceledAt !== undefined) {
        // Allow null for canceledAt
        if (canceledAt === null) {
          dbSubscriptionData.canceled_at = null;
        } else {
          try {
            const dateObj = new Date(canceledAt);
            if (isNaN(dateObj.getTime())) {
              throw new Error(`Invalid canceled at format: ${canceledAt}`);
            }
            dbSubscriptionData.canceled_at = dateObj;
          } catch (error) {
            throw new Error(`Invalid canceled at: ${error.message}`);
          }
        }
      }
      
      // Handle ended_at (both formats)
      const endedAt = subscriptionData.endedAt || subscriptionData.ended_at;
      if (endedAt !== undefined) {
        // Allow null for endedAt
        if (endedAt === null) {
          dbSubscriptionData.ended_at = null;
        } else {
          try {
            const dateObj = new Date(endedAt);
            if (isNaN(dateObj.getTime())) {
              throw new Error(`Invalid ended at format: ${endedAt}`);
            }
            dbSubscriptionData.ended_at = dateObj;
          } catch (error) {
            throw new Error(`Invalid ended at: ${error.message}`);
          }
        }
      }
      
      // Only update if there's data to update
      if (Object.keys(dbSubscriptionData).length === 0) {
        this.logger.info('No changes to update for subscription:', { subscriptionId });
        return this.getSubscriptionById(subscriptionId);
      }
      
      // Update the updated_at timestamp
      dbSubscriptionData.updated_at = knex.fn.now();
      
      // Create a clean version of the data for logging (without the knex function objects)
      const logData = { ...dbSubscriptionData };
      
      // Safely convert dates to strings for logging
      const formatDateForLog = (date) => {
        if (!date) return null;
        if (date instanceof Date) return date.toISOString();
        if (date === knex.fn.now()) return 'CURRENT_TIMESTAMP';
        if (typeof date === 'string') return date;
        return String(date); // Fallback for any other type
      };
      
      // Format all date fields for logging
      if (logData.start_date) logData.start_date = formatDateForLog(logData.start_date);
      if (logData.end_date) logData.end_date = formatDateForLog(logData.end_date);
      if (logData.current_period_start) logData.current_period_start = formatDateForLog(logData.current_period_start);
      if (logData.current_period_end) logData.current_period_end = formatDateForLog(logData.current_period_end);
      if (logData.canceled_at) logData.canceled_at = formatDateForLog(logData.canceled_at);
      if (logData.ended_at) logData.ended_at = formatDateForLog(logData.ended_at);
      if (logData.updated_at) logData.updated_at = formatDateForLog(logData.updated_at);
      
      // Log the actual data being sent to the database
      this.logger.info('Performing subscription update with data:', { 
        subscriptionId, 
        dbSubscriptionData: logData 
      });
      
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
   * @param {string} subscriptionId - The subscription ID
   * @param {string} cancellationReason - Reason for cancellation (should use standardized values like CANCEL_PAID_PLAN)
   * @param {number|null} upcomingPlanId - The plan ID to switch to after cancellation (for downgrades or frequency changes)
   * @param {Object} trx - Optional Knex transaction object
   * @returns {Promise<Object|null>} - The cancelled/pending cancellation subscription or null if not found
   */
  async cancelSubscription(subscriptionId, cancellationReason = null, upcomingPlanId = null, trx) {
    try {
      this.logger.info('Processing subscription cancellation:', { 
        subscriptionId, 
        cancellationReason,
        upcomingPlanId
      });
      
      // Log the cancellation reason
      if (cancellationReason) {
        this.logger.info('Cancellation reason:', { subscriptionId, reason: cancellationReason });
      }
      
      // Determine which knex instance to use
      const query = trx || knex;
      
      // First, get the current subscription to check its details
      const subscription = await query(this.tableName)
        .where('subscription_id', subscriptionId)
        .first();
      
      if (!subscription) {
        this.logger.warn('Subscription not found for cancellation:', { subscriptionId });
        return null;
      }

      // Add validation to prevent cancellation of free tier (even though service layer should catch this)
      // The only exception is CANCEL_FOR_UPGRADE, which is allowed to cancel free tier
      if (subscription.plan_id === 1 && cancellationReason !== 'CANCEL_FOR_UPGRADE') {
        this.logger.warn('Attempt to cancel free tier subscription rejected:', { 
          subscriptionId,
          planId: subscription.plan_id,
          reason: cancellationReason
        });
        throw new Error('Free tier subscriptions cannot be cancelled except for upgrades');
      }
      
      // Determine whether to use immediate cancellation or pending cancellation
      // based on the cancellation reason

      // Cancellation scenarios:
      // 1. CANCEL_FOR_UPGRADE: Immediate cancellation for upgrading to a higher tier plan
      // 2. CANCEL_FOR_DOWNGRADE: Immediate cancellation only for free tier, otherwise pending
      // 3. CANCEL_PAID_PLAN: Always pending cancellation, will downgrade to free tier
      // 4. CANCEL_FOR_FREQUENCY_CHANGE: Always pending cancellation, same tier but different billing frequency
      
      const isImmediateCancellation = 
        cancellationReason === 'CANCEL_FOR_UPGRADE' || 
        (cancellationReason === 'CANCEL_FOR_DOWNGRADE' && subscription.plan_id === 1) ||
        subscription.plan_id === 1; // Free tier subscriptions should always be immediately cancelled
      
      const targetStatus = isImmediateCancellation ? 'cancelled' : 'pending_cancellation';
      
      this.logger.info(`Setting subscription status to ${targetStatus}:`, {
        subscriptionId,
        reason: cancellationReason,
        planId: subscription.plan_id,
        immediate: isImmediateCancellation
      });
      
      // Determine the appropriate end_date based on context
      // Special case for plan upgrades/downgrades/frequency changes or certain cancellation reasons
      const isPlanChange = cancellationReason && (
        cancellationReason === 'CANCEL_FOR_UPGRADE' || 
        cancellationReason === 'CANCEL_FOR_DOWNGRADE' ||
        cancellationReason === 'CANCEL_FOR_FREQUENCY_CHANGE'
      );
      
      let endDate = null;
      
      // For plan changes, we keep the existing end_date as is, or set it to current period end as fallback
      if (isPlanChange) {
        this.logger.info('Plan change detected, using current period end as fallback:', {
          subscriptionId,
          cancellationReason
        });
        
        // Use the current period end as the default end date
        endDate = subscription.current_period_end;
      } else {
        // For regular cancellations, try to get the billing period end from payments table
        // but set end date to now if no payment is found (immediate cancellation)
        const paymentTableName = 'payments';
        
        try {
          // Try to get the latest payment with billing period information
          const latestPayment = await query(paymentTableName)
            .where('subscription_id', subscriptionId)
            .orderBy('created_at', 'desc')
            .first();
            
          if (latestPayment && latestPayment.billing_period_end) {
            this.logger.info('Using latest payment billing period end as subscription end date:', {
              subscriptionId,
              paymentId: latestPayment.payment_id,
              billingPeriodEnd: latestPayment.billing_period_end
            });
            
            endDate = latestPayment.billing_period_end;
          } else {
            // No payment found or no billing period end - for paid plans, end immediately
            const now = new Date();
            this.logger.info('No payment found for paid plan, cancelling immediately:', {
              subscriptionId,
              endDate: now.toISOString()
            });
            endDate = now;
          }
        } catch (error) {
          // Any error with payments table access, cancel immediately
          const now = new Date();
          this.logger.warn('Error accessing payment records, cancelling immediately:', { 
            subscriptionId, 
            error: error.message,
            endDate: now.toISOString()
          });
          
          // Set end date to now for immediate cancellation
          endDate = now;
        }
      }
      
      // Prepare update data - always include cancellation_reason even if null
      const updateData = {
        status: targetStatus, // 'cancelled' or 'pending_cancellation'
        canceled_at: new Date(),
        updated_at: knex.fn.now(),
        cancellation_reason: cancellationReason, // Use standardized reason values
        upcoming_plan_id: upcomingPlanId // Store the upcoming plan ID for pending cancellations
      };
      
      // Set ended_at date ONLY when the status is being changed to 'cancelled'
      // (not for pending_cancellation status)
      if (targetStatus === 'cancelled') {
        updateData.ended_at = new Date();
        this.logger.info('Setting ended_at date for cancelled subscription:', {
          subscriptionId,
          endedAt: updateData.ended_at.toISOString()
        });
      }
      
      // Only set end_date if we have a valid value
      if (endDate) {
        updateData.end_date = endDate;
      }
      
      // Create a clean copy for logging
      const logData = {...updateData};
      
      // Safely convert dates to strings for logging
      const formatDateForLog = (date) => {
        if (!date) return null;
        if (date instanceof Date) return date.toISOString();
        if (date === knex.fn.now()) return 'CURRENT_TIMESTAMP';
        if (typeof date === 'string') return date;
        return String(date); // Fallback for any other type
      };
      
      // Format date fields for logging
      if (logData.updated_at) logData.updated_at = formatDateForLog(logData.updated_at);
      if (logData.canceled_at) logData.canceled_at = formatDateForLog(logData.canceled_at);
      if (logData.end_date) logData.end_date = formatDateForLog(logData.end_date);
      if (logData.ended_at) logData.ended_at = formatDateForLog(logData.ended_at);
      
      // Log what we're updating
      this.logger.info('Updating subscription with:', logData);
      
      // Update the subscription status
      const [updatedSubscription] = await query(this.tableName)
        .where('subscription_id', subscriptionId)
        .update(updateData)
        .returning('*');
      
      if (!updatedSubscription) {
        this.logger.warn('Subscription update failed during cancellation:', { subscriptionId });
        return null;
      }
      
      this.logger.info('Subscription status updated successfully:', { 
        subscriptionId,
        userId: updatedSubscription.user_id,
        status: updatedSubscription.status,
        endDate: updatedSubscription.end_date,
        cancellationReason: updatedSubscription.cancellation_reason,
        upcomingPlanId: updatedSubscription.upcoming_plan_id
      });
      
      // Get plan details
      let plan = null;
      if (trx) {
        try {
          plan = await this.dataAccess.plans.getPlanById(updatedSubscription.plan_id);
        } catch (planError) {
          this.logger.warn('Error fetching plan for updated subscription:', planError);
        }
        
        return await this.formatSubscription(updatedSubscription, plan);
      }
      
      return await this.getSubscriptionById(subscriptionId);
    } catch (error) {
      this.logger.error('Error updating subscription status:', error);
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