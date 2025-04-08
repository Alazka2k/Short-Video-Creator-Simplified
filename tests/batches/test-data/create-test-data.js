/**
 * Script to create all necessary test data for batch job testing
 * 
 * This script creates test data for:
 * 1. Create Payments batch job
 * 2. Collect Payments batch job
 * 3. Retry Failed Payments batch job
 * 4. Process Pending Cancellations batch job
 * 5. Renew Subscriptions batch job
 */

const knex = require('knex')(require('../../../knexfile')[process.env.NODE_ENV]);
const { v4: uuidv4 } = require('uuid');
const config = require('../../../backend/shared/utils/config');

// Configuration
const USER_ID = 32; // The user ID to test with
const PLAN_ID = 2; // The plan ID to test with
const CURRENT_DATE = new Date(); // Current timestamp

/**
 * Create all test data for batch job testing
 */
async function createAllTestData() {
  try {
    console.log('Creating all test data...');
    
    // Create test data for Create Payments batch job
    console.log('\nCreating test data for Create Payments batch job...');
    const subscriptionId = await createTestSubscription();
    console.log(`Created test subscription with ID ${subscriptionId}`);
    
    // Create test data for Collect Payments batch job
    console.log('\nCreating test data for Collect Payments batch job...');
    const openPaymentId = await createTestPayment('open', 0);
    console.log(`Created test open payment with ID ${openPaymentId}`);
    
    // Create test data for Retry Failed Payments batch job
    console.log('\nCreating test data for Retry Failed Payments batch job...');
    const failedPaymentId = await createTestPayment('failed', 0);
    console.log(`Created test failed payment with ID ${failedPaymentId}`);
    
    // Create test data for Process Pending Cancellations batch job
    console.log('\nCreating test data for Process Pending Cancellations batch job...');
    const pendingCancellationId = await createTestSubscription('pending_cancellation');
    console.log(`Created test pending cancellation subscription with ID ${pendingCancellationId}`);
    
    // Create test data for Renew Subscriptions batch job
    console.log('\nCreating test data for Renew Subscriptions batch job...');
    const renewalSubscriptionId = await createTestSubscription('active', true);
    console.log(`Created test renewal subscription with ID ${renewalSubscriptionId}`);
    
    console.log('\nAll test data created successfully!');
    return {
      subscriptionId,
      openPaymentId,
      failedPaymentId,
      pendingCancellationId,
      renewalSubscriptionId
    };
  } catch (error) {
    console.error('Error creating test data:', error);
    throw error;
  }
}

/**
 * Create a test subscription
 * @param {string} status - The status of the subscription
 * @param {boolean} needsRenewal - Whether the subscription needs renewal
 * @returns {Promise<string>} - The ID of the created subscription
 */
async function createTestSubscription(status = 'active', needsRenewal = false) {
  try {
    // Check if user exists
    const user = await knex('users').where('user_id', USER_ID).first();
    if (!user) {
      throw new Error(`User with ID ${USER_ID} not found`);
    }
    
    // Check if plan exists
    const plan = await knex('plans').where('plan_id', PLAN_ID).first();
    if (!plan) {
      throw new Error(`Plan with ID ${PLAN_ID} not found`);
    }
    
    // Check for existing active subscription
    const existingSubscription = await knex('user_subscriptions')
      .where('user_id', USER_ID)
      .where('status', 'active')
      .first();
    
    if (existingSubscription) {
      // Update the current period end date to a past date
      await knex('user_subscriptions')
        .where('subscription_id', existingSubscription.subscription_id)
        .update({
          current_period_end: CURRENT_DATE
        });
      
      return existingSubscription.subscription_id;
    }
    
    // Create a new subscription
    const subscriptionId = uuidv4();
    await knex('user_subscriptions').insert({
      subscription_id: subscriptionId,
      user_id: USER_ID,
      plan_id: PLAN_ID,
      status: status,
      current_period_start: CURRENT_DATE,
      current_period_end: needsRenewal ? CURRENT_DATE : new Date(CURRENT_DATE.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      created_at: CURRENT_DATE,
      updated_at: CURRENT_DATE
    });
    
    return subscriptionId;
  } catch (error) {
    console.error('Error creating test subscription:', error);
    throw error;
  }
}

/**
 * Create a test payment
 * @param {string} status - The status of the payment
 * @param {number} retryCount - The number of retry attempts
 * @returns {Promise<number>} - The ID of the created payment
 */
async function createTestPayment(status, retryCount) {
  try {
    // Check if user exists
    const user = await knex('users').where('user_id', USER_ID).first();
    if (!user) {
      throw new Error(`User with ID ${USER_ID} not found`);
    }
    
    // Check if plan exists
    const plan = await knex('plans').where('plan_id', PLAN_ID).first();
    if (!plan) {
      throw new Error(`Plan with ID ${PLAN_ID} not found`);
    }
    
    // Get the user's active subscription
    const subscription = await knex('user_subscriptions')
      .where('user_id', USER_ID)
      .where('status', 'active')
      .first();
    
    if (!subscription) {
      throw new Error(`No active subscription found for user ${USER_ID}`);
    }
    
    // Check for existing payment with the same status
    const existingPayment = await knex('payments')
      .where('user_id', USER_ID)
      .where('subscription_id', subscription.subscription_id)
      .where('status', status)
      .first();
    
    if (existingPayment) {
      return existingPayment.payment_id;
    }
    
    // Find the highest payment_id and increment it by 1
    const maxPayment = await knex('payments')
      .max('payment_id as max_id')
      .first();
    
    const nextPaymentId = (maxPayment.max_id || 0) + 1;
    
    // Create a new payment
    await knex('payments').insert({
      payment_id: nextPaymentId,
      user_id: USER_ID,
      subscription_id: subscription.subscription_id,
      payment_type: 'subscription_renewal',
      status: status,
      retry_count: retryCount,
      currency: 'TEST-USD', // Shortened to fit VARCHAR(10)
      payment_method: 'test-card', // Shortened to fit VARCHAR(10)
      amount: 9.99,
      created_at: CURRENT_DATE,
      updated_at: CURRENT_DATE
    });
    
    return nextPaymentId;
  } catch (error) {
    console.error('Error creating test payment:', error);
    throw error;
  }
}

// Run the script if it's executed directly
if (require.main === module) {
  createAllTestData()
    .then((result) => {
      console.log('\nTest data creation completed successfully!');
      console.log('Created test data:', result);
      process.exit(0);
    })
    .catch((error) => {
      console.error('Error:', error);
      process.exit(1);
    });
}

module.exports = {
  createAllTestData,
  createTestSubscription,
  createTestPayment
}; 