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
    }
    roles {
        int role_id PK
        varchar role_name
    }
    user_roles {
        int user_id FK
        int role_id FK
    }
    jobs {
        int job_id PK
        int user_id FK
        varchar status
        jsonb service_sequence
    }
    plans {
        int plan_id PK
        varchar plan_name
        int monthly_token_allocation
    }
    user_subscriptions {
        int subscription_id PK
        int user_id FK
        int plan_id FK
    }
    tokens {
        int token_id PK
        int user_id FK
        int balance
    }
    token_transactions {
        int transaction_id PK
        int user_id FK
        int job_id FK
    }
    payments {
        int payment_id PK
        int user_id FK
    }
    llm_inputs {
        int llm_input_id PK
        int job_id FK
        text prompt
    }
    llm_outputs {
        int llm_output_id PK
        int llm_input_id FK
    }
    llm_scenes {
        int scene_id PK
        int llm_output_id FK
    }
    image_outputs {
        int image_id PK
        int job_id FK
        int scene_id FK
    }
    voice_outputs {
        int voice_id PK
        int job_id FK
        int scene_id FK
    }
    music_outputs {
        int music_output_id PK
        int job_id FK
    }
    animation_outputs {
        int animation_id PK
        int job_id FK
        int scene_id FK
    }
    video_outputs {
        int video_id PK
        int job_id FK
        int scene_id FK
    }
{{< /mermaid >}}

## Table Descriptions

### User Management
- **users**: Stores user account information.
- **roles**: Defines different user roles in the system.
- **user_roles**: Junction table linking users to their roles.

### Job Management
- **jobs**: Central table for tracking content creation jobs.

### Billing and Payments
- **plans**: Defines subscription plans available to users.
- **user_subscriptions**: Links users to their chosen subscription plans.
- **tokens**: Tracks token balances for each user.
- **token_transactions**: Records token usage for jobs.
- **payments**: Stores payment information for users.

### LLM Service
- **llm_inputs**: Stores input prompts for the LLM service.
- **llm_outputs**: Contains the generated output from the LLM service.
- **llm_scenes**: Breaks down LLM outputs into individual scenes.

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

## Data Flow

1. A user creates an account, stored in the `users` table.
2. The user subscribes to a plan, recorded in `user_subscriptions`.
3. When a job is created, it's stored in the `jobs` table.
4. As each service processes the job, outputs are stored in respective tables (e.g., `llm_outputs`, `image_outputs`).
5. Token usage for the job is recorded in `token_transactions`.
6. Payments for subscriptions or token purchases are stored in the `payments` table.