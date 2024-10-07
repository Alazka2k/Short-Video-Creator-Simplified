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
    %% User Management
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
    jobs ||--o{ token_transactions : relates
    jobs ||--o{ llm_scenes : contains

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
        int user_id PK
        varchar email
        varchar password_hash
        varchar first_name
        varchar last_name
    }
    roles {
        int role_id PK
        varchar role_name
        text description
    }
    user_roles {
        int user_id FK
        int role_id FK
    }
    jobs {
        uuid job_id PK
        int user_id FK
        varchar status
        jsonb service_sequence
        jsonb metadata
        text prompt
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
        int user_id FK
        int plan_id FK
        date start_date
        date end_date
        varchar status
    }
    tokens {
        int token_id PK
        int user_id FK
        int balance
        timestamp last_updated
    }
    token_transactions {
        int transaction_id PK
        int user_id FK
        uuid job_id FK
        varchar transaction_type
        int amount
        timestamp transaction_date
    }
    payments {
        int payment_id PK
        int user_id FK
        decimal amount
        varchar currency
        varchar payment_method
        timestamp payment_date
        varchar status
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
        timestamp created_at
    }
    image_outputs {
        int image_id PK
        uuid job_id FK
        int scene_id FK
        text original_url
        text image_url
        varchar file_name
        timestamp created_at
        jsonb metadata
    }
    voice_outputs {
        int voice_id PK
        uuid job_id FK
        int scene_id FK
        text voice_file_url
        varchar voice_service_id
        timestamp created_at
        jsonb metadata
    }
    music_outputs {
        int music_output_id PK
        uuid job_id FK
        text music_file_url
        varchar title
        varchar tags
        boolean instrumental
        timestamp created_at
        jsonb metadata
    }
    animation_outputs {
        int animation_id PK
        uuid job_id FK
        int scene_id FK
        text original_pattern
        text animation_file_url
        timestamp created_at
        jsonb metadata
    }
    video_outputs {
        int video_id PK
        uuid job_id FK
        int scene_id FK
        text video_prompt
        varchar camera_movement
        varchar aspect_ratio
        text video_file_url
        timestamp created_at
        jsonb metadata
    }
{{< /mermaid >}}

## Table Descriptions

### User Management
- **users**: Stores user account information including first and last name.
- **roles**: Defines different user roles in the system.
- **user_roles**: Junction table linking users to their roles.

### Job Management
- **jobs**: Central table for tracking content creation jobs. Now includes a `prompt` column and uses UUID for `job_id`.

### Billing and Payments
- **plans**: Defines subscription plans available to users.
- **user_subscriptions**: Links users to their chosen subscription plans.
- **tokens**: Tracks token balances for each user.
- **token_transactions**: Records token usage for jobs.
- **payments**: Stores payment information for users.

### LLM Service
- **llm_inputs**: Stores input prompts and parameters for the LLM service.
- **llm_outputs**: Contains the generated output from the LLM service.
- **llm_scenes**: Breaks down LLM outputs into individual scenes. Now includes a direct link to `jobs` via `job_id`.

### Other Services
- **image_outputs**: Stores information about generated images.
- **voice_outputs**: Contains data related to voice generation.
- **music_outputs**: Stores information about generated music.
- **animation_outputs**: Contains data about created animations.
- **video_outputs**: Stores information about generated videos.

## Key Relationships

1. Users can have multiple roles, jobs, subscriptions, and token transactions.
2. Each job is associated with various service outputs (LLM, image, voice, etc.).
3. LLM outputs are broken down into scenes, which are then used by other services.
4. All service outputs are linked back to their originating job.
5. Scenes (llm_scenes) are now directly linked to jobs, improving query efficiency.

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