# Subscription Service API Reference

The Subscription Service provides endpoints for managing subscription plans, user subscriptions, token transactions, and payment history. This document outlines all available endpoints with request and response examples.

**Base URL**: `/api/subscription`

All endpoints include proper authentication and authorization checks.

---

## Plan Management

### 1. ✅ List All Plans
Retrieves all available subscription plans.

**Endpoint**: `GET /plans`

**Parameters**:
- `includeInactive` (optional, query): Set to `true` to include inactive plans. Default is `false`.
- `sortBy` (optional, query): Field to sort by. Valid values: `plan_id`, `plan_name`, `monthly_price`, `price`, `created_at`, `billing_frequency`. Default is `monthly_price`.
- `sortOrder` (optional, query): Sort order. Valid values: `asc` or `desc`. Default is `asc`.
- `billingFrequency` (optional, query): Filter plans by billing frequency. Valid values: `monthly` or `yearly`.

**Example Requests**:
- `GET /plans` - Returns all active plans sorted by monthly_price ascending (default)
- `GET /plans?sortBy=plan_id&sortOrder=desc` - Returns all active plans sorted by plan_id descending
- `GET /plans?billingFrequency=monthly&sortBy=plan_name` - Returns monthly plans sorted by plan name ascending


**Response Example**:
```json
{
  "success": true,
  "data": [
    {
      "plan_id": 1,
      "plan_name": "Free",
      "price": 0.00,
      "monthly_price": 0.00,
      "billing_frequency": "monthly",
      "monthly_token_allocation": 300,
      "active": true,
      "max_scenes_per_job": 5,
      "max_jobs_per_month": 10,
      "video_quality": null,
      "visual_selection_count": 2,
      "voice_selection_count": 3,
      "template_selection_count": 3,
      "has_watermark": true,
      "script_settings_enabled": false,
      "support_level": "community",
      "allowed_content_types": ["image", "text", "voice"],
      "recreation_enabled": false,
      "recreation_content_types": [],
      "marketing_description": {
        "features": [
          "Free tier with basic features",
          "Limited to 5 scenes per job",
          "300 tokens per month"
        ]
      },
      "created_at": "2023-11-01T12:00:00.000Z",
      "updated_at": "2023-11-01T12:00:00.000Z"
    }
  ]
}
```

### 2. ✅ Get Plan Details
Retrieves details for a specific plan.

**Endpoint**: `GET /plans/:planId`

**URL Parameters**:
- `planId`: The ID of the plan (integer)

**Response Example**:
```json
{
  "success": true,
  "data": {
    "plan_id": 2,
    "plan_name": "Basic Tier",
    "price": 24.99,
    "monthly_price": 24.99,
    "billing_frequency": "monthly",
    "monthly_token_allocation": 2500,
    "active": true,
    "max_scenes_per_job": 13,
    "max_jobs_per_month": 45,
    "video_quality": "540p",
    "visual_selection_count": 9,
    "voice_selection_count": 9,
    "template_selection_count": 10,
    "has_watermark": false,
    "script_settings_enabled": true,
    "support_level": "community",
    "allowed_content_types": ["image", "voice", "animation", "video", "music"],
    "recreation_enabled": false,
    "recreation_content_types": [],
    "marketing_description": {
      "features": [
        "All content types",
        "YouTube Shorts & TikTok support",
        "Enhanced quality options"
      ]
    },
    "created_at": "2023-11-01T12:00:00.000Z",
    "updated_at": "2023-11-01T12:00:00.000Z"
  }
}
```

---
