const knex = require('knex');
const knexConfig = require('../../knexfile');
const logger = require('../../backend/shared/utils/logger');

// Use the development configuration
const db = knex(knexConfig.development);

const TEST_USER_ID = 2;

async function resetTestUserState() {
  logger.info(`Starting state reset for test user ID: ${TEST_USER_ID}`);

  try {
    await db.transaction(async (trx) => {
      // Find the most recent subscription for the user to delete it
      const newSubscription = await trx('user_subscriptions')
        .where('user_id', TEST_USER_ID)
        .orderBy('created_at', 'desc')
        .first();

      if (newSubscription && newSubscription.plan_id !== 1) {
        logger.info(`Found new subscription to delete: ID ${newSubscription.subscription_id}`);
        
        // Delete related payment record
        const deletedPayments = await trx('payments')
          .where('subscription_id', newSubscription.subscription_id)
          .del();
        logger.info(`Deleted ${deletedPayments} payment record(s) for subscription ${newSubscription.subscription_id}.`);

        // Delete related token transaction
        const deletedTransactions = await trx('token_transactions')
          .where('related_entity_id', newSubscription.subscription_id)
          .andWhere('related_entity_type', 'subscription')
          .del();
        logger.info(`Deleted ${deletedTransactions} token transaction(s) for subscription ${newSubscription.subscription_id}.`);
        
        // Delete the new subscription record itself
        const deletedSubscriptions = await trx('user_subscriptions')
          .where('subscription_id', newSubscription.subscription_id)
          .del();
        logger.info(`Deleted ${deletedSubscriptions} new subscription record(s).`);
      } else {
        logger.info('No new paid subscription found to delete.');
      }

      // Revert the original free tier subscription to active
      const updatedSubscriptions = await trx('user_subscriptions')
        .where({
          user_id: TEST_USER_ID,
          plan_id: 1 // Assuming the original subscription is for the Free Tier (plan_id=1)
        })
        .update({
          status: 'active',
          end_date: null,
          canceled_at: null,
          cancellation_reason: null,
          upcoming_plan_id: null,
          stripe_status: null,
          cancel_at_period_end: false
        });
      logger.info(`Reverted ${updatedSubscriptions} original subscription record(s) to 'active'.`);

      // Reset token balance
      const originalTokenBalance = 1000;
      const updatedTokens = await trx('tokens')
        .where('user_id', TEST_USER_ID)
        .update({
          balance: originalTokenBalance
        });
      logger.info(`Reset token balance for user ${TEST_USER_ID} to ${originalTokenBalance}.`);

      // Revert user's main plan ID
      const freeTierPlanId = 1;
      const updatedUsers = await trx('users')
        .where('user_id', TEST_USER_ID)
        .update({
          subscription_plan_id: freeTierPlanId
        });
      logger.info(`Updated user's main subscription_plan_id to ${freeTierPlanId}.`);
    });

    logger.info('Successfully reset test user state.');

  } catch (error) {
    logger.error('Error resetting test user state:', error);
  } finally {
    await db.destroy();
  }
}

resetTestUserState(); 