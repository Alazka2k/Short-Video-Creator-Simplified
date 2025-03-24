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
        
        // If it's a different plan, try to cancel the existing subscription first, but don't fail if it doesn't work
        logger.info('Cancelling existing subscription before creating new one:', {
          existingSubscriptionId: existingSubscription.subscription_id,
          newPlanId: subscriptionData.planId
        });
        
        try {
          await this.cancelSubscription(existingSubscription.subscription_id, 'Upgraded to a new plan');
          logger.info('Successfully cancelled previous subscription during upgrade');
        } catch (cancellationError) {
          // If cancellation failed, we'll log but continue with creating the new subscription
          logger.warn('Error cancelling previous subscription during upgrade, continuing with new subscription:', { 
            error: cancellationError.message, 
            subscriptionId: existingSubscription.subscription_id 
          });
          
          // Try a direct database update to mark it as cancelled if the normal cancellation failed
          try {
            await this.dataAccess.subscriptions.updateSubscription(
              existingSubscription.subscription_id, 
              { 
                status: 'cancelled',
                canceledAt: new Date(),
                cancellationReason: 'Upgraded to a new plan (forced update)'
              }
            );
            logger.info('Forced cancellation of previous subscription');
          } catch (forceUpdateError) {
            logger.warn('Forced cancellation also failed, continuing with new subscription anyway:', {
              error: forceUpdateError.message
            });
            // Continue with creation even if this fails
          }
        }
      }
      
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
   * Cancel a subscription
   * @param {string} subscriptionId - The subscription ID
   * @param {string} reason - The reason for cancellation
   * @returns {Promise<Object>} - The cancelled subscription
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
      
      if (subscription.status === 'cancelled') {
        logger.warn(`Subscription already cancelled: ${subscriptionId}`);
        return subscription;
      }
      
      // Cancel the subscription - explicitly pass the reason
      // Convert undefined/null to empty string to avoid DB issues
      const cancellationReason = reason || '';
      
      logger.info(`Proceeding with cancellation using reason: "${cancellationReason}"`);
      
      const cancelledSubscription = await this.dataAccess.subscriptions.cancelSubscription(
        subscriptionId, 
        cancellationReason
      );
      
      // Verify the cancellation was successful and reason was saved
      if (cancelledSubscription) {
        logger.info('Cancellation completed successfully:', {
          subscriptionId,
          status: cancelledSubscription.status,
          savedReason: cancelledSubscription.cancellation_reason,
          endDate: cancelledSubscription.end_date
        });
      }
      
      return cancelledSubscription;
    } catch (error) {
      logger.error('Error in cancelSubscription:', error);
      throw error;
    }
  }

  /**
   * Renew a subscription's token allocation period
   * @param {string|number} userId - The user ID
   * @param {boolean} forceRenew - Whether to force renewal even if not at period end
   * @returns {Promise<Object>} - The renewed subscription with token allocation details
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
}

module.exports = SubscriptionService; 