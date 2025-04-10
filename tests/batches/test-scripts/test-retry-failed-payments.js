/**
 * Script to test the Retry Failed Payments batch job
 * 
 * This script:
 * 1. Creates test data for the Retry Failed Payments batch job
 * 2. Runs the batch job
 * 3. Verifies that failed payments were retried as expected
 */

const knex = require('knex')(require('../../../knexfile')[process.env.NODE_ENV]);
const { createTestSubscription, createTestPayment } = require('../test-data/create-test-data');
const BatchLauncher = require('../../../backend/batches/services/BatchLauncher');
const RetryFailedPaymentsBatch = require('../../../backend/batches/batch-jobs/RetryFailedPaymentsBatch');
const config = require('../../../shared/utils/config');
const axios = require('axios');

// Configuration
const USER_ID = 32; // The user ID to test with
const PLAN_ID = 2; // The plan ID to test with
const BATCH_SERVICE_URL = config.services.batch.url; // URL of the batch service
const API_GATEWAY_URL = config.services.apiGateway.url; // URL of the API Gateway

// Get Auth0 M2M configuration
const AUTH0_DOMAIN = config.auth.auth0.domain;
const AUTH0_CLIENT_ID = config.auth.auth0.clientId;
const AUTH0_CLIENT_SECRET = config.auth.auth0.clientSecret;
const AUTH0_AUDIENCE = config.auth.auth0.audience;

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

/**
 * Run the Retry Failed Payments batch job
 * @returns {Promise<Object>} - The result of the batch job
 */
async function runRetryFailedPaymentsBatch() {
  try {
    console.log('Getting M2M token...');
    const token = await getM2MToken();

    console.log('Running batch job...');
    const response = await axios.post(`${API_GATEWAY_URL}/api/admin/batches/run/retry-failed-payments`, {
      force: true // Force retry of failed payments even if they were recently retried
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

/**
 * Verify that the Retry Failed Payments batch job retried the expected payment
 * @returns {Promise<boolean>} - Whether the verification was successful
 */
async function verifyRetryFailedPaymentsBatchJob() {
  try {
    console.log('Verifying Retry Failed Payments batch job results...');
    
    // Check if the payment was retried
    const payment = await knex('payments')
      .where('user_id', USER_ID)
      .where('status', 'failed')
      .where('retry_count', '>', 0)
      .first();
    
    if (!payment) {
      console.error('No failed payment with retry count > 0 found');
      return false;
    }
    
    console.log(`Payment with ID ${payment.payment_id} was retried successfully`);
    return true;
  } catch (error) {
    console.error('Error verifying Retry Failed Payments batch job results:', error);
    return false;
  }
}

/**
 * Test the Retry Failed Payments batch job
 */
async function testRetryFailedPayments() {
  try {
    console.log('Starting test for Retry Failed Payments batch job...');
    
    // Step 1: Create test data
    console.log('\nStep 1: Creating test data...');
    const paymentId = await createTestPayment('failed', 0);
    console.log(`Created test payment with ID ${paymentId}`);
    
    // Step 2: Run the batch job
    console.log('\nStep 2: Running the batch job...');
    let jobId;
    try {
      const response = await axios.post(`${API_GATEWAY_URL}/api/admin/batches/run/retry-failed-payments`, {
        force: true // Force retry of failed payments even if they were recently retried
      });
      console.log('Batch job started successfully:', response.data);
      jobId = response.data.jobId;
    } catch (error) {
      console.error('Error running batch job:', error.response ? error.response.data : error.message);
      throw error;
    }
    
    // Step 3: Verify the results
    console.log('\nStep 3: Verifying the results...');
    const verificationResult = await verifyRetryFailedPaymentsBatchJob();
    
    if (verificationResult) {
      console.log('\nTest completed successfully!');
      return { success: true };
    } else {
      console.error('\nTest failed!');
      return { success: false };
    }
  } catch (error) {
    console.error('Error testing Retry Failed Payments batch job:', error);
    return { success: false };
  }
}

// Run the script if it's executed directly
if (require.main === module) {
  testRetryFailedPayments()
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
  runRetryFailedPaymentsBatch
}; 