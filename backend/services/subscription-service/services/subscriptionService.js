/**
 * Subscription Service
 * 
 * This service handles core subscription functionality including:
 * - Creating subscriptions
 * - Updating subscriptions
 * - Canceling subscriptions
 * - Retrieving subscription information
 */

const logger = require('../../../shared/utils/logger');

// Standardized cancellation reasons
const CANCELLATION_REASONS = {
  CANCEL_PAID_PLAN: 'CANCEL_PAID_PLAN',
  CANCEL_FOR_UPGRADE: 'CANCEL_FOR_UPGRADE',
  CANCEL_FOR_DOWNGRADE: 'CANCEL_FOR_DOWNGRADE',
  CANCEL_FOR_FREQUENCY_CHANGE: 'CANCEL_FOR_FREQUENCY_CHANGE'
};

class SubscriptionService {
  constructor(dataAccess) {
    this.dataAccess = dataAccess;
    logger.info('SubscriptionService initialized');
  }

  /**
   * Get all subscriptions for a user
   * @param {string} userId - The user ID
   * @param {string} status - Optional filter by status
   * @returns {Promise<Array>} - List of user subscriptions
   */
  async getUserSubscriptions(userId, status = null) {
    try {
      logger.info('Getting user subscriptions:', { userId, status });
      
      if (!userId) {
        logger.warn('Invalid userId provided to getUserSubscriptions');
        throw new Error('User ID is required');
      }
      
      return await this.dataAccess.subscriptions.getUserSubscriptions(userId, status);
    } catch (error) {
      logger.error('Error in getUserSubscriptions:', error);
      throw error;
    }
  }

  /**
   * Get the active subscription for a user
   * @param {string} userId - The user ID
   * @returns {Promise<Object>} - The active subscription or null
   */
  async getUserActiveSubscription(userId) {
    try {
      logger.info('Getting active subscription for user:', { userId });
      
      if (!userId) {
        logger.warn('Invalid userId provided to getUserActiveSubscription');
        throw new Error('User ID is required');
      }
      
      return await this.dataAccess.subscriptions.getUserActiveSubscription(userId);
    } catch (error) {
      logger.error('Error in getUserActiveSubscription:', error);
      throw error;
    }
  }

  /**
   * Get a subscription by ID
   * @param {string} subscriptionId - The subscription ID
   * @returns {Promise<Object>} - The subscription or null
   */
  async getSubscriptionById(subscriptionId) {
    try {
      return await this.dataAccess.subscriptions.getSubscriptionById(subscriptionId);
    } catch (error) {
      logger.error('Error in getSubscriptionById:', error);
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
      logger.info('Creating subscription:', subscriptionData);
  
      // Validate required fields
      if (!subscriptionData.userId) {
        throw new Error('userId is required');
      }
      
      if (!subscriptionData.planId) {
        throw new Error('planId is required');
      }
      
      // Get the new plan details to determine the tier
      const newPlan = await this.dataAccess.plans.getPlanById(subscriptionData.planId);
      if (!newPlan) {
        throw new Error(`Plan not found: ${subscriptionData.planId}`);
      }
      
      // Check if user already has an active subscription
      let existingSubscription = null;
      try {
        existingSubscription = await this.dataAccess.subscriptions.getUserActiveSubscription(subscriptionData.userId);
      } catch (error) {
        logger.warn('Error checking for existing subscription, continuing:', error);
      }
      
      // Handle existing subscription case
      if (existingSubscription) {
        logger.warn('User already has an active subscription:', { 
          userId: subscriptionData.userId,
          existingSubscriptionId: existingSubscription.subscription_id
        });
        
        // If user already has the same plan, don't allow duplicate
        if (existingSubscription.plan_id == subscriptionData.planId) {
          throw new Error(`User already has an active subscription with this plan (ID: ${existingSubscription.subscription_id})`);
        }
        
        // Get existing plan to compare tiers
        const existingPlan = await this.dataAccess.plans.getPlanById(existingSubscription.plan_id);
        if (!existingPlan) {
          logger.warn(`Could not find plan information for existing subscription plan: ${existingSubscription.plan_id}`);
          // Continue anyway as we'll default to upgrade behavior
        }
        
        let comparison = null;
        if (existingPlan) {
          // Compare plans to determine what kind of change this is
          comparison = this.comparePlans(existingPlan, newPlan);
          logger.info('Plan comparison for subscription change:', comparison);
        }
        
        // Prevent downgrading from free tier (plan_id=1)
        if (existingSubscription.plan_id === 1 && comparison && comparison.isDowngrade) {
          throw new Error('Free tier subscriptions cannot be downgraded');
        }
        
        // Handle different plan change scenarios
        // 1. Tier Upgrade: Cancel immediately and create new subscription
        // 2. Tier Downgrade: Set to pending_cancellation until billing period ends
        // 3. Frequency Change (Same Tier): Set to pending_cancellation with upcoming plan ID
        
        let cancellationReason;
        let upcomingPlanId = null;
        let shouldCreateNewNow = false;
        
        if (comparison && comparison.isUpgrade) {
          // Case 1: Tier Upgrade
          cancellationReason = CANCELLATION_REASONS.CANCEL_FOR_UPGRADE;
          shouldCreateNewNow = true;
          logger.info('Processing tier upgrade from existing subscription');
        } else if (comparison && comparison.isDowngrade) {
          // Case 2: Tier Downgrade
          cancellationReason = CANCELLATION_REASONS.CANCEL_FOR_DOWNGRADE;
          upcomingPlanId = parseInt(subscriptionData.planId);
          shouldCreateNewNow = false;
          logger.info('Processing tier downgrade from existing subscription');
        } else if (comparison && comparison.isFrequencyChange) {
          // Case 3: Frequency Change (Same Tier)
          cancellationReason = CANCELLATION_REASONS.CANCEL_FOR_FREQUENCY_CHANGE;
          upcomingPlanId = parseInt(subscriptionData.planId);
          shouldCreateNewNow = false;
          logger.info('Processing frequency change from existing subscription');
        } else {
          // Default case (fallback) - treat as upgrade
          cancellationReason = 'Subscription plan change';
          shouldCreateNewNow = true;
          logger.info('Processing subscription change (default to upgrade behavior)');
        }
        
        try {
          // Cancel or mark for pending cancellation the existing subscription
          await this.dataAccess.subscriptions.cancelSubscription(
            existingSubscription.subscription_id, 
            cancellationReason,
            upcomingPlanId,
          );
          
          logger.info('Processed existing subscription for plan change:', {
            subscriptionId: existingSubscription.subscription_id,
            cancellationReason,
            upcomingPlanId,
            shouldCreateNewNow
          });
          
          // If it's a downgrade or frequency change, we need to return the updated subscription
          // without creating a new one yet (it will be created when the period ends)
          if (!shouldCreateNewNow) {
            const updatedSubscription = await this.dataAccess.subscriptions.getSubscriptionById(
              existingSubscription.subscription_id
            );
            
            return {
              ...updatedSubscription,
              message: "Subscription change scheduled for end of billing period"
            };
          }
          
          // For upgrades, continue with creating new subscription below
          
        } catch (cancellationError) {
          // If cancellation failed, we'll log but continue with creating the new subscription
          logger.warn('Error processing existing subscription, continuing with new subscription:', { 
            error: cancellationError.message, 
            subscriptionId: existingSubscription.subscription_id 
          });
          
          // For critical errors that should prevent continuing, they'll be thrown from cancelSubscription
          // and propagated up, so if we got here, we'll just continue with creation
        }
      }
      
      // Only continue with creating a new subscription for new subscriptions or upgrades
      
      // Format the subscription data for creation
      const formattedSubscriptionData = {
        userId: subscriptionData.userId,
        planId: subscriptionData.planId,
        status: 'active',
        startDate: subscriptionData.startDate || new Date(),
        billingFrequency: subscriptionData.billingFrequency || 'monthly',
        externalSubscriptionId: subscriptionData.externalSubscriptionId || null
      };
      
      // If end date is explicitly provided, use it
      // Otherwise, do NOT set an end date, as most subscriptions continue until cancelled
      if (subscriptionData.endDate) {
        formattedSubscriptionData.endDate = subscriptionData.endDate;
      }
      
      // Set current period start to the start date if not provided
      formattedSubscriptionData.currentPeriodStart = subscriptionData.currentPeriodStart || formattedSubscriptionData.startDate;
      
      // current_period_end will be calculated by the data access layer based on the plan's billing frequency
      
      // Begin transaction
      logger.info('Starting transaction for subscription creation');
      const knex = this.dataAccess.subscriptions.knex;
      const result = await knex.transaction(async (trx) => {
        // Create the subscription
        const subscription = await this.dataAccess.subscriptions.createSubscription(formattedSubscriptionData, trx);
        
        // Get the plan to determine token allocation
        const plan = await this.dataAccess.plans.getPlanById(subscriptionData.planId);
        
        if (!plan) {
          throw new Error(`Plan not found: ${subscriptionData.planId}`);
        }
        
        logger.info('Plan found:', plan);
        
        // Allocate tokens based on the plan
        if (plan.monthly_token_allocation > 0) {
          await this.dataAccess.tokenTransactions.allocateSubscriptionTokens(
            subscriptionData.userId,
            subscription.subscription_id,
            plan.monthly_token_allocation,
            `Initial token allocation for ${plan.plan_name} subscription`,
            null,
            trx
          );
          
          logger.info('Tokens allocated:', {
            userId: subscriptionData.userId,
            subscriptionId: subscription.subscription_id,
            tokenAmount: plan.monthly_token_allocation
          });
        }
        
        // If payment details provided, create payment record
        if (subscriptionData.paymentProvider && subscriptionData.externalPaymentId) {
          try {
            // Get plan for correct billing period calculation
            const plan = await this.dataAccess.plans.getPlanById(subscriptionData.planId);
            if (!plan) {
              throw new Error(`Plan not found: ${subscriptionData.planId}`);
            }
            
            // Use the subscription's current period for the billing period
            // This ensures the payment record properly reflects the subscription period
            const billingPeriod = {
              start: subscription.current_period_start 
                ? new Date(subscription.current_period_start) 
                : new Date(subscription.start_date),
              end: subscription.current_period_end 
                ? new Date(subscription.current_period_end) 
                : null
            };
            
            // If we don't have current_period_end, calculate it based on the plan
            if (!billingPeriod.end) {
              const startDate = new Date(billingPeriod.start);
              if (plan.billing_frequency === 'monthly') {
                billingPeriod.end = new Date(startDate);
                billingPeriod.end.setMonth(billingPeriod.end.getMonth() + 1);
              } else if (plan.billing_frequency === 'yearly') {
                billingPeriod.end = new Date(startDate);
                billingPeriod.end.setFullYear(billingPeriod.end.getFullYear() + 1);
              }
            }
            
            // Determine payment amount from plan if not explicitly provided
            let paymentAmount = subscriptionData.amount;
            if (paymentAmount === undefined || paymentAmount === null) {
              if (plan.billing_frequency === 'yearly') {
                paymentAmount = plan.annual_price || (plan.monthly_price * 12);
              } else {
                paymentAmount = plan.monthly_price;
              }
              logger.info('Using plan price for payment amount:', {
                planId: plan.plan_id,
                amount: paymentAmount,
                billingFrequency: plan.billing_frequency
              });
            }
            
            logger.info('Creating payment record with billing period:', { 
              subscriptionId: subscription.subscription_id,
              billingPeriodStart: billingPeriod.start,
              billingPeriodEnd: billingPeriod.end
            });
            
            // Create the payment record
            const payment = await this.dataAccess.payments.createSubscriptionPayment(
              subscriptionData.userId,
              subscription.subscription_id,
              subscriptionData.planId,
              paymentAmount,
              subscriptionData.paymentProvider,
              subscriptionData.externalPaymentId,
              'subscription_initial',
              billingPeriod,
              trx
            );
            
            logger.info('Payment record created:', {
              paymentId: payment.payment_id,
              amount: payment.amount,
              billingPeriodStart: payment.billing_period_start,
              billingPeriodEnd: payment.billing_period_end
            });
          } catch (error) {
            logger.error('Error creating payment record:', error);
            // We don't throw here to prevent the entire subscription creation from failing
          }
        }
        
        return subscription;
      });
      
      logger.info('Subscription created successfully:', result);
      return result;
    } catch (error) {
      logger.error('Error in createSubscription:', error);
      throw error;
    }
  }

  /**
   * Update an existing subscription
   * @param {string} subscriptionId - The subscription ID
   * @param {Object} subscriptionData - The updated subscription data
   * @returns {Promise<Object>} - The updated subscription
   */
  async updateSubscription(subscriptionId, subscriptionData) {
    try {
      logger.info('Updating subscription:', { subscriptionId, subscriptionData });
      
      // Get current subscription
      const existingSubscription = await this.dataAccess.subscriptions.getSubscriptionById(subscriptionId);
      
      if (!existingSubscription) {
        logger.warn(`Subscription not found: ${subscriptionId}`);
        throw new Error(`Subscription not found: ${subscriptionId}`);
      }
      
      // Check if updating to a new plan
      const planChanged = subscriptionData.planId && 
                         existingSubscription.plan_id !== parseInt(subscriptionData.planId);
      
      if (planChanged) {
        logger.info('Plan change detected:', {
          oldPlanId: existingSubscription.plan_id,
          newPlanId: subscriptionData.planId
        });
        
        // Get the new plan
        const newPlan = await this.dataAccess.plans.getPlanById(subscriptionData.planId);
        
        if (!newPlan) {
          throw new Error(`New plan not found: ${subscriptionData.planId}`);
        }
        
        // Prepare for transaction to ensure atomic operation
        const knex = this.dataAccess.subscriptions.knex;
        return await knex.transaction(async (trx) => {
          // Update the subscription - use camelCase property names consistently
          const updatedSubscription = await this.dataAccess.subscriptions.updateSubscription(
            subscriptionId, 
            {
              // Core fields
              planId: subscriptionData.planId,
              billingFrequency: subscriptionData.billingFrequency || existingSubscription.billing_frequency,
              status: subscriptionData.status,
              externalSubscriptionId: subscriptionData.externalSubscriptionId,
              
              // Date fields - only pass dates that were explicitly provided
              ...(subscriptionData.startDate && { startDate: new Date(subscriptionData.startDate) }),
              ...(subscriptionData.endDate !== undefined && { endDate: subscriptionData.endDate ? new Date(subscriptionData.endDate) : null }),
              ...(subscriptionData.currentPeriodStart && { currentPeriodStart: new Date(subscriptionData.currentPeriodStart) }),
              ...(subscriptionData.currentPeriodEnd && { currentPeriodEnd: new Date(subscriptionData.currentPeriodEnd) }),
              ...(subscriptionData.canceledAt !== undefined && { canceledAt: subscriptionData.canceledAt ? new Date(subscriptionData.canceledAt) : null }),
              
              // Additional fields
              ...(subscriptionData.cancellationReason && { cancellationReason: subscriptionData.cancellationReason }),
              ...(subscriptionData.autoRenew !== undefined && { autoRenew: subscriptionData.autoRenew })
            }
          );
          
          // If payment provider details provided, create a payment record for the plan change
          if (subscriptionData.paymentProvider && subscriptionData.externalPaymentId) {
            try {
              // Determine payment amount
              let paymentAmount = subscriptionData.amount;
              if (paymentAmount === undefined || paymentAmount === null) {
                if (newPlan.billing_frequency === 'yearly') {
                  paymentAmount = newPlan.annual_price || (newPlan.monthly_price * 12);
                } else {
                  paymentAmount = newPlan.monthly_price;
                }
                logger.info('Using plan price for payment amount:', {
                  planId: newPlan.plan_id,
                  amount: paymentAmount,
                  billingFrequency: newPlan.billing_frequency
                });
              }
              
              // Calculate billing period
              const startDate = new Date();
              let endDate;
              
              if (newPlan.billing_frequency === 'monthly') {
                endDate = new Date(startDate);
                endDate.setMonth(endDate.getMonth() + 1);
              } else if (newPlan.billing_frequency === 'yearly') {
                endDate = new Date(startDate);
                endDate.setFullYear(endDate.getFullYear() + 1);
              }
              
              // Create billing period structure
              const billingPeriod = {
                start: startDate,
                end: endDate
              };
              
              // Create payment record
              await this.dataAccess.payments.createSubscriptionPayment(
                existingSubscription.user_id,
                subscriptionId,
                subscriptionData.planId,
                paymentAmount,
                subscriptionData.paymentProvider,
                subscriptionData.externalPaymentId,
                'subscription_renewal',
                billingPeriod,
                trx
              );
            } catch (paymentError) {
              logger.error('Error creating payment record for plan change:', paymentError);
              // Don't throw to prevent rollback
            }
          }
          
          // Get token allocation for the new plan
          if (newPlan.monthly_token_allocation > 0) {
            await this.dataAccess.tokenTransactions.allocateSubscriptionTokens(
              existingSubscription.user_id,
              subscriptionId,
              newPlan.monthly_token_allocation,
              `Token allocation for plan upgrade to ${newPlan.plan_name}`,
              null,
              trx
            );
          }
          
          return updatedSubscription;
        });
      } else {
        // Simple update without plan change
        // Use camelCase property names consistently
        return await this.dataAccess.subscriptions.updateSubscription(subscriptionId, {
          // Status and core fields
          ...(subscriptionData.status && { status: subscriptionData.status }),
          ...(subscriptionData.externalSubscriptionId && { externalSubscriptionId: subscriptionData.externalSubscriptionId }),
          ...(subscriptionData.billingFrequency && { billingFrequency: subscriptionData.billingFrequency }),
          
          // Date fields - only pass dates that were explicitly provided
          ...(subscriptionData.startDate && { startDate: new Date(subscriptionData.startDate) }),
          ...(subscriptionData.endDate !== undefined && { endDate: subscriptionData.endDate ? new Date(subscriptionData.endDate) : null }),
          ...(subscriptionData.currentPeriodStart && { currentPeriodStart: new Date(subscriptionData.currentPeriodStart) }),
          ...(subscriptionData.currentPeriodEnd && { currentPeriodEnd: new Date(subscriptionData.currentPeriodEnd) }),
          ...(subscriptionData.canceledAt !== undefined && { canceledAt: subscriptionData.canceledAt ? new Date(subscriptionData.canceledAt) : null }),
          
          // Additional fields
          ...(subscriptionData.cancellationReason && { cancellationReason: subscriptionData.cancellationReason }),
          ...(subscriptionData.autoRenew !== undefined && { autoRenew: subscriptionData.autoRenew })
        });
      }
    } catch (error) {
      logger.error('Error in updateSubscription:', error);
      throw error;
    }
  }

  /**
   * Helper method to compare subscription plans based on tier_id and plan_id
   * @param {Object} currentPlan - The current plan
   * @param {Object} newPlan - The new plan
   * @returns {Object} - Object containing comparison results
   */
  comparePlans(currentPlan, newPlan) {
    if (!currentPlan || !newPlan) {
      throw new Error('Both current plan and new plan must be provided for comparison');
    }

    // Get tier information
    const currentTierId = currentPlan.tier_id;
    const newTierId = newPlan.tier_id;

    // Comparing plans
    const isSameTier = currentTierId === newTierId;
    const isUpgrade = newTierId > currentTierId;
    const isDowngrade = newTierId < currentTierId;
    const isSamePlan = currentPlan.plan_id === newPlan.plan_id;
    const isFrequencyChange = isSameTier && !isSamePlan;

    logger.info('Plan comparison results:', {
      currentPlanId: currentPlan.plan_id,
      currentTierId,
      newPlanId: newPlan.plan_id,
      newTierId,
      isSameTier,
      isUpgrade,
      isDowngrade,
      isSamePlan,
      isFrequencyChange
    });

    return {
      isSameTier,
      isUpgrade,
      isDowngrade,
      isSamePlan,
      isFrequencyChange
    };
  }

  /**
   * Cancel a subscription
   * @param {string} subscriptionId - The subscription ID
   * @param {string} reason - The reason for cancellation
   * @returns {Promise<Object>} - The cancelled/pending cancellation subscription
   */
  async cancelSubscription(subscriptionId, reason) {
    try {
      // Ensure we have a valid subscription ID
      if (!subscriptionId) {
        throw new Error('Subscription ID is required for cancellation');
      }
      
      // Log the cancellation attempt with the reason
      logger.info('Cancelling subscription:', { 
        subscriptionId, 
        reason: reason || '(No reason provided)', 
      });
      
      // Get subscription to validate it exists
      const subscription = await this.dataAccess.subscriptions.getSubscriptionById(subscriptionId);
      
      if (!subscription) {
        logger.warn(`Subscription not found: ${subscriptionId}`);
        throw new Error(`Subscription not found: ${subscriptionId}`);
      }
      
      // Prevent cancellation of free tier subscriptions
      if (subscription.plan_id === 1) {
        logger.warn(`Cannot cancel a free tier subscription: ${subscriptionId}`);
        throw new Error('Free tier subscriptions cannot be cancelled');
      }
      
      if (subscription.status === 'cancelled') {
        logger.warn(`Subscription already cancelled: ${subscriptionId}`);
        return subscription;
      }
      
      // Standardize the cancellation reason
      let cancellationReason = reason || CANCELLATION_REASONS.CANCEL_PAID_PLAN;
      
      // If it's not one of our standard reasons, convert it
      if (!Object.values(CANCELLATION_REASONS).includes(cancellationReason)) {
        cancellationReason = CANCELLATION_REASONS.CANCEL_PAID_PLAN;
      }
      
      logger.info(`Proceeding with cancellation using reason: "${cancellationReason}"`);
      
      // For paid plan cancellations, we'll schedule a switch to free tier (plan_id=1)
      // For frequency changes, we'll use the specified upcoming plan 
      // For upgrades and downgrades, no upcoming plan ID is needed here (handled in specific methods)
      const upcomingPlanId = cancellationReason === CANCELLATION_REASONS.CANCEL_PAID_PLAN ? 1 : null;
      
      const updatedSubscription = await this.dataAccess.subscriptions.cancelSubscription(
        subscriptionId, 
        cancellationReason,
        upcomingPlanId
      );
      
      // Verify the cancellation was successful
      if (updatedSubscription) {
        logger.info('Subscription update completed successfully:', {
          subscriptionId,
          status: updatedSubscription.status,
          savedReason: updatedSubscription.cancellation_reason,
          endDate: updatedSubscription.end_date,
          upcomingPlanId: updatedSubscription.upcoming_plan_id
        });
      }
      
      return updatedSubscription;
    } catch (error) {
      logger.error('Error in cancelSubscription:', error);
      throw error;
    }
  }

  /**
   * Renews a subscription for a user.
   * This method handles both token allocation and billing periods.
   * - Token allocation period: Determines when tokens are allocated to the user
   * - Subscription / token allocation period: Determines when the user receives new tokens
   * - NOTE: This method does not handle payment renewals and also not the billing period. When a user changes or cancelles their
   * subscription, the current subscription is either cancelled directly or at the end of the billing period (so the user keeps 
   * their current benefits of the plan he paid for until the end of the subscription (end date))
   * 
   * @param {string} userId - The ID of the user whose subscription to renew
   * @param {boolean} forceRenew - Whether to force renewal regardless of period end date
   * @returns {Promise<Object>} - The renewed subscription details
   */
  async renewSubscription(userId, forceRenew = false) {
    try {
      logger.info('Attempting to renew subscription for user:', { userId, forceRenew });
      
      if (!userId) {
        throw new Error('User ID is required for subscription renewal');
      }
      
      // Get the user's active subscription
      const subscription = await this.dataAccess.subscriptions.getUserActiveSubscription(userId);
      
      if (!subscription) {
        logger.warn('No active subscription found for renewal:', { userId });
        throw new Error(`No active subscription found for user ${userId}`);
      }
      
      logger.info('Found active subscription for renewal:', { 
        subscriptionId: subscription.subscription_id,
        planId: subscription.plan_id,
        currentPeriodEnd: subscription.current_period_end
      });
      
      // Check if the subscription is ready for renewal (current period ended)
      const now = new Date();
      const currentPeriodEnd = new Date(subscription.current_period_end);
      
      // Only allow renewal on or after the current period end date, unless force renewal is enabled
      if (!forceRenew && now < currentPeriodEnd) {
        const daysRemaining = Math.ceil((currentPeriodEnd - now) / (1000 * 60 * 60 * 24));
        logger.warn('Subscription not ready for renewal:', { 
          subscriptionId: subscription.subscription_id,
          currentPeriodEnd: subscription.current_period_end,
          daysRemaining
        });
        throw new Error(`Subscription period has not ended yet. Current period ends on ${subscription.current_period_end} (${daysRemaining} days remaining)`);
      }
      
      // Get the plan details
      const plan = await this.dataAccess.plans.getPlanById(subscription.plan_id);
      
      if (!plan) {
        throw new Error(`Plan not found for subscription: ${subscription.plan_id}`);
      }
      
      // Calculate new period dates
      const newPeriodStart = new Date(Math.max(now.getTime(), currentPeriodEnd.getTime()));
      let newPeriodEnd;
      
      if (plan.billing_frequency === 'monthly') {
        newPeriodEnd = new Date(newPeriodStart);
        newPeriodEnd.setMonth(newPeriodEnd.getMonth() + 1);
      } else if (plan.billing_frequency === 'yearly') {
        newPeriodEnd = new Date(newPeriodStart);
        newPeriodEnd.setFullYear(newPeriodEnd.getFullYear() + 1);
      } else {
        // Default to monthly if billing_frequency is not recognized
        newPeriodEnd = new Date(newPeriodStart);
        newPeriodEnd.setMonth(newPeriodEnd.getMonth() + 1);
      }
      
      logger.info('Calculated new subscription period:', {
        subscriptionId: subscription.subscription_id,
        newPeriodStart,
        newPeriodEnd
      });
      
      // Begin transaction to update subscription and allocate tokens
      const knex = this.dataAccess.subscriptions.knex;
      const result = await knex.transaction(async (trx) => {
        // Update the subscription with new period dates - use camelCase consistently
        const updatedSubscription = await this.dataAccess.subscriptions.updateSubscription(
          subscription.subscription_id,
          {
            currentPeriodStart: newPeriodStart,
            currentPeriodEnd: newPeriodEnd
          }
        );
        
        // Allocate tokens for the new period
        let tokenAllocation = null;
        if (plan.monthly_token_allocation > 0) {
          // For yearly plans, still allocate the monthly token amount
          // (This maintains consistent monthly allocations regardless of plan billing frequency)
          tokenAllocation = await this.dataAccess.tokenTransactions.allocateSubscriptionTokens(
            userId,
            subscription.subscription_id,
            plan.monthly_token_allocation,
            `Renewal token allocation for ${plan.plan_name} subscription`,
            null,
            trx
          );
          
          logger.info('Tokens allocated for renewal:', {
            userId,
            subscriptionId: subscription.subscription_id,
            tokenAmount: plan.monthly_token_allocation
          });
        } else {
          logger.info('No tokens to allocate for renewal (plan has 0 token allocation):', {
            planId: plan.plan_id,
            planName: plan.plan_name
          });
        }
        
        return {
          subscription: updatedSubscription,
          tokenAllocation,
          newPeriod: {
            start: newPeriodStart,
            end: newPeriodEnd
          }
        };
      });
      
      logger.info('Subscription renewal completed successfully:', { 
        subscriptionId: subscription.subscription_id,
        tokenAmount: plan.monthly_token_allocation
      });
      
      return result;
    } catch (error) {
      logger.error('Error in renewSubscription:', error);
      throw error;
    }
  }

  /**
   * Upgrade a subscription to a higher tier plan
   * @param {string} subscriptionId - The current subscription ID
   * @param {number} newPlanId - The new (higher tier) plan ID
   * @param {Object} options - Additional upgrade options
   * @returns {Promise<Object>} - The new subscription
   */
  async upgradeSubscription(subscriptionId, newPlanId, options = {}) {
    try {
      logger.info('Processing subscription upgrade:', {
        subscriptionId,
        newPlanId,
        options
      });
      
      // Get current subscription
      const currentSubscription = await this.dataAccess.subscriptions.getSubscriptionById(subscriptionId);
      if (!currentSubscription) {
        throw new Error(`Subscription not found: ${subscriptionId}`);
      }
      
      // Get the plans to compare
      const currentPlan = await this.dataAccess.plans.getPlanById(currentSubscription.plan_id);
      const newPlan = await this.dataAccess.plans.getPlanById(newPlanId);
      
      if (!currentPlan || !newPlan) {
        throw new Error("Could not retrieve plan information");
      }

      // Compare plans to determine the appropriate action
      const comparison = this.comparePlans(currentPlan, newPlan);
      
      // Validate this is actually an upgrade or frequency change
      if (!comparison.isUpgrade && !comparison.isFrequencyChange) {
        throw new Error(`Invalid upgrade: New plan (ID: ${newPlanId}, Tier: ${newPlan.tier_id}) is not an upgrade from current plan (ID: ${currentPlan.plan_id}, Tier: ${currentPlan.tier_id})`);
      }

      // Determine the cancellation reason
      const cancellationReason = comparison.isFrequencyChange 
        ? CANCELLATION_REASONS.CANCEL_FOR_FREQUENCY_CHANGE 
        : CANCELLATION_REASONS.CANCEL_FOR_UPGRADE;
      
      // For upgrades and frequency changes, we use different handling
      const upcomingPlanId = comparison.isFrequencyChange ? newPlanId : null;
      
      // Cancel the current subscription with appropriate reason
      await this.dataAccess.subscriptions.cancelSubscription(
        subscriptionId,
        cancellationReason,
        upcomingPlanId // Only set for frequency changes
      );

      // For tier upgrades, create a new subscription immediately
      // For frequency changes, we don't create a new subscription here
      if (comparison.isUpgrade) {
        // Create the new subscription with the higher tier plan
        const subscriptionData = {
          userId: currentSubscription.user_id,
          planId: newPlanId,
          status: 'active',
          startDate: new Date(), // Start immediately
          externalSubscriptionId: options.externalSubscriptionId || currentSubscription.external_subscription_id
        };
        
        // If payment details provided, include them
        if (options.paymentProvider && options.externalPaymentId) {
          subscriptionData.paymentProvider = options.paymentProvider;
          subscriptionData.externalPaymentId = options.externalPaymentId;
        }
        
        const newSubscription = await this.createSubscription(subscriptionData);
        
        logger.info('Subscription upgraded successfully:', {
          oldSubscriptionId: subscriptionId,
          newSubscriptionId: newSubscription.subscription_id,
          userId: newSubscription.user_id,
          newPlanId: newSubscription.plan_id
        });
        
        return newSubscription;
      } else {
        // For frequency changes, return the updated subscription with pending status
        const updatedSubscription = await this.dataAccess.subscriptions.getSubscriptionById(subscriptionId);
        
        logger.info('Subscription frequency change scheduled:', {
          subscriptionId: updatedSubscription.subscription_id,
          currentPlanId: updatedSubscription.plan_id,
          upcomingPlanId: updatedSubscription.upcoming_plan_id
        });
        
        return updatedSubscription;
      }
    } catch (error) {
      logger.error('Error upgrading subscription:', error);
      throw error;
    }
  }
  
  /**
   * Downgrade a subscription to a lower tier plan
   * @param {string} subscriptionId - The current subscription ID
   * @param {number} newPlanId - The new (lower tier) plan ID
   * @param {Object} options - Additional downgrade options
   * @returns {Promise<Object>} - The updated subscription with pending cancellation
   */
  async downgradeSubscription(subscriptionId, newPlanId, options = {}) {
    try {
      logger.info('Processing subscription downgrade:', {
        subscriptionId,
        newPlanId,
        options
      });
      
      // Get current subscription
      const currentSubscription = await this.dataAccess.subscriptions.getSubscriptionById(subscriptionId);
      if (!currentSubscription) {
        throw new Error(`Subscription not found: ${subscriptionId}`);
      }
      
      // Get the plans to compare
      const currentPlan = await this.dataAccess.plans.getPlanById(currentSubscription.plan_id);
      const newPlan = await this.dataAccess.plans.getPlanById(newPlanId);
      
      if (!currentPlan || !newPlan) {
        throw new Error("Could not retrieve plan information");
      }
      
      // Compare plans to determine the appropriate action
      const comparison = this.comparePlans(currentPlan, newPlan);

      // Validate this is actually a downgrade or frequency change
      if (!comparison.isDowngrade && !comparison.isFrequencyChange) {
        throw new Error(`Invalid downgrade: New plan (ID: ${newPlanId}, Tier: ${newPlan.tier_id}) is not a downgrade from current plan (ID: ${currentPlan.plan_id}, Tier: ${currentPlan.tier_id})`);
      }

      // Determine the cancellation reason
      const cancellationReason = comparison.isFrequencyChange 
        ? CANCELLATION_REASONS.CANCEL_FOR_FREQUENCY_CHANGE 
        : CANCELLATION_REASONS.CANCEL_FOR_DOWNGRADE;
      
      // Mark the current subscription for downgrade at the end of the billing period
      const updatedSubscription = await this.dataAccess.subscriptions.cancelSubscription(
        subscriptionId,
        cancellationReason,
        newPlanId // Specify the upcoming plan ID
      );
      
      logger.info(`Subscription marked for ${comparison.isFrequencyChange ? 'frequency change' : 'downgrade'} at period end:`, {
        subscriptionId: updatedSubscription.subscription_id,
        currentPlanId: updatedSubscription.plan_id,
        downgradeToId: updatedSubscription.upcoming_plan_id,
        effectiveDate: updatedSubscription.end_date
      });
      
      return updatedSubscription;
    } catch (error) {
      logger.error('Error downgrading subscription:', error);
      throw error;
    }
  }
  
  /**
   * Cancel a paid plan subscription and schedule downgrade to free tier
   * @param {string} subscriptionId - The subscription ID
   * @param {string} reason - Optional additional cancellation reason
   * @returns {Promise<Object>} - The updated subscription with pending cancellation
   */
  async cancelPaidPlan(subscriptionId, reason = '') {
    try {
      logger.info('Processing paid plan cancellation:', {
        subscriptionId,
        reason
      });
      
      // Get current subscription
      const currentSubscription = await this.dataAccess.subscriptions.getSubscriptionById(subscriptionId);
      if (!currentSubscription) {
        throw new Error(`Subscription not found: ${subscriptionId}`);
      }
      
      // Verify this is a paid plan (not free tier)
      if (currentSubscription.plan_id === 1) {
        throw new Error('Cannot cancel a free tier subscription');
      }
      
      // Create a standardized reason with any additional context
      const cancellationReason = `${CANCELLATION_REASONS.CANCEL_PAID_PLAN}${reason ? ': ' + reason : ''}`;
      
      // Mark the subscription for cancellation at the end of the billing period
      // and schedule downgrade to free tier (plan_id=1)
      const updatedSubscription = await this.dataAccess.subscriptions.cancelSubscription(
        subscriptionId,
        cancellationReason,
        1 // Free tier plan ID
      );
      
      logger.info('Subscription marked for cancellation at period end:', {
        subscriptionId: updatedSubscription.subscription_id,
        currentPlanId: updatedSubscription.plan_id,
        downgradeToFreeAt: updatedSubscription.end_date
      });
      
      return updatedSubscription;
    } catch (error) {
      logger.error('Error canceling paid plan:', error);
      throw error;
    }
  }
  
  /**
   * Process pending cancellations and create new subscriptions if needed
   * This method would be called by a scheduled batch job
   * @returns {Promise<Object>} - Summary of processed cancellations
   */
  async processPendingCancellations() {
    try {
      logger.info('Processing pending cancellations');
      
      // Get all subscriptions that are pending cancellation and have reached their end date
      const subscriptions = await this.dataAccess.subscriptions.getPendingCancellations();
      
      if (!subscriptions || subscriptions.length === 0) {
        logger.info('No pending cancellations found');
        return { processed: 0, cancelled: 0, newSubscriptions: 0 };
      }
      
      logger.info(`Found ${subscriptions.length} pending cancellations to process`);
      
      let cancelledCount = 0;
      let newSubscriptionsCount = 0;
      
      // Process each subscription
      for (const subscription of subscriptions) {
        try {
          // Cancel the subscription
          await this.cancelPaidPlan(subscription.subscription_id);
          cancelledCount++;
          
          // If there's an upcoming plan, create a new subscription
          if (subscription.upcoming_plan_id) {
            await this.createSubscription({
              userId: subscription.user_id,
              planId: subscription.upcoming_plan_id,
              status: 'active'
            });
            newSubscriptionsCount++;
          }
        } catch (error) {
          logger.error(`Error processing pending cancellation for subscription ${subscription.subscription_id}:`, error);
        }
      }
      
      return {
        processed: subscriptions.length,
        cancelled: cancelledCount,
        newSubscriptions: newSubscriptionsCount
      };
    } catch (error) {
      logger.error('Error processing pending cancellations:', error);
      throw error;
    }
  }

  /**
   * Get subscriptions that are pending cancellation
   * @param {boolean} force - Whether to force retrieval regardless of end date
   * @returns {Promise<Array>} - List of subscriptions that are pending cancellation
   */
  async getPendingCancellations(force = false) {
    try {
      logger.info('Getting pending cancellations:', { force });
      
      // Get all subscriptions that are pending cancellation
      const subscriptions = await this.dataAccess.subscriptions.getPendingCancellations(force);
      
      if (!subscriptions || subscriptions.length === 0) {
        logger.info('No pending cancellations found');
        return [];
      }
      
      logger.info(`Found ${subscriptions.length} pending cancellations`);
      
      return subscriptions;
    } catch (error) {
      logger.error('Error getting pending cancellations:', error);
      throw error;
    }
  }

  /**
   * Get subscriptions that need to be renewed
   * @param {boolean} force - Whether to force renewal regardless of period end date
   * @returns {Promise<Array>} - List of subscriptions that need to be renewed
   */
  async getSubscriptionsToRenew(force = false) {
    try {
      logger.info('Getting subscriptions to renew:', { force });
      
      // Get all active subscriptions that need to be renewed
      const subscriptions = await this.dataAccess.subscriptions.getSubscriptionsNeedingRenewal(force);
      
      if (!subscriptions || subscriptions.length === 0) {
        logger.info('No subscriptions found that need renewal');
        return [];
      }
      
      logger.info(`Found ${subscriptions.length} subscriptions that need renewal`);
      
      return subscriptions;
    } catch (error) {
      logger.error('Error getting subscriptions to renew:', error);
      throw error;
    }
  }
}

module.exports = SubscriptionService; 