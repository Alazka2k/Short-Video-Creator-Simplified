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
        int plan_id PK
        varchar plan_name
        int monthly_token_allocation
        decimal price
        text description
    }

    user_subscriptions {
        int subscription_id PK
        uuid user_id FK
        int plan_id FK
        date start_date
        date end_date
        varchar status
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
        timestamp transaction_date
    }

    payments {
        int payment_id PK
        uuid user_id FK
        decimal amount
        varchar currency
        varchar payment_method
        varchar status
        timestamp payment_date
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
- **plans**: Subscription plan definitions with token allocations and pricing
- **user_subscriptions**: Tracks user plan subscriptions with start/end dates and status
- **tokens**: Manages user token balances with last update tracking
- **token_transactions**: Records all token usage with transaction types and amounts
- **payments**: Stores payment history with amounts, methods, and status tracking

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
   - Subscriptions influence token availability
   - Token usage tracks across all operations

## Data Flow

1. **User Initialization**:
   - Account creation in users table
   - Role assignment in user_roles
   - Subscription setup in user_subscriptions

2. **Job Creation**:
   - Job record created with UUID
   - Initial prompt and parameters stored
   - Service sequence defined

3. **Content Generation**:
   - LLM processing creates input and output records
   - Scene breakdown stored in llm_scenes
   - Service outputs created per scene

4. **Resource Tracking**:
   - Token transactions recorded for each operation
   - Payment records created for purchases
   - Resource usage tracked in metadata

5. **Final Assembly**:
   - Assembly configuration stored
   - Final video details recorded
   - Job status updated to complete

## Recent Enhancements

1. **UUID Implementation**:
   - Consistent UUID usage across all tables
   - Improved scalability and security
   - Better distributed system support

2. **Metadata Management**:
   - Standardized JSON metadata storage
   - Enhanced error tracking
   - Improved service configuration storage

3. **Service Integration**:
   - Added assembly_outputs table
   - Standardized timestamps across tables
   - Enhanced scene-job relationships

4. **Performance Optimization**:
   - Direct job-scene linkage
   - Efficient query paths
   - Optimized relationship structures

## Data Flow

1. A user creates an account, stored in the `users` table.
2. The user subscribes to a plan, recorded in `user_subscriptions`.
3. When a job is created, it's stored in the `jobs` table, including the initial prompt.
4. The LLM service processes the job, storing inputs in `llm_inputs` and outputs in `llm_outputs`.
5. Individual scenes from the LLM output are stored in `llm_scenes`, now linked directly to the job.
6. As each subsequent service (image, voice, animation, video) processes the job, outputs are stored in respective tables.
7. Token usage for the job is recorded in `token_transactions`.
8. Payments for subscriptions or token purchases are stored in the `payments` table.

## Recent Changes

1. The `jobs` table now includes a `prompt` column to store the initial input prompt.
2. The `job_id` in the `jobs` table is now a UUID instead of an integer for improved scalability and security.
3. The `llm_scenes` table now includes a `job_id` column for direct linkage to jobs, optimizing queries and data retrieval.
4. All service output tables (image, voice, music, animation, video) now use the UUID `job_id` for consistency.

These changes improve data organization, query efficiency, and provide a more direct link between jobs and their associated scenes and outputs across all services.