/**
 * Script to test the Create Payments batch job
 * 
 * This script:
 * 1. Sets up test data for the Create Payments batch job
 * 2. Runs the Create Payments batch job
 * 3. Verifies that the batch job created the expected payment
 * 
 * Test Scenarios:
 * 1. Active subscription with future billing period -> Should not create payment
 * 2. Active subscription with past billing period -> Should create payment
 * 3. Cancelled subscription (ID 70) -> Should not create payment
 * 4. Force parameter override -> Should create payment regardless of billing period
 */

const axios = require('axios');
const knex = require('knex')(require('../../../knexfile')[process.env.NODE_ENV]);
const config = require('../../../shared/utils/config');
const { createTestSubscription } = require('../test-data/create-test-data');
const { BatchLauncher } = require('../../../backend/batches/services/BatchLauncher');
const CreatePaymentsBatch = require('../../../backend/batches/batch-jobs/CreatePaymentsBatch');

// Configuration
const BATCH_SERVICE_URL = config.services.batch.url; // URL of the batch service
const ACTIVE_SUBSCRIPTION_ID = 73; // The active subscription ID to test with
const CANCELLED_SUBSCRIPTION_ID = 70; // A known cancelled subscription ID
const USER_ID = 32; // The user ID to test with
const PLAN_ID = 2; // The plan ID to test with
const API_GATEWAY_URL = config.services.apiGateway.url; // URL of the API Gateway

// Get Auth0 M2M configuration
const AUTH0_DOMAIN = config.auth.auth0.domain;
const AUTH0_CLIENT_ID = config.auth.auth0.clientId;
const AUTH0_CLIENT_SECRET = config.auth.auth0.clientSecret;
const AUTH0_AUDIENCE = config.auth.auth0.audience;

/**
 * Gets the latest payment for a subscription
 * @param {number} subscriptionId - The subscription ID
 * @returns {Promise<Object>} - The latest payment
 */
async function getLatestPayment(subscriptionId) {
  try {
    const payment = await knex('payments')
      .where('subscription_id', subscriptionId)
      .whereIn('payment_type', ['subscription_renewal', 'subscription_initial'])
      .orderBy('created_at', 'desc')
      .first();
    
    return payment;
  } catch (error) {
    console.error('Error getting latest payment:', error.message);
    throw error;
  }
}

/**
 * Updates the billing period end date of a payment
 * @param {number} paymentId - The payment ID
 * @param {Date} billingPeriodEnd - The new billing period end date
 * @returns {Promise<void>}
 */
async function updatePaymentBillingPeriodEnd(paymentId, billingPeriodEnd) {
  try {
    await knex('payments')
      .where('payment_id', paymentId)
      .update({
        current_period_end: billingPeriodEnd
      });
    
    console.log(`Updated payment ${paymentId} billing period end to ${billingPeriodEnd}`);
  } catch (error) {
    console.error('Error updating payment billing period end:', error.message);
    throw error;
  }
}

/**
 * Runs the Create Payments batch job
 * @param {boolean} force - Whether to force payment creation regardless of billing period
 * @returns {Promise<Object>} - The response from the batch job
 */
async function runCreatePaymentsBatchJob(force = false) {
  try {
    console.log(`Running Create Payments batch job${force ? ' with force=true' : ''}...`);
    const response = await axios.post(`${API_GATEWAY_URL}/api/admin/batches/run/create-payments`, { force });
    console.log('Create Payments batch job completed successfully');
    return response.data;
  } catch (error) {
    console.error('Error running Create Payments batch job:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
    throw error;
  }
}

/**
 * Verifies that the Create Payments batch job created the expected payment
 * @param {number} subscriptionId - The subscription ID to check
 * @param {boolean} shouldExist - Whether a payment should exist
 * @returns {Promise<boolean>} - Whether the verification passed
 */
async function verifyCreatePaymentsBatchJob(subscriptionId, shouldExist = true) {
  try {
    console.log(`Verifying payment creation for subscription ${subscriptionId}...`);
    
    // Get the latest payment before running the batch job
    const latestPaymentBefore = await getLatestPayment(subscriptionId);
    const paymentIdBefore = latestPaymentBefore ? latestPaymentBefore.payment_id : null;
    
    // Run the batch job
    await runCreatePaymentsBatchJob();
    
    // Get the latest payment after running the batch job
    const latestPaymentAfter = await getLatestPayment(subscriptionId);
    const paymentIdAfter = latestPaymentAfter ? latestPaymentAfter.payment_id : null;
    
    // Check if a new payment was created
    const newPaymentCreated = paymentIdBefore !== paymentIdAfter;
    
    if (shouldExist) {
      if (!newPaymentCreated) {
        console.error('Verification failed: No new payment was created');
        return false;
      }
      console.log('Verification passed: New payment was created successfully');
    } else {
      if (newPaymentCreated) {
        console.error('Verification failed: New payment was created when it should not have been');
        return false;
      }
      console.log('Verification passed: No new payment was created as expected');
    }
    
    return true;
  } catch (error) {
    console.error('Error verifying payment creation:', error.message);
    return false;
  }
}

/**
 * Tests the Create Payments batch job with various scenarios
 */
async function testCreatePaymentsBatchJob() {
  try {
    console.log('Starting Create Payments batch job test...');
    
    // Get the latest payment for the active subscription
    const latestPayment = await getLatestPayment(ACTIVE_SUBSCRIPTION_ID);
    if (!latestPayment) {
      console.error('No payment found for the active subscription');
      return false;
    }
    
    console.log(`Found latest payment for subscription ${ACTIVE_SUBSCRIPTION_ID}: ${latestPayment.payment_id}`);
    console.log(`Current billing period end: ${latestPayment.current_period_end}`);
    
    // Store the original billing period end date to restore later
    const originalBillingPeriodEnd = new Date(latestPayment.current_period_end);
    
    // Scenario 1: Active subscription with future billing period -> Should not create payment
    console.log('\nTesting Scenario 1: Active subscription with future billing period');
    
    // Set the billing period end to a future date
    const futureBillingPeriodEnd = new Date();
    futureBillingPeriodEnd.setDate(futureBillingPeriodEnd.getDate() + 30); // 30 days in the future
    
    await updatePaymentBillingPeriodEnd(latestPayment.payment_id, futureBillingPeriodEnd);
    const scenario1Result = await verifyCreatePaymentsBatchJob(ACTIVE_SUBSCRIPTION_ID, false);
    
    // Scenario 2: Active subscription with past billing period -> Should create payment
    console.log('\nTesting Scenario 2: Active subscription with past billing period');
    
    // Set the billing period end to a past date
    const pastBillingPeriodEnd = new Date();
    pastBillingPeriodEnd.setDate(pastBillingPeriodEnd.getDate() - 1); // Yesterday
    
    await updatePaymentBillingPeriodEnd(latestPayment.payment_id, pastBillingPeriodEnd);
    const scenario2Result = await verifyCreatePaymentsBatchJob(ACTIVE_SUBSCRIPTION_ID, true);
    
    // Scenario 3: Cancelled subscription -> Should not create payment
    console.log('\nTesting Scenario 3: Cancelled subscription');
    // NOTE: This uses a static subscription ID (70) which is known to be cancelled
    // TODO: Improve this test case to create a cancelled subscription dynamically
    const scenario3Result = await verifyCreatePaymentsBatchJob(CANCELLED_SUBSCRIPTION_ID, false);
    
    // Scenario 4: Force parameter -> Should create payment regardless of billing period
    console.log('\nTesting Scenario 4: Force parameter');
    
    // Set the billing period end back to a future date
    await updatePaymentBillingPeriodEnd(latestPayment.payment_id, futureBillingPeriodEnd);
    
    // Run the batch job with force=true
    await runCreatePaymentsBatchJob(true);
    const scenario4Result = await verifyCreatePaymentsBatchJob(ACTIVE_SUBSCRIPTION_ID, true);
    
    // Restore the original billing period end date
    await updatePaymentBillingPeriodEnd(latestPayment.payment_id, originalBillingPeriodEnd);
    
    // Report results
    console.log('\nTest Results:');
    console.log(`Scenario 1 (Active subscription with future billing period): ${scenario1Result ? 'PASSED' : 'FAILED'}`);
    console.log(`Scenario 2 (Active subscription with past billing period): ${scenario2Result ? 'PASSED' : 'FAILED'}`);
    console.log(`Scenario 3 (Cancelled subscription): ${scenario3Result ? 'PASSED' : 'FAILED'}`);
    console.log(`Scenario 4 (Force parameter): ${scenario4Result ? 'PASSED' : 'FAILED'}`);
    
    const allPassed = scenario1Result && scenario2Result && scenario3Result && scenario4Result;
    console.log(`\nOverall Test Result: ${allPassed ? 'PASSED' : 'FAILED'}`);
    
    return allPassed;
  } catch (error) {
    console.error('Error in test:', error.message);
    return false;
  }
}

/**
 * Test the Create Payments batch job
 */
async function testCreatePayments() {
  try {
    console.log('Testing Create Payments batch job...');
    
    // Step 1: Create test data
    console.log('\nCreating test data...');
    const subscriptionId = await createTestSubscription();
    console.log(`Created test subscription with ID ${subscriptionId}`);
    
    // Step 2: Run the batch job
    console.log('Step 3: Running the batch job...');
    try {
      const response = await axios.post(`${API_GATEWAY_URL}/api/admin/batches/run/create-payments`, {
        force: true // Force creation of payments even if they already exist
      });
      console.log('Batch job started successfully:', response.data);
      jobId = response.data.jobId;
    } catch (error) {
      console.error('Error running batch job:', error.response ? error.response.data : error.message);
      throw error;
    }
    
    // Step 3: Verify the results
    console.log('\nVerifying results...');
    const payments = await knex('payments')
      .where('user_id', USER_ID)
      .where('subscription_id', subscriptionId)
      .where('status', 'pending')
      .select();
    
    console.log(`Found ${payments.length} pending payments`);
    if (payments.length === 0) {
      throw new Error('No pending payments were created');
    }
    
    console.log('\nTest completed successfully!');
    return {
      success: true,
      subscriptionId,
      paymentCount: payments.length
    };
  } catch (error) {
    console.error('Error testing Create Payments batch job:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

async function getM2MToken() {
  try {
    const response = await axios.post(`https://${AUTH0_DOMAIN}/oauth/token`, {
      client_id: AUTH0_CLIENT_ID,
      client_secret: AUTH0_CLIENT_SECRET,
      audience: AUTH0_AUDIENCE,
      grant_type: 'client_credentials'
    });
    return response.data.access_token;
  } catch (error) {
    console.error('Error getting M2M token:', error.message);
    throw error;
  }
}

async function runCreatePaymentsBatch() {
  try {
    console.log('Getting M2M token...');
    const token = await getM2MToken();

    console.log('Running batch job...');
    const response = await axios.post(`${API_GATEWAY_URL}/api/admin/batches/run/create-payments`, {
      force: true // Force creation of payments even if they already exist
    }, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('Batch job started successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error running batch job:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
    throw error;
  }
}

// Run the script if it's executed directly
if (require.main === module) {
  testCreatePayments()
    .then((result) => {
      console.log('\nTest result:', result);
      process.exit(result.success ? 0 : 1);
    })
    .catch((error) => {
      console.error('Error:', error);
      process.exit(1);
    });
}

module.exports = {
  runCreatePaymentsBatch
}; 