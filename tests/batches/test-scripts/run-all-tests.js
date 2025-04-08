/**
 * Script to run all batch job tests
 * 
 * This script:
 * 1. Creates all necessary test data
 * 2. Runs all batch job tests
 * 3. Reports the results of all tests
 */

const { createAllTestData } = require('../test-data/create-test-data');
const testCreatePayments = require('./test-create-payments');
const testCollectPayments = require('./test-collect-payments');
const testRetryFailedPayments = require('./test-retry-failed-payments');
// Import other test scripts as they are created
// const { testProcessPendingCancellationsBatchJob } = require('./test-process-pending-cancellations');
// const { testRenewSubscriptionsBatchJob } = require('./test-renew-subscriptions');

/**
 * Run all batch job tests
 */
async function runAllTests() {
  try {
    console.log('Starting all batch job tests...');
    
    // Step 1: Create all test data
    console.log('\nCreating all test data...');
    const testData = await createAllTestData();
    console.log('Test data created successfully:', JSON.stringify(testData, null, 2));
    
    // Step 2: Run all tests
    console.log('\nRunning all tests...');
    
    // Test Create Payments batch job
    console.log('\nTesting Create Payments batch job...');
    const createPaymentsResult = await testCreatePayments();
    console.log('Create Payments test result:', JSON.stringify(createPaymentsResult, null, 2));
    
    // Test Collect Payments batch job
    console.log('\nTesting Collect Payments batch job...');
    const collectPaymentsResult = await testCollectPayments();
    console.log('Collect Payments test result:', JSON.stringify(collectPaymentsResult, null, 2));
    
    // Test Retry Failed Payments batch job
    console.log('\nTesting Retry Failed Payments batch job...');
    const retryFailedPaymentsResult = await testRetryFailedPayments();
    console.log('Retry Failed Payments test result:', JSON.stringify(retryFailedPaymentsResult, null, 2));
    
    // Step 3: Report results
    console.log('\nTest Results:');
    console.log('-------------');
    console.log('Create Payments:', createPaymentsResult.success ? 'PASSED' : 'FAILED');
    console.log('Collect Payments:', collectPaymentsResult.success ? 'PASSED' : 'FAILED');
    console.log('Retry Failed Payments:', retryFailedPaymentsResult.success ? 'PASSED' : 'FAILED');
    
    // Check if all tests passed
    const allTestsPassed = createPaymentsResult.success && 
                          collectPaymentsResult.success && 
                          retryFailedPaymentsResult.success;
    
    if (allTestsPassed) {
      console.log('\nAll tests passed successfully!');
      return {
        success: true,
        results: {
          createPayments: createPaymentsResult,
          collectPayments: collectPaymentsResult,
          retryFailedPayments: retryFailedPaymentsResult
        }
      };
    } else {
      console.error('\nAll tests failed!');
      return {
        success: false,
        results: {
          createPayments: createPaymentsResult,
          collectPayments: collectPaymentsResult,
          retryFailedPayments: retryFailedPaymentsResult
        }
      };
    }
  } catch (error) {
    console.error('Error running tests:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Run the script if it's executed directly
if (require.main === module) {
  runAllTests()
    .then((result) => {
      console.log('\nFinal result:', result);
      process.exit(result.success ? 0 : 1);
    })
    .catch((error) => {
      console.error('Error:', error);
      process.exit(1);
    });
}

module.exports = runAllTests; 