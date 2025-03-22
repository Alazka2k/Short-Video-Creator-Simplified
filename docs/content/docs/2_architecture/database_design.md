---
title: "Database Architecture and Design"
linkTitle: "Database"
weight: 3
description: >
  A comprehensive overview of the SHORT-VIDEO-CREATOR-SIMPLIFIED database architecture and design.
---

## Overview

This document provides a detailed look at the current database architecture of the SHORT-VIDEO-CREATOR-SIMPLIFIED system, including both core tables and those related to specific services.

## Database Entity Relationship Diagram

The following diagram illustrates the structure and relationships of our database:

{{< mermaid >}}
erDiagram
    %% Core User Management
    users ||--o{ user_roles : has
    roles ||--o{ user_roles : assigned
    users ||--o{ jobs : creates
    users ||--o{ user_subscriptions : has
    users ||--o{ tokens : owns
    users ||--o{ token_transactions : makes
    users ||--o{ payments : makes

    %% Job Management
    jobs ||--o{ llm_inputs : has
    jobs ||--o{ image_outputs : has
    jobs ||--o{ voice_outputs : has
    jobs ||--o{ music_outputs : has
    jobs ||--o{ animation_outputs : has
    jobs ||--o{ video_outputs : has
    jobs ||--o{ assembly_outputs : has
    jobs ||--o{ token_transactions : relates

    %% LLM Service
    llm_inputs ||--|| llm_outputs : produces
    llm_outputs ||--o{ llm_scenes : contains

    %% Other Services
    llm_scenes ||--o{ image_outputs : generates
    llm_scenes ||--o{ voice_outputs : generates
    llm_scenes ||--o{ animation_outputs : generates
    llm_scenes ||--o{ video_outputs : generates

    %% Billing and Payments
    plans ||--o{ user_subscriptions : includes
    token_packages ||--o{ payments : purchased_via
    plans ||--o{ payments : paid_for
    user_subscriptions ||--o{ payments : generated

    %% Entity Definitions
    users {
        uuid user_id PK
        varchar email
        varchar password_hash
        timestamp created_at
        timestamp updated_at
    }

    roles {
        int role_id PK
        varchar role_name
        text description
    }

    user_roles {
        uuid user_id FK
        int role_id FK
    }

    jobs {
        uuid job_id PK
        uuid user_id FK
        varchar status
        jsonb service_sequence
        text prompt
        jsonb metadata
        text error
        timestamp created_at
        timestamp updated_at
    }

    plans {
        int plan_id PK  // 1 for free tier, 2 for basic (monthly paid), 3 for basic (yearly paid), 4 for creator (monthly paid), 5 for creator (yearly paid), 6 for professional (monthly paid), 7 for professional (yearly paid)
        varchar plan_name // free tier, basic, creator, professional
        varchar billing_frequency // monthly, yearly
        int monthly_token_allocation // 300 for free tier, 2500 for basic, 6500 for creator, 10000 for professional
        decimal price // 0 for free tier (plan_id 1), 24.99 for monthly basic (plan_id 2), 239.88 for yearly basic (plan_id 3), 39.99 for monthly creator (plan_id 4), 419.88 for yearly creator (plan_id 5), 59.99 for monthly professional (plan_id 6), 599.88 for yearly professional (plan_id 7)
        decimal monthly_price // 0 for free tier (plan_id 1), 24.99 (plan_id 2), 19.99 (plan_id 3), 39.99 (plan_id 4), 34.99 (plan_id 5), 59.99 (plan_id 6), 49.99 (plan_id 7)
        decimal annual_price // 0 for free tier (plan_id 1), 299.88 (plan_id 2), 239.88 (plan_id 3), 479.88 (plan_id 4), 419.88 (plan_id 5), 719.88 (plan_id 6), 599.88 (plan_id 7)
        boolean active // true for active plans, false for inactive plans
        int max_scenes_per_job
        int max_jobs_per_month
        varchar video_quality
        int visual_selection_count
        int voice_selection_count
        int template_selection_count
        boolean has_watermark
        boolean script_settings_enabled
        boolean recreation_enabled
        jsonb recreation_content_types
        varchar support_level
        jsonb allowed_content_types
        jsonb marketing_description
        timestamp created_at
        timestamp updated_at
    }

    token_packages {
        int package_id PK
        varchar package_name
        int token_allocation
        decimal price
        boolean active
        jsonb marketing_description
        timestamp created_at
        timestamp updated_at
    }

    user_subscriptions {
        int subscription_id PK
        uuid user_id FK
        int plan_id FK
        date start_date
        date end_date
        timestamp current_period_start
        timestamp current_period_end
        timestamp canceled_at
        timestamp ended_at
        varchar status
        timestamp created_at
        timestamp updated_at
        varchar external_subscription_id
    }

    tokens {
        int token_id PK
        uuid user_id FK
        int balance
        timestamp last_updated
    }

    token_transactions {
        int transaction_id PK
        uuid user_id FK
        uuid job_id FK
        varchar transaction_type
        int amount
        jsonb metadata
        timestamp created_at
        timestamp updated_at
        varchar description
        varchar external_service_name
        varchar related_entity_type // llm, image, voice, music, animation, video, assembly, subscription, token_package, other
        varchar related_entity_id // llm_id, image_id, voice_id, music_id, animation_id, video_id, assembly_id, subscription_id
        int payment_id FK
    }

    payments {
        int payment_id PK
        uuid user_id FK
        decimal amount
        varchar currency
        varchar payment_method
        varchar status
        timestamp payment_date
        varchar payment_type // token_package, subscription_initial, subscription_renewal
        int plan_id FK
        int package_id FK
        int subscription_id FK
        varchar external_payment_id
        date billing_period_start
        date billing_period_end
        jsonb payment_metadata
        varchar payment_provider
    }

    llm_inputs {
        int llm_input_id PK
        uuid job_id FK
        text prompt
        jsonb parameters
        timestamp created_at
    }

    llm_outputs {
        int llm_output_id PK
        int llm_input_id FK
        uuid job_id FK
        varchar title
        text description
        varchar hashtags
        varchar music_title
        text music_lyrics
        varchar music_tags
        timestamp created_at
    }

    llm_scenes {
        int scene_id PK
        int llm_output_id FK
        uuid job_id FK
        int scene_number
        text description
        text visual_prompt
        text video_prompt
        varchar camera_movement
        jsonb visual_metadata
        timestamp created_at
    }

    image_outputs {
        int image_id PK
        uuid job_id FK
        int scene_id FK
        text original_url
        text image_url
        varchar file_name
        jsonb metadata
        timestamp created_at
    }

    voice_outputs {
        int voice_id PK
        uuid job_id FK
        int scene_id FK
        text voice_file_url
        varchar voice_service_id
        jsonb metadata
        timestamp created_at
    }

    music_outputs {
        int music_output_id PK
        uuid job_id FK
        text music_file_url
        varchar title
        varchar tags
        boolean instrumental
        jsonb metadata
        timestamp created_at
    }

    animation_outputs {
        int animation_id PK
        uuid job_id FK
        int scene_id FK
        text original_pattern
        text animation_file_url
        jsonb metadata
        timestamp created_at
    }

    video_outputs {
        int video_id PK
        uuid job_id FK
        int scene_id FK
        text video_prompt
        varchar camera_movement
        varchar aspect_ratio
        text video_file_url
        jsonb metadata
        timestamp created_at
    }

    assembly_outputs {
        int assembly_id PK
        uuid job_id FK
        varchar status
        text video_file_url
        varchar project_id
        jsonb assembly_config
        jsonb metadata
        timestamp created_at
        timestamp updated_at
    }
{{< /mermaid >}}

# Database Documentation

## Table Descriptions

### User Management
- **users**: Core user account information with UUID-based identification, includes email, password hash, and timestamps for account creation and updates
- **roles**: System role definitions (e.g., admin, user) with descriptions of permissions
- **user_roles**: Many-to-many relationship table connecting users to their assigned roles

### Job Management
- **jobs**: Central table for content generation jobs using UUID primary keys
  - Tracks job status, input prompt, and service sequence
  - Stores metadata for job configuration and error information
  - Includes timestamps for job creation and updates

### Billing and Payments
- **plans**: Subscription plan definitions with expanded features
  - Multiple billing frequencies (monthly, yearly)
  - Pricing details including monthly_price, annual_price
  - Content limits (scenes per job, jobs per month)
  - Quality settings (video quality, visual/voice/template counts)
  - Feature flags (watermark, script settings, recreation options)
  - Allowed content types and recreation content types as JSON arrays
  - Support level information
  - Marketing descriptions for presentation
  - Active status flag to manage available plans

- **token_packages**: One-time purchase token packages
  - Package name and token allocation
  - Price information
  - Marketing description for display
  - Active status to control availability

- **user_subscriptions**: Tracks user plan subscriptions with enhanced period tracking
  - Start/end dates and current period tracking
  - Cancellation and ending timestamps
  - Status tracking (active, canceled)

- **tokens**: Manages user token balances with last update tracking

- **token_transactions**: Enhanced token usage tracking
  - Transaction types (allocation, deduction, purchase)
  - Amount tracking
  - Service type identification (llm, image, voice, etc.)
  - Service-specific IDs for detailed tracking
  - Metadata for additional transaction details

- **payments**: Comprehensive payment history with enhanced tracking
  - Standard payment details (amount, currency, method, status)
  - Payment type classification (subscription_initial, subscription_renewal, token_package)
  - References to related entities (plan, package, subscription)
  - External payment processor IDs
  - Billing period tracking
  - Payment metadata for additional details

### LLM Service
- **llm_inputs**: 
  - Stores initial prompts and generation parameters
  - Links to jobs via UUID for tracking
  - Includes creation timestamp for audit trails

- **llm_outputs**: 
  - Contains generated content including title, description, hashtags
  - Stores music-related content (title, lyrics, tags)
  - Links to both job and input records

- **llm_scenes**: 
  - Detailed scene breakdowns with descriptions and prompts
  - Includes visual_metadata for image generation parameters
  - Direct job linkage for efficient querying
  - Stores camera movement instructions

### Content Generation Services
- **image_outputs**: 
  - Tracks generated images with URLs and filenames
  - Links to specific scenes and jobs
  - Stores metadata about image generation

- **voice_outputs**: 
  - Records voice generation results with file URLs
  - Includes voice service identification
  - Maintains metadata about voice generation

- **music_outputs**: 
  - Stores music generation results with file URLs
  - Tracks title, tags, and instrumental status
  - Includes metadata about music generation

- **animation_outputs**: 
  - Records animation patterns and file URLs
  - Links to specific scenes and jobs
  - Stores metadata about animation generation

- **video_outputs**: 
  - Tracks video generation with prompts and file URLs
  - Includes camera movement and aspect ratio information
  - Maintains metadata about video generation

- **assembly_outputs**:
  - Manages final video assembly process
  - Tracks JSON2Video project information
  - Stores assembly configuration and status

## Key Relationships

1. **User-Centric Relations**:
   - Users maintain multiple roles through user_roles
   - Users own jobs, subscriptions, and token balances
   - Users generate transaction and payment records

2. **Job-Centric Relations**:
   - Jobs connect to all service outputs via UUID
   - Jobs track token usage through transactions
   - Jobs maintain complete service history

3. **Content Generation Flow**:
   - LLM outputs generate multiple scenes
   - Scenes connect to various content outputs
   - All content links back to original job

4. **Billing Integration**:
   - Plans connect to user subscriptions
   - Plans and token packages connect to payments
   - Subscriptions influence token availability
   - Token usage tracks across all operations
   - Payments track all financial transactions with full context

## Data Flow

1. **User Initialization**:
   - Account creation in users table
   - Role assignment in user_roles
   - Subscription setup in user_subscriptions
   - Initial payment recorded in payments table

2. **Subscription Management**:
   - Plan selection from active plans
   - Subscription creation/update
   - Payment processing and recording
   - Token allocation based on plan

3. **Token Package Purchases**:
   - Package selection from active packages
   - Payment processing and recording
   - Token allocation to user balance

4. **Job Creation**:
   - Job record created with UUID
   - Initial prompt and parameters stored
   - Service sequence defined

5. **Content Generation**:
   - LLM processing creates input and output records
   - Scene breakdown stored in llm_scenes
   - Service outputs created per scene
   - Token transactions recorded for each service

6. **Resource Tracking**:
   - Token transactions recorded for each operation
   - Payment records created for purchases
   - Resource usage tracked in metadata

7. **Final Assembly**:
   - Assembly configuration stored
   - Final video details recorded
   - Job status updated to complete

## Recent Enhancements

1. **Enhanced Plan Structure**:
   - Expanded plan details with operational limits
   - Support for multiple billing frequencies
   - Feature flags for capabilities like recreation
   - Tiered content type permissions
   - Marketing descriptions for display

2. **Token Package Management**:
   - Dedicated token_packages table
   - Active status control
   - Marketing descriptions

3. **Enhanced Payment Tracking**:
   - Payment type classification
   - Direct links to plans, packages, and subscriptions
   - External payment IDs
   - Billing period tracking
   - Payment metadata support

4. **Improved Token Transaction Tracking**:
   - Service-specific tracking
   - Enhanced metadata
   - Better job and scene linkage

5. **UUID Implementation**:
   - Consistent UUID usage across all tables
   - Improved scalability and security
   - Better distributed system support

6. **Metadata Management**:
   - Standardized JSON metadata storage
   - Enhanced error tracking
   - Improved service configuration storage

These enhancements provide a more robust foundation for the subscription and token-based billing system, while maintaining the existing content generation workflow. The structure now better supports various billing models, detailed usage tracking, and comprehensive payment history.