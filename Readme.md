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
11. [Database Architecture and Design](#database-architecture-and-design)
12. [Output Format](#output-format)
13. [Testing](#testing)
14. [Source Code Export](#source-code-export)

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

The system processes input from a CSV file containing multiple prompts, leverages these AI services, and outputs a structured set of files primed for import into video editing software such as Capcut, significantly reducing the time and effort required in the content creation process.

## Features

- Efficient CSV input processing for batch content creation with multiple prompts
- AI-powered script generation using advanced GPT models
- Realistic voice narration synthesis using Elevenlabs
- AI-generated images using Midjourney
- Animation creation from static images using Immersity AI
- Custom background music generation using Suno AI
- Video generation from images and prompts using Luma AI
- Structured output optimized for video editing workflows
- Highly configurable pipeline to suit various content needs
- Robust error handling and comprehensive logging
- Separate test environment for all services
- Integration test for end-to-end workflow verification
- Source code export functionality for easy sharing and versioning
- API Gateway for centralized request handling and direct service communication
- Fully functional video generation service with API gateway integration
- Database integration for persistent storage of job and content data
- Planned external file storage system for generated media files

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

## Installation

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

## Configuration

1. Copy `config/default.example.json` to `config/default.json`
2. Edit `config/default.json` and add your API keys and other settings:
   ```json
   {
     "llm": {
       "provider": "openai",
       "model": "gpt-4o-2024-08-06",
       "apiKey": "YOUR_OPENAI_API_KEY"
     },
     "voiceGen": {
       "provider": "elevenlabs",
       "apiKey": "YOUR_ELEVENLABS_API_KEY"
     },
     "imageGen": {
       "provider": "midjourney",
       "serverId": "YOUR_DISCORD_SERVER_ID",
       "channelId": "YOUR_DISCORD_CHANNEL_ID",
       "salaiToken": "YOUR_DISCORD_TOKEN",
       "debug": true,
       "ws": true
     },
     "audioGen": {
       "provider": "suno",
       "sunoCookie": "YOUR_SUNO_COOKIE_HERE",
       "sessionId": "YOUR_SUNO_SESSION_ID_HERE"
     },
     "animationGen": {
       "provider": "immersityAI",
       "clientId": "YOUR_IMMERSITY_CLIENT_ID",
       "clientSecret": "YOUR_IMMERSITY_CLIENT_SECRET"
     },
     "videoGen": {
       "provider": "lumaAI",
       "apiKey": "YOUR_LUMA_AI_API_KEY"
     },
     "input": {
       "csvPath": "./data/input/input.csv"
     },
     "output": {
       "directory": "./data/output"
     },
     "database": {
       "host": "YOUR_DB_HOST",
       "port": "YOUR_DB_PORT",
       "username": "YOUR_DB_USERNAME",
       "password": "YOUR_DB_PASSWORD",
       "database": "YOUR_DB_NAME"
     }
   }
   ```

## Usage

1. Prepare your input CSV file in `data/input/input.csv` with multiple prompts, one per line
2. Set up your parameters in `data/input/parameters.json`
3. Customize the initial prompt in `data/input/initial_prompt.txt`
4. Start the API Gateway:
   ```
   npm run start:gateway
   ```
5. Start individual services:
   ```
   npm run start:llm
   npm run start:voice
   npm run start:image
   npm run start:animation
   npm run start:music
   npm run start:video
   ```
6. Use Postman or any HTTP client to send requests to `http://localhost:3000/api/{service}/{endpoint}`
7. For video generation, send a POST request to `http://localhost:3000/api/video/generate` with the appropriate payload
8. Find the generated content in the `data/output` directory and the database

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
│       ├── job/
|       │   └── [jobID]
│       ├── animation/
|       │   └── [jobID]
│       ├── music/
|       │   └── [jobID]
│       ├── voice/
|       │   └── [jobID]
│       ├── video/
|       │   └── [jobID]
│       ├── llm/
|       │   └── [jobID]
│       └── image/
|           └── [jobID]
├── docs/
├── logs/
├── node_modules/
├── backend/
│   ├── api-gateway/
│   │   └── server.js
│   ├── services/
│   │   ├── auth-service/
│   │   │   ├── auth-controller.js
│   │   │   └── auth-model.js
│   │   ├── job-service/
│   │   │   ├── data/
│   │   │   │   └── jobDataAccess.js
│   │   │   ├── job-pipeline-service.js
│   │   │   ├── server.js
│   │   │   └── index.js
│   │   ├── billing-service/
│   │   │   ├── billing-controller.js
│   │   │   └── billing-model.js
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
│   │   │   ├── index.js
│   │   │   └── animationPatternGenerator.js
│   │   └── video-service/
│   │       ├── data/
│   │       │   └── videoDataAccess.js
│   │       ├── video-gen-service.js
│   │       ├── server.js
│   │       └── index.js
│   └── shared/
│       ├── middleware/
│       │   ├── auth-middleware.js
│       │   └── error-handler.js
│       ├── utils/
│       │   ├── pattern/
│       │   │   ├── animation-pattern-manager.js
│       │   │   └── animation-pattern-generator.js
│       │   ├── config.js
│       │   ├── logger.js
│       │   ├── prompt-utils.js
│       │   ├── llmFileHandler.js
│       │   ├── audio-utils.js
│       │   └── export-source-code.js
│       └── config/
│           ├── database.js
│           └── models.js
├── frontend/
│   └── src/
│       ├── public/
│       ├── components/
│       │   ├── Header.js
│       │   ├── Footer.js
│       │   └── ServiceSelector.js
│       ├── pages/
│       │   ├── Home.js
│       │   ├── Dashboard.js
│       │   └── JobSubmission.js
│       ├── services/
│       │   ├── api.js
│       │   └── auth.js
│       └── App.js
├── database/
│   ├── migrations/
│   │   └── 20241004181232_initial_schema.js
│   ├── seeds/
│   │   └── initial_data.js
│   └── resetDatabase.js
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
│   │   └── test_db_connection.js
│   └── test_output/
│       ├── llm/
│       ├── voice/
│       ├── image/
│       ├── music/
│       ├── video/
│       ├── animation/
│       └── integration/
├── .gitignore
├── package.json
├── package-lock.json
├── knexfile.js
└── README.md
```

## Architecture

The application follows a microservices architecture designed for flexibility and maintainability:

1. API Gateway: Handles routing and direct communication with all services
2. Input Processing: Parses CSV input with multiple prompts and loads configuration parameters
3. Authentication Service: Manages user registration, login, and authorization (Planned)
4. Job Service: Orchestrates the content generation process and manages job statuses (Planned)
5. Billing Service: Handles subscription management and usage-based billing (Planned)
6. LLM Service: Generates dynamic script content based on input and parameters
7. Voice Generation Service: Synthesizes natural-sounding narration from the generated script
8. Image Generation Service: Creates visual content based on scene descriptions
9. Animation Generation Service: Creates animations from static images
10. Music Generation Service: Produces custom background music tracks
11. Video Generation Service: Creates video content from images and prompts
12. Shared Utilities: Provides common functionality across services
13. Frontend Application: Offers a user-friendly interface for interacting with the backend services
14. Database: Stores persistent data for jobs, inputs, outputs, and service-specific information
15. External File Storage: (Planned) Will store generated media files

Each service runs independently, and the API Gateway communicates directly with each service using HTTP requests, allowing for better scalability and easier maintenance.

## API Integrations

- LLM: Leverages OpenAI's GPT models for advanced script generation
- Voice Generation: Integrates with Elevenlabs for high-quality voice synthesis
- Image Generation: Utilizes Midjourney's API for creating visual content
- Animation Generation: Employs Immersity AI for creating animations from static images
- Music Generation: Uses Suno AI for custom background music creation
- Video Generation: Utilizes Luma AI for generating videos from images and prompts

Detailed documentation for each service integration can be found in the respective files within the `backend/services/` directory.

## Database Architecture and Design

The project uses a PostgreSQL database to store persistent data. The database schema is designed to support the microservices architecture and efficiently store data for all aspects of the content creation process.

### Key Tables:

1. **users**: Stores user account information.
2. **roles**: Defines different user roles in the system.
3. **user_roles**: Junction table linking users to their roles.
4. **jobs**: Central table for tracking content creation jobs.
5. **plans**: Defines subscription plans available to users.
6. **user_subscriptions**: Links users to their chosen subscription plans.
7. **tokens**: Tracks token balances for each user.
8. **token_transactions**: Records token usage for jobs.
9. **payments**: Stores payment information for users.
10. **llm_inputs**: Stores input prompts for the LLM service.
11. **llm_outputs**: Contains the generated output from the LLM service.
12. **llm_scenes**: Breaks down LLM outputs into individual scenes.
13. **image_outputs**: Stores information about generated images.
14. **voice_outputs**: Contains data related to voice generation.
15. **music_outputs**: Stores information about generated music.
16. **animation_outputs**: Contains data about created animations.
17. **video_outputs**: Stores information about generated videos.

### Key Features:

- Use of UUID for `job_id` in the `jobs` table for improved scalability and security.
- Direct linking between `llm_scenes` and `jobs` tables for efficient querying.
- Comprehensive metadata storage for each service output.
- Flexible JSON storage for service-specific parameters and metadata.

### Data Flow:

1. User creates an account (stored in `users`).
2. User subscribes to a plan (recorded in `user_subscriptions`).
3. When a job is created, it's stored in the `jobs` table.
4. LLM service processes the job, storing inputs in `llm_inputs` and outputs in `llm_outputs`.
5. Individual scenes are stored in `llm_scenes`, linked directly to the job.
6. As each subsequent service (image, voice, animation, music, video) processes the job, outputs are stored in respective tables.
7. Token usage for the job is recorded in `token_transactions`.
8. Payments for subscriptions or token purchases are stored in the `payments` table.

This database design allows for efficient tracking of the entire content creation process, from job initiation to final output, while also supporting user management, billing, and analytics.

# SHORT-VIDEO-CREATOR-SIMPLIFIED

[Previous Introduction, Project Overview, Features, Prerequisites, Installation, Configuration, Usage, Project Structure sections remain exactly the same until API Integrations]

### Standardized API Requests:
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

## Output Format

The system maintains a structured output format for each service, organized by date and job ID:

### LLM Service Output
```
data/output/llm/
└── YYYY-MM-DD/
    └── [jobId]/
        └── llm_output.json
```

### Image Service Output
```
data/output/image/
└── YYYY-MM-DD/
    └── [jobId]/
        └── scene_1/
            ├── image_scene_1.png
            └── metadata.json
```

### Voice Service Output
```
data/output/voice/
└── YYYY-MM-DD/
    └── [jobId]/
        └── scene_1/
            ├── voice_scene_1.mp3
            └── metadata.json
```

### Music Service Output
```
data/output/music/
└── YYYY-MM-DD/
    └── [jobId]/
        ├── background_music.mp3
        └── metadata.json
```

### Animation Service Output
```
data/output/animation/
└── YYYY-MM-DD/
    └── [jobId]/
        └── scene_1/
            ├── animation_scene_1.mp4
            └── metadata.json
```

### Video Service Output
```
data/output/video/
└── YYYY-MM-DD/
    └── [jobId]/
        └── scene_1/
            ├── video_scene_1.mp4
            └── metadata.json
```

Each service maintains its own directory structure with consistent patterns:
- Date-based organization (YYYY-MM-DD)
- Job ID-based subdirectories
- Scene-specific folders where applicable
- Metadata JSON files alongside generated content
- Consistent naming conventions for output files

The file paths are stored in the database, enabling efficient data management and retrieval. This structure supports both individual service operation and future integration into a complete video generation pipeline.

The integration job will be a single job that will generate a complete video from start to finish.

## Outlook: Output Format for Final Video

The final generated video is structured as follows for a complete video with integration of all services:

```
output/
└── YYYY-MM-DD_HH-MM-SS/
    ├── [jobId]/
    │   ├── final_video.mp4
    │   └── project_metadata.json
    └── ...
```

This structure is optimized for seamless import into video editing software or create the complete content at once, allowing for efficient post-processing and finalization and rapid video creation. In the future, file paths will be stored in the database, pointing to the external file storage system.

## Database Integration Status

The project has completed database integration for all services, establishing a consistent pattern for data storage and retrieval:

### Completed Services:
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


### Database Operations for Each Service:
All services provide standard database operations:
- Create output records with file management
- Retrieve outputs by job ID
- Update metadata
- Delete outputs with file cleanup

### Common Features Across Services:
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