# SHORT-VIDEO-CREATOR-SIMPLIFIED

## Table of Contents
1. [Introduction](#introduction)
2. [Project Overview](#project-overview)
3. [Features](#features)
4. [Prerequisites](#prerequisites)
5. [Installation](#installation)
6. [Configuration](#configuration)
7. [Usage](#usage)
8. [Project Structure](#project-structure)
9. [Architecture](#architecture)
10. [API Integrations](#api-integrations)
11. [Data Storage System](#data-storage-system)
12. [Database Architecture and Design](#database-architecture-and-design)
13. [Output Format](#output-format)
14. [Testing](#testing)
15. [Source Code Export](#source-code-export)
16. [Storage Setup](#storage-setup)
17. [Applying Database Migrations](#applying-database-migrations)

## Introduction

SHORT-VIDEO-CREATOR-SIMPLIFIED is a powerful Node.js application designed to revolutionize the content creation process for short-form videos. By harnessing the capabilities of various AI services, this tool automates the generation of engaging scripts, lifelike voice narrations, compelling images, animations, background music, and videos, producing a comprehensive package of content ready for final video editing.

## Project Overview

This project aims to streamline the content creation pipeline by integrating several cutting-edge AI services:
- Language Model (LLM) for dynamic script generation
- Voice Generation (Elevenlabs) for natural-sounding narration
- Image Creation (Midjourney) for visually stunning scenes
- Animation Generation (Immersity AI) for creating animations from static images
- Music Generation (Suno) for custom background tracks
- Video Generation (Luma AI) for creating video content from images and prompts
- Video Assembly (Creatomate) for final video compilation with different templates

## Features

### Core USP Features
- AI-powered script generation using advanced GPT models
- Realistic voice narration synthesis using Elevenlabs
- AI-generated images using Midjourney
- Animation creation from static images using Immersity AI
- Custom background music generation using Suno AI
- Video generation from images and prompts using Luma AI
- Structured output optimized for video editing workflows
- Highly configurable pipeline to suit various content needs
- Content download (all and individual)
- Subscription and token management system
- Video assembly possibility with predefined templates

### Frontend Features
- Modern, responsive React/Next.js application
- Authentication system with Auth0 integration
- Protected routes and M2M token flow
- Dark/Light mode support
- Content creation workflow with:
  - Script settings customization
  - Visual style selection
  - Format selection (aspect ratios)
  - Scene transition management
  - Preview capabilities for all media types
- Dashboard with:
  - Project overview
  - Job management
  - Content organization
  - Quick actions menu

### System Features
- API Gateway for centralized request handling
- Microservices architecture
- Database integration for all services
- AWS S3 storage integration
- Authentication and authorization system
- Token and subscription management system for monetization
- Comprehensive error handling
- Detailed logging system

## Prerequisites

- Node.js (v14.0.0 or later)
- npm (v6.0.0 or later)
- PostgreSQL database
- API keys and authentication for the following services:
  - OpenAI (GPT) for script generation
  - Elevenlabs for voice synthesis
  - Midjourney for image generation
  - Immersity AI for animation generation
  - Suno for music generation
  - Luma AI for video generation
- JSON2Video API key for video assembly

## Installation (Local Development)

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/SHORT-VIDEO-CREATOR-SIMPLIFIED.git
   cd SHORT-VIDEO-CREATOR-SIMPLIFIED
   ```

2. Install Node.js dependencies:
   ```
   npm install
   ```

3. Set up the PostgreSQL database:
   - Create a new database for the project
   - Run the migration scripts in the `database/migrations/` directory

4. Set up the environment variables:
   - Copy `.env.example` to `.env.[environment]`
   - Edit `.env.[environment]` and add your API keys and other settings.

## Deployment

## Usage

1. Run the frontend
2. Login or register
3. Go to the content creation page
4. Input your prompt for content and set options
5. Click generate
6. Wait for the content to be generated
7. Download the content
8. Use the assembly service and select different templates to create a video
9. Download the video and use it

## Project Structure

```
SHORT-VIDEO-CREATOR-SIMPLIFIED/
├── config/
│   ├── default.example.json
│   └── default.json
├── data/
│   ├── input/
│   │   ├── initial_prompt.txt
│   │   ├── input.csv
│   │   └── parameters.json
│   └── output/
├── docs/
├── logs/
├── node_modules/
├── backend/
│   ├── api-gateway/
│   │   ├── config/
│   │   │   └── permissions.js
│   │   ├── middleware/
│   │   │   ├── auth0.js
│   │   │   ├── mediaAuth.js
│   │   │   ├── serviceAuth.js
│   │   │   ├── userTokenExtractor.js
│   │   ├── routes/
│   │   │   ├── animation.js
│   │   │   ├── assembly.js
│   │   │   ├── auth.js
│   │   │   ├── docs.js
│   │   │   ├── download.js
│   │   │   ├── image.js
│   │   │   ├── job.js
│   │   │   ├── llm.js
│   │   │   ├── music.js
│   │   │   ├── storage.js
│   │   │   ├── subscription.js
│   │   │   ├── video.js
│   │   │   └── voice.js
│   │   └── server.js
│   ├── batches/
│   ├── services/
│   │   ├── auth-service/
│   │   │   ├── controllers/
│   │   │   │   ├── email-auth-controller.js
│   │   │   │   ├── social-auth-controller.js
│   │   │   │   └── user-controller.js
│   │   │   ├── data/
│   │   │   │   └── authDataAccess.js
│   │   │   ├── middleware/
│   │   │   │   └── jwt-verify.middleware.js
│   │   │   ├── services/
│   │   │   │   ├── email-auth.service.js
│   │   │   │   ├── social-auth.service.js
│   │   │   │   ├── session.service.js
│   │   │   │   └── user.service.js
│   │   │   ├── utils/
│   │   │   │   └── token.js
│   │   │   ├── auth0.js
│   │   │   └── auth-service.js
│   │   ├── job-service/
│   │   │   ├── data/
│   │   │   │   └── jobDataAccess.js
│   │   │   ├── job-pipeline-service.js
│   │   │   ├── server.js
│   │   │   └── index.js
│   │   ├── llm-service/
│   │   │   ├── data/
│   │   │   │   └── llmDataAccess.js
│   │   │   ├── llm-service.js
│   │   │   ├── server.js
│   │   │   └── index.js
│   │   ├── image-service/
│   │   │   ├── data/
│   │   │   │   └── imageDataAccess.js
│   │   │   ├── image-gen-service.js
│   │   │   ├── server.js
│   │   │   └── index.js
│   │   ├── voice-service/
│   │   │   ├── data/
│   │   │   │   └── voiceDataAccess.js
│   │   │   ├── voice-gen-service.js
│   │   │   ├── server.js
│   │   │   └── index.js
│   │   ├── music-service/
│   │   │   ├── data/
│   │   │   │   └── musicDataAccess.js
│   │   │   ├── music-gen-service.js
│   │   │   ├── server.js
│   │   │   ├── index.js
│   │   │   └── suno_auth.js
│   │   ├── animation-service/
│   │   │   ├── data/
│   │   │   │   └── animationDataAccess.js
│   │   │   ├── animation-gen-service.js
│   │   │   ├── server.js
│   │   │   └── index.js
│   │   ├── assembly-service/
│   │   │   ├── data/
│   │   │   │   └── assemblyDataAccess.js
│   │   │   ├── assembly-service.js
│   │   │   ├── server.js
│   │   │   └── index.js
│   │   ├── subscription-service/
│   │   │   ├── controllers/
│   │   │   │   ├── paymentController.js
│   │   │   │   ├── planController.js
│   │   │   │   ├── subscriptionController.js
│   │   │   │   ├── tokenController.js
│   │   │   │   ├── tokenPackageController.js
│   │   │   │   └── webhookController.js
│   │   │   ├── data/
│   │   │   │   ├── paymentDataAccess.js
│   │   │   │   ├── planDataAccess.js
│   │   │   │   ├── subscriptionDataAccess.js
│   │   │   │   ├── tokenBalanceDataAccess.js
│   │   │   │   ├── tokenPackageDataAccess.js
│   │   │   │   └── tokenTransactionDataAccess.js
│   │   │   ├── middleware/
│   │   │   │   └── errorHandler.js
│   │   │   │   └── validation.js
│   │   │   ├── routes/
│   │   │   │   ├── paymentRoutes.js
│   │   │   │   ├── planRoutes.js
│   │   │   │   ├── subscriptionRoutes.js
│   │   │   │   ├── tokenPackageRoutes.js
│   │   │   │   ├── tokenRoutes.js
│   │   │   │   └── webhookRoutes.js
│   │   │   ├── services/
│   │   │   │   ├── paymentService.js
│   │   │   │   ├── planService.js
│   │   │   │   ├── subscriptionService.js
│   │   │   │   ├── tokenPackageService.js
│   │   │   │   └── tokenService.js
│   │   │   ├── utils/
│   │   │   │   ├── stripeService.js
│   │   │   │   └── tokenCalculator.js
│   │   │   ├── server.js
│   │   │   └── index.js
│   │   └── video-service/
│   │       ├── data/
│   │       │   └── videoDataAccess.js
│   │       ├── video-gen-service.js
│   │       ├── server.js
│   │       └── index.js
│   └── shared/
│       ├── middleware/
│       ├── utils/
│       └── config/
├── frontend/
│   └── src/
│       ├── app/
│       ├── components/
│       ├── lib/
│       ├── types/
│       └── styles/
├── database/
│   ├── migrations/
│   ├── seeds/
│   └── resetDatabase.js
├── data/
│   ├── input/
│   ├── output/
├── infrastructure/
│   ├── docker/
│   └── kubernetes/
├── tests/
│   ├── discord-websocket-test.js
│   ├── image-download-test.js
│   ├── image-gen-test.js
│   ├── integration-test.js
│   ├── llm-test.js
│   ├── midjourney-test.js
│   ├── music-gen-test.js
│   ├── video-gen-test.js
│   ├── voice-gen-test.js
│   ├── animation-gen-test.js
│   ├── animation-pattern-generator-test.js
│   ├── database/
│   └── test_output/
├── .gitignore
├── package.json
├── package-lock.json
├── knexfile.js
└── README.md
```

## Architecture

The full stack application follows a microservices architecture designed for flexibility and maintainability:

1. Backend Application: Handles all the backend logic and services
2. Frontend Application: Offers a user-friendly interface for interacting with the backend services
3. Database: Stores persistent data for jobs, inputs, outputs, and service-specific information

### Backend Architecture

The backend application follows a microservices architecture designed for flexibility and maintainability:

1. API Gateway: Handles routing and direct communication with all services
2. LLM Service: Generates dynamic script content based on input and parameters
3. Voice Generation Service: Synthesizes natural-sounding narration from the generated script
4. Image Generation Service: Creates visual content based on scene descriptions
5. Music Generation Service: Produces custom background music tracks
6. Animation Generation Service: Creates animations from static images
7. Video Generation Service: Creates video content from images and prompts
8. Job Service: Orchestrates the content generation process and manages job statuses
9. Assembly Service: Assembles the final video from all the generated content
10. Authentication Service: Manages user registration, login, and authorization
11. Subscription Service: Handles subscription management, token management and billing
12. Batch Service: Handles batch jobs and job scheduling
13. File Storage System: Will store generated media files
14. Shared Utilities: Provides common functionality across services

Each service runs independently, and the API Gateway communicates directly with each service using HTTP requests, allowing for better scalability and easier maintenance.

#### Implementation Architecture

##### API Gateway

##### Services

##### Shared

#### API Information

##### API Integrations

- LLM: Leverages OpenAI's GPT models for advanced script generation
- Voice Generation: Integrates with Elevenlabs for high-quality voice synthesis
- Image Generation: Utilizes Midjourney's API for creating visual content
- Animation Generation: Employs Immersity AI for creating animations from static images
- Music Generation: Uses Suno AI for custom background music creation
- Video Generation: Utilizes Luma AI for generating videos from images and prompts
- Job Service: Orchestrates the content generation process and manages job statuses, runs LLM, Voice, Image, Animation, Music, Video at once
- Video Assembly: Utilizes JSON2Video for final video compilation with transitions and layered media

Detailed documentation for each service integration can be found in the respective files within the `backend/services/` directory.

##### Standardized API Requests:
Each service follows a consistent request format through the API Gateway:

1. **LLM Service** (`POST /api/llm/generate`):
```json
{
    "jobId": "uuid",
    "inputPrompt": "prompt text",
    "llmGenParams": {
        // LLM generation parameters
    }
}
```

2. **Image Service** (`POST /api/image/generate`):
```json
{
    "jobId": "uuid",
    "prompt": "image prompt",
    "sceneIndex": 1
}
```

3. **Voice Service** (`POST /api/voice/generate`):
```json
{
    "jobId": "uuid",
    "text": "text to convert to speech",
    "sceneIndex": 1,
    "voiceId": "optional-voice-id"
}
```

4. **Music Service** (`POST /api/music/generate`):
```json
{
    "jobId": "uuid",
    "title": "music title",
    "lyrics": "optional lyrics",
    "tags": "music style tags",
    "instrumental": true
}
```

5. **Animation Service** (`POST /api/animation/generate`):
```json
{
    "jobId": "uuid",
    "imagePath": "path to source image",
    "videoPrompt": "animation description",
    "sceneIndex": 1,
    "options": {
        "animationLength": 5,
        "animationPrompt": "optional animation prompt"
    }
}
```

6. **Video Service** (`POST /api/video/generate`):
```json
{
    "jobId": "uuid",
    "imagePath": "path to source image",
    "videoPrompt": "video scene description",
    "cameraMovement": "pan/zoom/etc",
    "aspectRatio": "9:16",
    "sceneIndex": 1
}
```

6. **Job Service** (`POST /api/job/generate`):
```json
{
  "prompt": "prompt text",
  "parameters": {
    "llmGenParams": {
      "general": {
        "sceneAmount": "1-n",
        "lengthDescription": "Your task is to write a 1-n seconds video",
        "generalDescription": "Additional information"
      },
      "script": {
        "characterPerspective": "E.g. Content Creator: Shares personal experiences and opinions",
        "pacingStructure": "E.g. Fast-Paced Rhythm: Quick cuts, dynamic camera movements, and rapid scene transitions to heighten tension.",
        "scriptTone": "E.g. Enthusiastic: Show passion for the subject matter (e.g., energetic delivery, expressing genuine interest)",
        "vocabulary": "E.g. Engaging Questions: Pose rhetorical questions to provoke thought"
      },
      "image": {
        "artistStyle": "E.g. Jakub Rozalski",
        "shotStyle": "E.g. Photorealistic, cinematic",
        "aspectRatio": "E.g. 9:16",
        "style": "E.g. raw",
        "sValue": "E.g. 500"
      }
    },
    "voiceGenParams": {
      "voiceId": "E.g. 21m00Tcm4TlvDq8ikWAM"
    },
    "imageGenParams": {},
    "animationGenParams": {},
    "videoGenParams": {
      "aspectRatio": "E.g. 16:9"
    }
  },
  "visualizationType": "E.g.video"
}
```

7. **Assembly Service** (`POST /api/assembly/generate`):
```json
{
  "jobId": "uuid",
  "templateId": "uuid",
}
```


#### Storage System

The application uses AWS S3 for file storage. For every content piece the user generates, the file is stored in the S3 bucket. The link to the file and a storage key is stored in the database. The file is accessible under this link for a certain amount of time. After that the link needs to be refreshed with the storage key. A automatic refresh mechanism is implemented so the content is reachable in the frontend. The storage system replaces the local file storage system.

The project now includes an integrated data storage system for handling media files (images, animations, and voice outputs) using AWS S3.

##### Storage Flow

1. The user generates a content piece.
2. The content piece is stored in the S3 bucket.
3. The link to the file and a storage key is stored in the database.
4. The file is accessible under this link for a certain amount of time.
5. After that the link needs to be refreshed with the storage key.

The system consists of several components:

##### Storage Components

- `backend/shared/utils/storage.js`: Core storage service that handles file uploads and signed URL generation
- `backend/shared/utils/storage-url-helper.js`: Helper utility for managing and refreshing S3 signed URLs
- `backend/api-gateway/middleware/mediaAuth.js`: Authentication middleware for media access

##### Service Integration

The storage system is integrated with the following services:

- **Image Service**: Stores generated images with metadata
- **Animation Service**: Stores animation outputs and manages pattern files
- **Voice Service**: Stores voice outputs and audio files

##### Key Features

- Secure file storage using AWS S3
- Automatic URL expiration handling
- Centralized storage configuration
- Consistent file access patterns across services
- Automatic cleanup of temporary files
- Support for various media types


##### Usage

Files are automatically stored in the configured S3 bucket when generated by the services. Each file gets:
- A storage key (unique identifier in S3)
- A public URL (time-limited signed URL for access)
- Associated metadata stored in the database

The `StorageUrlHelper` automatically refreshes expired URLs when accessing stored files.

##### Storage Setup

For the staging and production environment you'll need to:

1. Create an S3 bucket
2. Set up an IAM user with appropriate permissions
3. Configure environment variables in default.json:

```bash
STORAGE_PROVIDER=aws
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=your_region
AWS_BUCKET_NAME=your_bucket_name
CDN_URL=your_cdn_url  # Optional, if using CloudFront
```

For local development, you can use the local filesystem by setting:
```bash
STORAGE_PROVIDER=local
```

##### AWS S3 Setup

1. Create three S3 buckets (one for each environment):
   ```
   short-video-creator-dev
   short-video-creator-staging
   short-video-creator-prod
   ```

2. For each bucket:
   - Enable versioning
   - Configure CORS:
   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
       "AllowedOrigins": ["*"],
       "ExposeHeaders": []
     }
   ]
   ```

3. Create IAM users for each environment with appropriate permissions:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "s3:PutObject",
           "s3:GetObject",
           "s3:ListBucket",
           "s3:DeleteObject"
         ],
         "Resource": [
           "arn:aws:s3:::your-bucket-name/*",
           "arn:aws:s3:::your-bucket-name"
         ]
       }
     ]
   }
   ```

4. Set up CloudFront distributions (optional) for each bucket to serve content via CDN

#### Authentication System

The project implements a comprehensive authentication system using Auth0:

##### Features
- Email/password authentication
- Google social login
- JWT-based session management
- Refresh token mechanism
- Multi-device session support
- Single and all-device logout capabilities

##### Security Measures
- Rate limiting for login attempts
- Secure token storage
- Role-based access control
- Session invalidation
- Auth0 integration for identity management

##### Authentication Flows
1. **Email Registration**
   - User registration with email verification
   - Secure password handling
   - Automatic profile creation

2. **Social Authentication**
   - Google Sign-In integration
   - Automatic profile synchronization
   - Social profile data management

3. **Session Management**
   - JWT token generation and validation
   - Refresh token rotation
   - Secure session tracking
   - Multiple device support

#### Subscription System

The subscription system is based on a tier-based system with different plans and features. Each plan has a different token allocation and different features. The subscription can be based on a monthly or yearly billing cycle. Each service costs a different amount of tokens per usage. Additionally the user can buy token packages to use to get more tokens. The payment integration is done through Stripe.

##### Subscription Flow

1. The user creates an account and logs in.
2. With the creation of the account, the user gets a free tier subscription.
3. The user can change the plan to a paid plan.
4. The user can buy token packages to use to get more tokens.
5. The user can use the tokens to generate content.
6. The user can change the plan or cancel the subscription.
7. The user can use the paid plan until the end of the billing cycle.

### Frontend Architecture
The frontend is built with Next.js 14 and follows a modern, component-based architecture with a focus on performance and user experience. The frontend is built with Tailwind CSS and Shadcn UI.

#### Frontend Structure

The frontend is structured into app, components, data, lib, styles and types. In the root is an additional readme and configuration files for environment variables and typescript.

#### App Organization

- `app/`
  - `(auth)/` - Authentication pages
    - `login/` - Login page
    - `register/` - Registration page
  - `(dashboard)/` - Protected dashboard area
    - `layout.tsx` - Dashboard layout wrapper
    - `dashboard/` - Main dashboard view
    - `workbench/` - Content workbench
      - `[jobId]/` - Job details page
    - `create/` - Video creation flow
      - `quick/` - Quick creation mode
      - `advanced/` - Advanced editor
    - `settings/` - User settings
  - `(marketing)/` - Public marketing pages
    - `page.tsx` - Landing page
    - `pricing/` - Pricing plans
    - `features/` - Features showcase
    
#### Components Organization
- `components/`
  - `auth/` - Authentication components
  - `subscription/` - Subscription components
  - `dashboard/` - Dashboard components
  - `job-details/` - Job details components
  - `layout/` - Layout components
  - `marketing/` - Marketing components
    - `features/` - Features showcase
    - `hero/` - Hero section
    - `process/` - Process section
    - `showcase/` - Showcase section
    - `testimonials/` - Testimonials section
  - `providers/` - Providers components
    - `theme-provider.tsx` - Theme provider
    - `auth0-provider.tsx` - Auth0 provider
    - `api-provider.tsx` - API provider
  - `shared/` - Shared components
    - `buttons/` - Button components
    - `containers/` - Container components
    - `filters/` - Filter components
    - `media/` - Media components
    - `pagination/` - Pagination components
    - `utils/` - Utility components
  - `ui/` - Reusable UI components
  - `video-creation/` - Video creation components
    - `sections/` - Creation flow sections
    - `steps/` - Creation flow steps
  - `videos/` - Video components
    - `sections/` - Video sections
  - `workbench/` - Workbench components

#### Data Organization
- `data/` - Configuration files
  - `errors/` - Error messages
  - `features/` - Configuration of features
  - `requests/` - Example requests
  - `responses/` - Example responses
  - `video-creation/` - Configuration of video creation
      - `assembly/` - Assembly configuration
      - `basic/` - Basic configuration
      - `image/` - Image configuration
      - `script/` - Script configuration
      - `summary/` - Summary configuration
      - `video/` - Video configuration
      - `voice/` - Voice configuration
  - `lib/` - Library files
    - `api/` - API library
    - `auth/` - Authentication library
    - `debug/` - Debug library
    - `hooks/` - Custom hooks
    - `hoc/` - Higher order components
    - `utils/` - Utility functions
    - `types/` - TypeScript types


#### State Management
- React Query for server state
- Context API for global state
- Custom hooks for shared logic:
  - `useJobDetails` - Job data management
  - `useStorageUrls` - Storage URL handling
  - `useWorkbench` - Workbench state
  - `useVideoCreationState` - Creation flow state
  - `useProgressiveMedia` - Media loading

#### Key Features
- Server and Client Components optimization
- Progressive image/video loading
- Responsive design with Tailwind CSS
- Dark/light mode with system preference
- Real-time preview capabilities
- Optimized media handling
- Enhanced error boundaries
- Toast notifications
- Loading states and animations
- Transition animations
- Protected routes
- M2M token flow
- API request interceptors

### Database

#### Database Architecture and Design

The project uses a PostgreSQL database to store persistent data. The database schema is designed to support the microservices architecture and efficiently store data for all aspects of the content creation process.

#### Key Tables:

1. **users**: Stores user account information.
2. **roles**: Defines different user roles in the system.
3. **permissions**: Defines different permissions for the roles. (needs review)
4. **role_permissions**: Junction table linking roles to their permissions. (needs review)
5. **user_roles**: Junction table linking users to their roles.
6. **user_sessions**: Stores user session information.
7. **user_subscriptions**: Links users to their chosen subscription plans.
8. **plans**: Defines subscription plans available to users.
9. **tokens**: Tracks token balances for each user.
10. **token_transactions**: Records token usage for jobs.
11. **token_packages**: Defines token packages available to users.
12. **payments**: Stores payment transaction data without payment details for users.
13. **llm_inputs**: Stores input prompts for the LLM service.
14. **llm_outputs**: Contains the generated output from the LLM service.
15. **llm_scenes**: Breaks down LLM outputs into individual scenes.
16. **image_outputs**: Stores information about generated images.
17. **voice_outputs**: Contains data related to voice generation.
18. **music_outputs**: Stores information about generated music.
19. **animation_outputs**: Contains data about created animations.
20. **video_outputs**: Stores information about generated videos.
21. **assembly_outputs**: Stores information about assembled videos.
22. **jobs**: Central table for tracking content creation jobs.

#### Key Features:

- Use of UUID for `job_id` in the `jobs` table for improved scalability and security.
- Direct linking between `llm_scenes` and `jobs` tables for efficient querying.
- Comprehensive metadata storage for each service output.
- Flexible JSON storage for service-specific parameters and metadata.

#### Data Flow:

1. User creates an account (stored in `users`).
2. User subscribes to a plan (recorded in `user_subscriptions`).
3. When a job is created, it's stored in the `jobs` table.
4. LLM service processes the job, storing inputs in `llm_inputs` and outputs in `llm_outputs`.
5. Individual scenes are stored in `llm_scenes`, linked directly to the job.
6. As each subsequent service (image, voice, animation, music, video) processes the job, outputs are stored in respective tables.
7. Token usage for the job is recorded in `token_transactions`.
8. Payments for subscriptions or token purchases are stored in the `payments` table.

This database design allows for efficient tracking of the entire content creation process, from job initiation to final output, while also supporting user management, billing, and analytics.

#### Database Updates
Recent database schema updates include:

1. **Job Status Enhancement** (20250219000000)
   - Increased job status field length to 50 characters
   - Added support for more detailed status tracking

2. **Job Status Constraints** (20250219000001)
   - Added new status: 'completed_with_errors'
   - Updated status check constraints
   - Migrated existing status values

3. **Progress Tracking** (20250219000002)
   - Added 'in_progress' status
   - Enhanced job progress tracking
   - Updated status constraints

4. **Service Integration**
   - Enhanced service output tables
   - Added storage key tracking
   - Improved metadata handling
   - Added URL management

5. **Key Features**:
   - UUID for job identification
   - Comprehensive metadata storage
   - Flexible JSON storage for parameters
   - Enhanced status tracking
   - Progress monitoring
   - Service output linking
   - Storage integration
   - URL management
   - Error tracking
   - Transition data storage

6. **Data Flow Improvements**:
   - Enhanced job tracking
   - Better error handling
   - Improved status transitions
   - More detailed progress tracking
   - Better service integration
   - Enhanced metadata storage
   - Optimized query performance

New migrations have been added in the `database/migrations` folder:
- `20240320000000_add_public_urls_and_media_ownership.js`: Adds storage-related columns
- `20241203000000_rename_voice_output_columns.js`: Updates voice service columns

#### Applying Database Migrations
Database migrations are managed using Knex.js and can be run using the following commands:

##### Running All Pending Migrations

**For Windows PowerShell:**
```powershell
$env:NODE_ENV="development" ; npx knex migrate:latest
```

**For Windows Command Prompt:**
```cmd
set NODE_ENV=development && npx knex migrate:latest
```

**For Unix-like systems (Linux/macOS):**
```bash
NODE_ENV=development npx knex migrate:latest
```

##### Running Specific Migrations

To run migrations up to a specific file:

```bash
NODE_ENV=development npx knex migrate:up 20250320000005_token_transactions_constraints.js
```

##### Rolling Back Migrations

To roll back the most recent migration:

```bash
NODE_ENV=development npx knex migrate:down
```

To roll back all migrations:

```bash
NODE_ENV=development npx knex migrate:rollback --all
```

##### Checking Migration Status

To see which migrations have been run and which are pending:

```bash
NODE_ENV=development npx knex migrate:status
```

These commands need to be run from the project root directory where the `knexfile.js` is located.

#### Database Integration Status

The project has completed database integration for all services, establishing a consistent pattern for data storage and retrieval:

###### Completed Services:
1. **LLM Service**: 
   - Full database integration with `llm_inputs`, `llm_outputs`, and `llm_scenes` tables
   - File structure: `data/output/llm/YYYY-MM-DD/[jobId]/llm_output.json`

2. **Image Service**:
   - Integrated with `image_outputs` table
   - File structure: `data/output/image/YYYY-MM-DD/[jobId]/scene_[X]/image_scene_[X].png`
   - Metadata storage: `data/output/image/YYYY-MM-DD/[jobId]/scene_[X]/metadata.json`

3. **Voice Service**:
   - Integrated with `voice_outputs` table
   - File structure: `data/output/voice/YYYY-MM-DD/[jobId]/scene_[X]/voice_scene_[X].mp3`
   - Metadata storage: `data/output/voice/YYYY-MM-DD/[jobId]/scene_[X]/metadata.json`

4. **Music Service**:
   - Integrated with `music_outputs` table
   - File structure: `data/output/music/YYYY-MM-DD/[jobId]/background_music.mp3`
   - Metadata storage: `data/output/music/YYYY-MM-DD/[jobId]/metadata.json`
   - Includes retry logic for API calls with exponential backoff

5. **Animation Service**:
   - Integrated with `animation_outputs` table
   - File structure: `data/output/animation/YYYY-MM-DD/[jobId]/scene_[X]/animation_scene_[X].mp4`
   - Metadata storage: `data/output/animation/YYYY-MM-DD/[jobId]/scene_[X]/metadata.json`

6. **Video Service**:
   - Integrated with `video_outputs` table
   - File structure: `data/output/video/YYYY-MM-DD/[jobId]/scene_[X]/video_scene_[X].mp4`
   - Metadata storage: `data/output/video/YYYY-MM-DD/[jobId]/scene_[X]/metadata.json`

7. **Job Service**:
   - Integrated with `jobs` table
   - File structure:
      - Final video:
          - `data/output/integration/YYYY-MM-DD/[jobId]/final_video.mp4`
          - `data/output/integration/YYYY-MM-DD/[jobId]/project_metadata.json`
        - Content pieces:
          - LLM:
            - File structure: `data/output/llm/YYYY-MM-DD/[jobId]/llm_output.json`
          - Image:
            - File structure: `data/output/image/YYYY-MM-DD/[jobId]/scene_[X]/image_scene_[X].png`
            - Metadata storage: `data/output/image/YYYY-MM-DD/[jobId]/scene_[X]/metadata.json`  
          - Voice:
            - File structure: `data/output/voice/YYYY-MM-DD/[jobId]/scene_[X]/voice_scene_[X].mp3`
            - Metadata storage: `data/output/voice/YYYY-MM-DD/[jobId]/scene_[X]/metadata.json`  
          - Animation:
            - File structure: `data/output/animation/YYYY-MM-DD/[jobId]/scene_[X]/animation_scene_[X].mp4`
            - Metadata storage: `data/output/animation/YYYY-MM-DD/[jobId]/scene_[X]/metadata.json`
          - Video:
            - File structure: `data/output/video/YYYY-MM-DD/[jobId]/scene_[X]/video_scene_[X].mp4`
            - Metadata storage: `data/output/video/YYYY-MM-DD/[jobId]/scene_[X]/metadata.json`
          - Music:
            - File structure: `data/output/music/YYYY-MM-DD/[jobId]/background_music.mp3`
            - Metadata storage: `data/output/music/YYYY-MM-DD/[jobId]/metadata.json`


###### Database Operations for Each Service:
All services provide standard database operations:
- Create output records with file management
- Retrieve outputs by job ID
- Update metadata
- Delete outputs with file cleanup

###### Common Features Across Services:
- Consistent file structure pattern: `data/output/[service]/YYYY-MM-DD/[jobId]/`
- Metadata JSON files alongside generated content
- Error handling with retry logic for external API calls
- Temporary file management for processing
- Database transaction support
- Clean separation of test and production paths

## Testing

The project includes various test files for different components and integrations. To run all tests:

```
npm test
```

To run specific tests:

```
npm run test:llm
npm run test:voice
npm run test:image
npm run test:music
npm run test:animation
npm run test:video
npm run test:integration
npm run test:discord
npm run test:midjourney
npm run test:image-download
npm run test:animation-pattern
npm run test:db-connection
```

Test outputs are stored in the `tests/test_output/` directory. The tests are organized as follows:

### Service Tests
- **llm-test.js**: Tests LLM service functionality and database integration
- **voice-gen-test.js**: Tests voice generation service
- **image-gen-test.js**: Tests image generation service
- **music-gen-test.js**: Tests music generation service
- **animation-gen-test.js**: Tests animation generation service
- **video-gen-test.js**: Tests video generation service

### Integration Tests
- **integration-test.js**: Tests the complete workflow across all services
- **discord-websocket-test.js**: Tests Discord WebSocket connection for Midjourney
- **midjourney-test.js**: Tests Midjourney integration
- **image-download-test.js**: Tests image downloading functionality
- **animation-pattern-generator-test.js**: Tests animation pattern generation

### Database Tests
- **test_db_connection.js**: Tests database connectivity and configuration

Each test creates its own output in the following structure:
```
tests/test_output/
├── llm/
├── voice/
├── image/
├── music/
├── video/
├── animation/
└── integration/
```

## Source Code Export

The project includes a utility for exporting the full source code, which can be useful for version control, sharing, or backup purposes. The export functionality captures the complete project structure, including:

- Service implementations
- Database schemas and migrations
- Configuration files
- Test files
- Documentation

To use this feature:

1. Navigate to the project root directory
2. Run the following command:
   ```
   npm run create:code
   ```
3. The exported source code will be saved as `full_source_code.txt` in the project root directory

The exported file includes:
- Complete file structure
- Source code for all components
- Database schema definitions
- Configuration templates
- Test implementations
- Documentation files

This export feature is particularly useful for:
- Code review sessions
- Documentation purposes
- Sharing the codebase with new team members
- Creating backups of the current implementation
- Tracking changes across versions

The export excludes sensitive information such as:
- API keys and credentials
- Personal configuration files
- Environment-specific settings
- Generated content and test outputs


## Documentation System

The project includes an integrated documentation system:

### Structure
- `/docs` - Public documentation
- `/docs/developer` - Protected developer documentation
- `/docs/api` - Protected API documentation

### Features
- Unified server serving both app and docs
- OAuth-based authentication for protected sections
- Real-time API documentation updates
- SEO optimization for public docs
- Version control for documentation
- Dark/light mode support
- Full-text search functionality

### Access Control
- Public access to general documentation
- Protected access to developer guides
- Protected access to API documentation
- Role-based documentation access

### Development Environment
- Local development server
- Hot reloading for documentation
- Preview deployments
- Automated builds




