/**
 * Script to create a test payment for batch job testing
 * 
 * This script creates a test payment for a subscription with a billing period end date
 * that is in the past, which will trigger the Collect Payments batch job.
 */

const knex = require('knex')(require('../../../knexfile')[process.env.NODE_ENV]);
const { v4: uuidv4 } = require('uuid');

// Configuration
const USER_ID = 32; // The user ID to create the payment for
const PLAN_ID = 2; // The plan ID to use for the payment
const CURRENT_DATE = new Date('2025-04-07 12:20:00.997+02'); // Current date in the database

async function createTestPayment() {
  try {
    console.log('Creating test payment...');

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

    // Check if the user has an active subscription
    const subscription = await knex('user_subscriptions')
      .where('user_id', USER_ID)
      .where('status', 'active')
      .first();

    if (!subscription) {
      console.error(`User does not have an active subscription.`);
      return;
    }

    // Check if a payment already exists for the current billing period
    const existingPayment = await knex('payments')
      .where('user_id', USER_ID)
      .where('subscription_id', subscription.subscription_id)
      .where('status', 'pending')
      .first();

    if (existingPayment) {
      console.log(`Payment already exists for subscription ${subscription.subscription_id}`);
      return existingPayment.payment_id;
    }

    // Create a new payment with a billing period end date in the past
    const billingPeriodStart = new Date(CURRENT_DATE);
    billingPeriodStart.setMonth(billingPeriodStart.getMonth() - 1);
    
    const billingPeriodEnd = new Date(CURRENT_DATE);
    billingPeriodEnd.setDate(billingPeriodEnd.getDate() - 1); // Yesterday
    
    const [newPayment] = await knex('payments')
      .insert({
        user_id: USER_ID,
        plan_id: PLAN_ID,
        subscription_id: subscription.subscription_id,
        amount: plan.price,
        currency: plan.currency,
        status: 'pending',
        payment_type: 'subscription_renewal',
        billing_period_start: billingPeriodStart,
        billing_period_end: billingPeriodEnd,
        created_at: CURRENT_DATE,
        updated_at: CURRENT_DATE
      })
      .returning('*');
    
    console.log(`Created new payment with ID ${newPayment.payment_id}`);
    return newPayment.payment_id;
  } catch (error) {
    console.error('Error creating test payment:', error);
    throw error;
  }
}

// Run the function if this script is executed directly
if (require.main === module) {
  createTestPayment()
    .then(() => {
      console.log('Test payment created successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Error:', error);
      process.exit(1);
    });
}

module.exports = { createTestPayment }; 