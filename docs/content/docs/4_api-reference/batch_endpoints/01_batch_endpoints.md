# Batch Endpoints

This document describes the batch endpoints available in the API gateway. These endpoints allow you to interact with the batch processing system.

## Base URL

All batch endpoints are prefixed with `/api/batch`.

## Authentication

All batch endpoints require authentication. Use the `Authorization` header with a Bearer token:

```
Authorization: Bearer <token>
```

## Endpoints

### Get All Available Batch Jobs

Retrieves a list of all available batch jobs with their descriptions and parameters.

```
GET /api/batch/batches
```

#### Response

```json
[
  {
    "id": "create-payments",
    "name": "Create Payments",
    "description": "Creates payments for subscription renewals which are due",
    "parameters": {
      "force": {
        "type": "boolean",
        "required": false,
        "description": "Force creation regardless of billing period end date"
      }
    }
  },
  {
    "id": "collect-payments",
    "name": "Collect Payments",
    "description": "Processes pending payments and updates their status",
    "parameters": {
      "force": {
        "type": "boolean",
        "required": false,
        "description": "Force collection regardless of payment status"
      }
    }
  },
  {
    "id": "process-pending-cancellations",
    "name": "Process Pending Cancellations",
    "description": "Processes subscriptions that are marked for cancellation and have reached their end date",
    "parameters": {
      "force": {
        "type": "boolean",
        "required": false,
        "description": "Force processing regardless of end date"
      }
    }
  },
  {
    "id": "subscription-renewals",
    "name": "Subscription Renewals",
    "description": "Updates subscription periods and allocates tokens for active subscriptions",
    "parameters": {
      "force": {
        "type": "boolean",
        "required": false,
        "description": "Force renewal regardless of period end date"
      }
    }
  }
]
```

### Run a Specific Batch

Triggers the execution of a specific batch with optional parameters.

```
POST /api/batch/batches/:batchId/run
```

#### Parameters

- `batchId` (path parameter): The ID of the batch to run

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
  "jobId": "job-123456",
  "status": "running",
  "startedAt": "2023-04-07T12:00:00Z"
}
```

### Get Batch Status

Returns the current status of a batch execution.

```
GET /api/batch/batches/:batchId/status
```

#### Parameters

- `batchId` (path parameter): The ID of the batch to check

#### Response

```json
{
  "jobId": "job-123456",
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

### Get Batch History

Returns the execution history of a specific batch.

```
GET /api/batch/batches/:batchId/history
```

#### Parameters

- `batchId` (path parameter): The ID of the batch to check
- `limit` (query parameter, optional): Maximum number of history entries to return (default: 10)
- `offset` (query parameter, optional): Number of history entries to skip (default: 0)

#### Response

```json
{
  "total": 25,
  "limit": 10,
  "offset": 0,
  "entries": [
    {
      "jobId": "job-123456",
      "status": "completed",
      "startedAt": "2023-04-07T12:00:00Z",
      "completedAt": "2023-04-07T12:01:00Z",
      "result": {
        "created": 5,
        "failed": 0,
        "total": 5
      }
    },
    {
      "jobId": "job-123455",
      "status": "failed",
      "startedAt": "2023-04-06T12:00:00Z",
      "completedAt": "2023-04-06T12:01:00Z",
      "error": "Failed to connect to payment service"
    }
  ]
}
```

### Get Batch Logs

Returns the logs for a specific batch execution.

```
GET /api/batch/batches/:batchId/logs
```

#### Parameters

- `batchId` (path parameter): The ID of the batch to check
- `jobId` (query parameter, optional): The ID of the specific job to get logs for
- `level` (query parameter, optional): Filter logs by level (info, warn, error)
- `limit` (query parameter, optional): Maximum number of log entries to return (default: 100)
- `offset` (query parameter, optional): Number of log entries to skip (default: 0)

#### Response

```json
{
  "total": 25,
  "limit": 10,
  "offset": 0,
  "entries": [
    {
      "timestamp": "2023-04-07T12:00:01Z",
      "level": "info",
      "message": "Starting create payments job"
    },
    {
      "timestamp": "2023-04-07T12:00:02Z",
      "level": "info",
      "message": "Fetching payments that need renewal"
    },
    {
      "timestamp": "2023-04-07T12:00:03Z",
      "level": "info",
      "message": "Found 5 payments that need renewal"
    }
  ]
}
``` 