/**
 * Script to test the Collect Payments batch job
 * 
 * This script:
 * 1. Creates test data for the Collect Payments batch job
 * 2. Runs the batch job
 * 3. Verifies that payments were collected as expected
 */

const axios = require('axios');
const knex = require('knex')(require('../../../knexfile')[process.env.NODE_ENV]);
const { createTestSubscription, createTestPayment } = require('../test-data/create-test-data');
const config = require('../../../shared/utils/config');

// Configuration
const BATCH_SERVICE_URL = config.services.batch.url; // URL of the batch service
const USER_ID = 32; // The user ID to test with
const PLAN_ID = 2; // The plan ID to test with

// Get API Gateway URL from config
const API_GATEWAY_URL = config.services.apiGateway.url;

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

async function runCollectPaymentsBatch() {
  try {
    console.log('Getting M2M token...');
    const token = await getM2MToken();

    console.log('Running batch job...');
    const response = await axios.post(`${API_GATEWAY_URL}/api/admin/batches/run/collect-payments`, {
      force: true // Force collection of payments even if they were already processed
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
 * Test the Collect Payments batch job
 */
async function testCollectPayments() {
  try {
    console.log('Testing Collect Payments batch job...');
    
    // Step 1: Create test data
    console.log('\nCreating test data...');
    const subscriptionId = await createTestSubscription();
    console.log(`Created test subscription with ID ${subscriptionId}`);
    
    const paymentId = await createTestPayment('pending', 0);
    console.log(`Created test pending payment with ID ${paymentId}`);
    
    // Step 2: Run the batch job
    console.log('\nRunning Collect Payments batch job...');
    let jobId;
    try {
      const response = await runCollectPaymentsBatch();
      console.log('Batch job started successfully:', response);
      jobId = response.jobId;
    } catch (error) {
      console.error('Error running batch job:', error.response ? error.response.data : error.message);
      throw error;
    }
    
    // Step 3: Verify the results
    console.log('\nVerifying results...');
    const payment = await knex('payments')
      .where('payment_id', paymentId)
      .first();
    
    if (!payment) {
      throw new Error('Payment not found');
    }
    
    console.log(`Payment status: ${payment.status}`);
    if (payment.status !== 'completed') {
      throw new Error(`Expected payment status to be 'completed', but got '${payment.status}'`);
    }
    
    console.log('\nTest completed successfully!');
    return {
      success: true,
      subscriptionId,
      paymentId,
      paymentStatus: payment.status
    };
  } catch (error) {
    console.error('Error testing Collect Payments batch job:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Run the script if it's executed directly
if (require.main === module) {
  testCollectPayments()
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
  testCollectPayments,
  runCollectPaymentsBatch
}; 