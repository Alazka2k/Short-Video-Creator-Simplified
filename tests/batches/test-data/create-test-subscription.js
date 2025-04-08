/**
 * Script to create a test subscription for batch job testing
 * 
 * This script creates a test subscription for a user with a billing period end date
 * that is in the past, which will trigger the Create Payments batch job.
 */

const knex = require('knex')(require('../../../knexfile')[process.env.NODE_ENV]);
const { v4: uuidv4 } = require('uuid');

// Configuration
const USER_ID = 32; // The user ID to create the subscription for
const PLAN_ID = 2; // The plan ID to use for the subscription
const CURRENT_DATE = new Date('2025-04-07 12:20:00.997+02'); // Current date in the database

async function createTestSubscription() {
  try {
    console.log('Creating test subscription...');

    // Check if the user exists
    const user = await knex('users').where('user_id', USER_ID).first();
    if (!user) {
      console.error(`User with ID ${USER_ID} does not exist.`);
      return;
    }

    // Check if the plan exists
    const plan = await knex('plans').where('plan_id', PLAN_ID).first();
    if (!plan) {
      console.error(`Plan with ID ${PLAN_ID} does not exist.`);
      return;
    }

    // Check if the user already has an active subscription
    const existingSubscription = await knex('user_subscriptions')
      .where('user_id', USER_ID)
      .where('status', 'active')
      .first();

    if (existingSubscription) {
      console.log(`User already has an active subscription with ID ${existingSubscription.subscription_id}`);
      
      // Update the existing subscription to have a billing period end date in the past
      const currentPeriodStart = new Date(CURRENT_DATE);
      currentPeriodStart.setMonth(currentPeriodStart.getMonth() - 1);
      
      const currentPeriodEnd = new Date(CURRENT_DATE);
      currentPeriodEnd.setDate(currentPeriodEnd.getDate() - 1); // Yesterday
      
      await knex('user_subscriptions')
        .where('subscription_id', existingSubscription.subscription_id)
        .update({
          current_period_start: currentPeriodStart,
          current_period_end: currentPeriodEnd,
          updated_at: CURRENT_DATE
        });
      
      console.log(`Updated subscription ${existingSubscription.subscription_id} with billing period end date in the past`);
      return existingSubscription.subscription_id;
    }

    // Create a new subscription with a billing period end date in the past
    const currentPeriodStart = new Date(CURRENT_DATE);
    currentPeriodStart.setMonth(currentPeriodStart.getMonth() - 1);
    
    const currentPeriodEnd = new Date(CURRENT_DATE);
    currentPeriodEnd.setDate(currentPeriodEnd.getDate() - 1); // Yesterday
    
    const startDate = new Date(CURRENT_DATE);
    startDate.setMonth(startDate.getMonth() - 1);
    
    const [newSubscription] = await knex('user_subscriptions')
      .insert({
        user_id: USER_ID,
        plan_id: PLAN_ID,
        status: 'active',
        start_date: startDate,
        current_period_start: currentPeriodStart,
        current_period_end: currentPeriodEnd,
        created_at: CURRENT_DATE,
        updated_at: CURRENT_DATE
      })
      .returning('*');
    
    console.log(`Created new subscription with ID ${newSubscription.subscription_id}`);
    return newSubscription.subscription_id;
  } catch (error) {
    console.error('Error creating test subscription:', error);
    throw error;
  }
}

// Run the function if this script is executed directly
if (require.main === module) {
  createTestSubscription()
    .then(() => {
      console.log('Test subscription created successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Error:', error);
      process.exit(1);
    });
}

module.exports = { createTestSubscription }; 