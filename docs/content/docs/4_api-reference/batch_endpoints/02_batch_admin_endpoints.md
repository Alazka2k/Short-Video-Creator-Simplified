# Batch Admin Endpoints

This document describes the admin-specific batch endpoints available in the API gateway. These endpoints allow administrators to directly execute specific batch jobs.

## Base URL

All batch admin endpoints are prefixed with `/api/admin/batches`.

## Authentication

All batch admin endpoints require authentication with admin privileges. Use the `Authorization` header with a Bearer token:

```
Authorization: Bearer <token>
```

## Required Permissions

To access these endpoints, the authenticated user must have the following permissions:
- `manage:batches` - Required for all batch admin endpoints

## Endpoints

### Run Create Payments Batch

Triggers the execution of the Create Payments batch job, which creates payment records for active subscriptions that are due for renewal.

```
POST /api/admin/batches/run/create-payments
```

#### Request Body

Optional parameters for the batch job:

```json
{
  "force": true
}
```

#### Response

```json
{
  "success": true,
  "message": "Create Payments batch job started successfully",
  "jobId": "job-123456",
  "startedAt": "2023-04-07T12:00:00Z"
}
```

### Run Collect Payments Batch

Triggers the execution of the Collect Payments batch job, which processes pending payments and updates their status based on the payment provider's response.

```
POST /api/admin/batches/run/collect-payments
```

#### Request Body

Optional parameters for the batch job:

```json
{
  "force": true
}
```

#### Response

```json
{
  "success": true,
  "message": "Collect Payments batch job started successfully",
  "jobId": "job-123457",
  "startedAt": "2023-04-07T12:00:00Z"
}
```

### Run Process Pending Cancellations Batch

Triggers the execution of the Process Pending Cancellations batch job, which processes subscriptions that are marked for cancellation and have reached their end date.

```
POST /api/admin/batches/run/process-pending-cancellations
```

#### Request Body

Optional parameters for the batch job:

```json
{
  "force": true
}
```

#### Response

```json
{
  "success": true,
  "message": "Process Pending Cancellations batch job started successfully",
  "jobId": "job-123458",
  "startedAt": "2023-04-07T12:00:00Z"
}
```

### Run Subscription Renewals Batch

Triggers the execution of the Subscription Renewals batch job, which updates the current_period_start and current_period_end for active subscriptions and allocates tokens for the users subscriptions.

```
POST /api/admin/batches/run/subscription-renewals
```

#### Request Body

Optional parameters for the batch job:

```json
{
  "force": true
}
```

#### Response

```json
{
  "success": true,
  "message": "Subscription Renewals batch job started successfully",
  "jobId": "job-123459",
  "startedAt": "2023-04-07T12:00:00Z"
}
```

### Run Retry Failed Payments Batch

Triggers the execution of the Retry Failed Payments batch job, which retries failed payments for subscriptions that are in the status `failed`.

```
POST /api/admin/batches/run/retry-failed-payments
```

#### Request Body

Optional parameters for the batch job:

```json
{
  "force": true
}
```

#### Response

```json
{
  "success": true,
  "message": "Retry Failed Payments batch job started successfully",
  "jobId": "job-123460",
  "startedAt": "2023-04-07T12:00:00Z"
}
```

### Get Batch Job Status

Returns the current status of a specific batch job execution.

```
GET /api/admin/batches/status/:jobId
```

#### Parameters

- `jobId` (path parameter): The ID of the job to check

#### Response

```json
{
  "jobId": "job-123456",
  "batchId": "create-payments",
  "status": "completed",
  "startedAt": "2023-04-07T12:00:00Z",
  "completedAt": "2023-04-07T12:01:00Z",
  "result": {
    "created": 5,
    "failed": 0,
    "total": 5
  }
}
```

### Cancel Batch Job

Cancels a running batch job.

```
POST /api/admin/batches/cancel/:jobId
```

#### Parameters

- `jobId` (path parameter): The ID of the job to cancel

#### Response

```json
{
  "success": true,
  "message": "Batch job cancelled successfully",
  "jobId": "job-123456",
  "cancelledAt": "2023-04-07T12:00:30Z"
}
``` 