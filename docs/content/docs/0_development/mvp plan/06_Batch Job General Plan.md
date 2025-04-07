# Batch Job General Plan

## Overview

This document outlines the plan for implementing batch processing functionality for the Short Video Creator application. The batch processing system will handle critical subscription and payment management tasks on a scheduled basis, ensuring the smooth operation of the subscription service.

## Batch Jobs Overview

The following batch jobs will be implemented:

1. **Process Pending Cancellations** (`process-pending-cancellations.js`)
   - Processes subscriptions marked for cancellation
   - Creates new subscriptions based on upcoming plans
   - Runs daily before other batch jobs

2. **Create Payments** (`create-payments-renewals.js`)
   - Creates payments for subscription renewals
   - Runs daily after 11:00 AM EST

3. **Subscription Renewals** (`subscription-renewals.js`)
   - Updates subscription periods and allocates tokens
   - Runs daily at 5:00 PM EST

4. **Collect Payments** (`collect-payments.js`)
   - Processes open payments
   - Runs daily at 3:00 PM EST

5. **Retry Failed Payments** (`retry-failed-payments.js`)
   - Retries failed payments
   - Runs daily at 4:00 PM EST

## Architecture Approach

We will implement a **Batch Processing Framework** rather than standalone scripts. This approach provides:

- Shared utilities and configuration
- Consistent error handling and logging
- API endpoints for manual triggering
- Future extensibility for monitoring and notifications

## Folder Structure

```
backend/batches/
├── config/                      # Configuration files
│   ├── database.js              # Database connection configuration
│   ├── services.js              # Service endpoints configuration
│   └── jobs.js                  # Job-specific configurations
├── core/                        # Core framework components
│   ├── jobLauncher.js           # Manages job execution
│   ├── job.js                   # Base job class
│   ├── step.js                  # Step execution logic
│   └── jobRepository.js         # Job metadata persistence
├── infrastructure/              # Shared infrastructure components
│   ├── readers/                 # Data reading components
│   │   └── subscriptionReader.js # Reads subscription data
│   ├── processors/              # Data processing components
│   │   └── paymentProcessor.js  # Processes payment data
│   └── writers/                 # Data writing components
│       └── serviceWriter.js     # Writes to subscription service
├── jobs/                        # Individual batch job implementations
│   ├── processPendingCancellations/
│   │   ├── index.js             # Job entry point
│   │   ├── steps/               # Job-specific steps
│   │   └── config.js            # Job-specific configuration
│   ├── createPayments/
│   │   ├── index.js
│   │   ├── steps/
│   │   └── config.js
│   ├── subscriptionRenewals/
│   │   ├── index.js
│   │   ├── steps/
│   │   └── config.js
│   ├── collectPayments/
│   │   ├── index.js
│   │   ├── steps/
│   │   └── config.js
│   └── retryFailedPayments/
│       ├── index.js
│       ├── steps/
│       └── config.js
├── utils/                       # Shared utilities
│   ├── logger.js                # Logging utility
│   ├── errorHandler.js          # Error handling utility
│   ├── serviceClient.js         # Client for calling subscription service
│   └── notificationService.js   # For future email notifications
├── logs/                        # Log files
│   └── .gitkeep                 # Placeholder to keep directory in git
├── routes/                      # API routes for manual triggering
│   └── batchRoutes.js           # Routes for batch job endpoints
├── server.js                    # Express server for batch API
└── index.js                     # Entry point for batch service
```

## Core Components

### Job Launcher

The job launcher will be responsible for:
- Starting jobs
- Tracking job execution status
- Handling job completion and errors
- Providing job status information

```javascript
// core/jobLauncher.js
class JobLauncher {
  constructor(jobRepository) {
    this.jobRepository = jobRepository;
  }

  async launchJob(jobName, parameters = {}) {
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const job = new Job(jobName, jobId, parameters);
    
    // Record job start
    await this.jobRepository.saveJobExecution(job);
    
    try {
      // Execute the job
      const result = await job.execute();
      
      // Record job completion
      await this.jobRepository.updateJobExecution(jobId, {
        status: 'COMPLETED',
        endTime: new Date(),
        result
      });
      
      return { jobId, status: 'COMPLETED', result };
    } catch (error) {
      // Record job failure
      await this.jobRepository.updateJobExecution(jobId, {
        status: 'FAILED',
        endTime: new Date(),
        error: error.message
      });
      
      throw error;
    }
  }

  async getJobStatus(jobId) {
    return this.jobRepository.getJobExecution(jobId);
  }
}
```

### Job Repository

The job repository will handle persistence of job metadata:

```javascript
// core/jobRepository.js
class JobRepository {
  constructor(db) {
    this.db = db;
  }

  async saveJobExecution(job) {
    // Save job metadata to database
    const jobExecution = {
      jobId: job.jobId,
      jobName: job.jobName,
      parameters: job.parameters,
      status: 'STARTING',
      startTime: new Date(),
      endTime: null,
      result: null,
      error: null
    };
    
    // Insert into database
    await this.db('batch_job_executions').insert(jobExecution);
    
    return jobExecution;
  }

  async updateJobExecution(jobId, updates) {
    // Update job metadata in database
    await this.db('batch_job_executions')
      .where({ jobId })
      .update(updates);
    
    return this.getJobExecution(jobId);
  }

  async getJobExecution(jobId) {
    // Retrieve job metadata from database
    return this.db('batch_job_executions')
      .where({ jobId })
      .first();
  }
}
```

## Job Implementation

Each job will follow a consistent pattern:

```javascript
// jobs/processPendingCancellations/index.js
const { Job } = require('../../core/job');
const { findPendingCancellations, processCancellation } = require('./steps');

class ProcessPendingCancellationsJob extends Job {
  constructor(jobId, parameters) {
    super('processPendingCancellations', jobId, parameters);
  }

  async execute() {
    // Step 1: Find pending cancellations
    const pendingCancellations = await findPendingCancellations();
    
    // Step 2: Process each cancellation
    const results = [];
    for (const subscription of pendingCancellations) {
      try {
        const result = await processCancellation(subscription);
        results.push({ subscriptionId: subscription.id, success: true, result });
      } catch (error) {
        results.push({ subscriptionId: subscription.id, success: false, error: error.message });
      }
    }
    
    return {
      processed: pendingCancellations.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      details: results
    };
  }
}

module.exports = ProcessPendingCancellationsJob;
```

## API Routes for Manual Triggering

```javascript
// routes/batchRoutes.js
const express = require('express');
const router = express.Router();
const { verifyAuth0Token } = require('../../api-gateway/middleware/auth0');
const jobLauncher = require('../core/jobLauncher');

// Middleware to check for admin permissions
const checkAdminPermission = (req, res, next) => {
  const permissions = req.user?.permissions || [];
  if (!permissions.includes('manage:batch')) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }
  next();
};

// Get all available jobs
router.get('/jobs', verifyAuth0Token, checkAdminPermission, (req, res) => {
  const jobs = [
    { name: 'process-pending-cancellations', description: 'Process subscriptions marked for cancellation' },
    { name: 'create-payments', description: 'Create payments for subscription renewals' },
    { name: 'subscription-renewals', description: 'Update subscription periods and allocate tokens' },
    { name: 'collect-payments', description: 'Process open payments' },
    { name: 'retry-failed-payments', description: 'Retry failed payments' }
  ];
  
  res.json({ jobs });
});

// Run a specific job
router.post('/jobs/:jobName/run', verifyAuth0Token, checkAdminPermission, async (req, res) => {
  try {
    const { jobName } = req.params;
    const parameters = req.body || {};
    
    const result = await jobLauncher.launchJob(jobName, parameters);
    
    res.json({
      success: true,
      message: 'Batch job started successfully',
      jobId: result.jobId,
      startedAt: new Date()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to start batch job',
      error: error.message
    });
  }
});

// Get job status
router.get('/jobs/:jobId/status', verifyAuth0Token, checkAdminPermission, async (req, res) => {
  try {
    const { jobId } = req.params;
    
    const jobStatus = await jobLauncher.getJobStatus(jobId);
    
    if (!jobStatus) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    res.json(jobStatus);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get job status',
      error: error.message
    });
  }
});

module.exports = router;
```

## API Gateway Integration

```javascript
// api-gateway/routes/batch.js
const express = require('express');
const router = express.Router();
const { verifyAuth0Token } = require('../middleware/auth0');
const axios = require('axios');
const config = require('../config');

// Forward all batch-related requests to the batch service
router.use('/', async (req, res) => {
  try {
    const batchServiceUrl = config.services.batch.url;
    const response = await axios({
      method: req.method,
      url: `${batchServiceUrl}${req.originalUrl}`,
      data: req.body,
      headers: {
        ...req.headers,
        host: new URL(batchServiceUrl).host
      }
    });
    
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Error forwarding request to batch service:', error);
    
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

module.exports = router;
```

## Implementation Plan

### Phase 1: Basic Framework Setup
- ✓ Create folder structure for batch jobs
- ✓ Implement core components (JobLauncher, JobRepository, JobDataAccess)
- ✓ Set up Express server for batch job API
- ✓ Integrate with API Gateway

### Phase 2: First Batch Job Implementation
- ✓ Implement Process Pending Cancellations job
- ✓ Test Process Pending Cancellations job
- ✓ Schedule Process Pending Cancellations job

### Phase 3: Remaining Batch Jobs Implementation
- ✓ Implement Create Payments job
- ✓ Test Create Payments job
- ✓ Schedule Create Payments job
- ✓ Implement Collect Payments job
- ✓ Test Collect Payments job
- ✓ Schedule Collect Payments job
- ✓ Implement Retry Failed Payments job
- ✓ Test Retry Failed Payments job
- ✓ Schedule Retry Failed Payments job
- ✓ Implement Subscription Renewals job
- ✓ Test Subscription Renewals job
- ✓ Schedule Subscription Renewals job

### Phase 4: Testing and Refinement
- ⏳ Test job interactions
- ⏳ Refine error handling
- ⏳ Optimize performance

### Phase 9: Future Enhancements
- ⏳ Implement email notifications for critical failures
- ⏳ Create detailed reports for CEO
- ⏳ Develop admin dashboard for monitoring batch job execution
  - ⏳ Job status visualization
  - ⏳ Manual triggering capabilities
  - ⏳ Execution history and logs
  - ⏳ Performance metrics

## Job Details

### Process Pending Cancellations

This batch job processes subscriptions that are marked for cancellation (`status='pending_cancellation'`) and have reached their end date.

**Flow:**
1. Identifies all pending cancellations where `end_date <= current_date` and status is `pending_cancellation`
2. Changes their status from `pending_cancellation` to `cancelled`
3. Sets the `ended_at` date to the current timestamp
4. Creates new subscriptions based on the `upcoming_plan_id`

**API Endpoints Used:**
- `PUT /api/subscription/subscriptions/:userId` - Update subscription status
- `POST /api/subscription/subscriptions` - Create new subscription

### Create Payments

This batch job creates payments for subscription renewals which are due.

**Flow:**
1. Identifies subscriptions with `billing_period_end` today or in the past with status `completed`
2. Excludes subscriptions in `pending_cancellation` or `cancelled` status
3. Creates a new payment entry for each eligible subscription

**API Endpoints Used:**
- `POST /api/subscription/payments` - Create new payment

### Subscription Renewals

This batch job updates the current `current_period_start` and `current_period_end` for the users subscriptions and allocates tokens for the users subscriptions.

**Flow:**
1. Identifies all subscriptions that are in the status `active`
2. Checks if the `current_period_end` is today or in the past
3. Updates the `current_period_start` and `current_period_end` to the next monthly period
4. Allocates tokens for the users subscriptions based on the `plan_id`

**API Endpoints Used:**
- `PUT /api/subscription/subscriptions/:userId/renew` - Renew subscription

### Collect Payments

This batch job collects payments for subscriptions that are in the status `open` and have a billing period start date today or in the past.

**Flow:**
1. Identifies all payments that are in the status `open`
2. Collects the payments with Stripe
3. Updates the payment status to `completed` if the payment was successful
4. Sets the payment information in the payment entry
5. Updates the payment status to `failed` if the payment was not successful

**API Endpoints Used:**
- `PUT /api/subscription/payments/:paymentId` - Update payment status

### Retry Failed Payments

This batch job retries failed payments for subscriptions that are in the status `failed`.

**Flow:**
1. Identifies all payments that are in the status `failed`
2. Retries the payments with Stripe
3. Updates the payment status to `completed` if the payment was successful
4. Updates the payment status to `failed` if the payment was not successful, adds a counter to the payment entry
5. If the payment is still not successful after 2 retries, the payment status is set to `cancelled` and the counter is incremented
6. The current subscription of the user is then cancelled (switched to the free tier)

**API Endpoints Used:**
- `PUT /api/subscription/payments/:paymentId` - Update payment status 