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
11. [Output Format](#output-format)
12. [Testing](#testing)
13. [Source Code Export](#source-code-export)
14. [Troubleshooting](#troubleshooting)
15. [Contributing](#contributing)
16. [License](#license)

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
- Video generation from images and prompts using Luma AI (Now fully integrated and tested)
- Structured output optimized for video editing workflows
- Highly configurable pipeline to suit various content needs
- Robust error handling and comprehensive logging
- Separate test environment for all services
- Integration test for end-to-end workflow verification
- Source code export functionality for easy sharing and versioning
- API Gateway for centralized request handling and direct service communication
- Fully functional video generation service with API gateway integration

## Prerequisites

- Node.js (v14.0.0 or later)
- npm (v6.0.0 or later)
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
8. Find the generated content in the `data/output` directory

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
│   │   └── server.js
│   ├── services/
│   │   ├── auth-service/
│   │   │   ├── auth-controller.js
│   │   │   └── auth-model.js
│   │   ├── job-service/
│   │   │   ├── job-controller.js
│   │   │   └── job-model.js
│   │   ├── billing-service/
│   │   │   ├── billing-controller.js
│   │   │   └── billing-model.js
│   │   ├── llm-service/
│   │   │   ├── llm-service.js
│   │   │   ├── server.js
│   │   │   └── index.js
│   │   ├── image-service/
│   │   │   ├── image-gen-service.js
│   │   │   └── index.js
│   │   ├── voice-service/
│   │   │   ├── voice-gen-service.js
│   │   │   ├── server.js
│   │   │   └── index.js
│   │   ├── music-service/
│   │   │   ├── music-gen-service.js
│   │   │   ├── server.js
│   │   │   └── index.js
│   │   ├── animation-service/
│   │   │   ├── animation-gen-service.js
│   │   │   ├── server.js
│   │   │   └── index.js
│   │   └── video-service/
│   │       ├── video-gen-service.js
│   │   │   ├── server.js
│   │       └── index.js
│   └── shared/
│       ├── middleware/
│       │   ├── auth-middleware.js
│       │   └── error-handler.js
│       ├── utils/
│       │   ├── config.js
│       │   ├── logger.js
│       │   ├── prompt-utils.js
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
│   │   └── initial-schema.sql
│   └── seeds/
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
11. Video Generation Service: Creates video content from images and prompts (Fully integrated and tested)
12. Shared Utilities: Provides common functionality across services
13. Frontend Application: Offers a user-friendly interface for interacting with the backend services
14. Output Formatting: Structures and saves the generated content in an editor-friendly format

Each service runs independently, and the API Gateway communicates directly with each service using HTTP requests, allowing for better scalability and easier maintenance. The video generation service is now fully integrated into this architecture and accessible through the API gateway.

## API Integrations

- LLM: Leverages OpenAI's GPT models for advanced script generation
- Voice Generation: Integrates with Elevenlabs for high-quality voice synthesis
- Image Generation: Utilizes Midjourney's API for creating visual content
- Animation Generation: Employs Immersity AI for creating animations from static images
- Music Generation: Uses Suno AI for custom background music creation
- Video Generation: Utilizes Luma AI for generating videos from images and prompts

Detailed documentation for each service integration can be found in the respective files within the `backend/services/` directory.

## Output Format

The generated content is structured as follows for each video:

```
output/
└── YYYY-MM-DD_HH-MM-SS/
    ├── prompt_1/
    │   ├── llm_output.json
    │   ├── background_music.mp3
    │   ├── project_metadata.json
    │   └── scene_1/
    │       ├── voice.mp3
    │       ├── image.png
    │       ├── animation.mp4
    │       ├── video.mp4
    │       └── metadata.json
    ├── prompt_2/
    │   ├── llm_output.json
    │   ├── background_music.mp3
    │   ├── project_metadata.json
    │   └── scene_1/
    │       ├── voice.mp3
    │       ├── image.png
    │       ├── animation.mp4
    │       ├── video.mp4
    │       └── metadata.json
    └── ...
```

This structure is optimized for seamless import into video editing software, allowing for efficient post-processing and finalization.

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
```

Test outputs are stored in the `tests/test_output/` directory. The integration test processes all scenes for each prompt in the input CSV, exercising all components of the pipeline.

## Source Code Export

The project includes a utility for exporting the full source code, which can be useful for version control, sharing, or backup purposes. To use this feature:

1. Navigate to the project root directory
2. Run the following command:
   ```
   npm run create:code
   ```
3. The exported source code will be saved as `full_source_code.txt` in the project root directory

This exported file will contain the entire project structure and the content of all source files, making it easy to review or share the complete codebase.

## Troubleshooting

- Review the `logs/app.log` file for detailed error messages and execution logs
- Ensure all API keys and authentication details are correctly set in the `config/default.json` file
- Verify that the input CSV, parameters JSON, and initial prompt TXT files are correctly formatted and located in the `data/input/` directory
- Check that all required npm packages are installed
- For Midjourney-specific issues, ensure your Discord bot has the necessary permissions and that the server and channel IDs are correct
- For Suno-specific issues, ensure your cookie and session ID are up-to-date and valid
- For Immersity AI-specific issues, verify that the client ID and client secret are correct
- For Luma AI-specific issues, ensure your API key is valid and has the necessary permissions
- If the integration test fails, check individual component tests to isolate the issue
- For frontend-related issues, check the browser console for error messages and ensure that the API Gateway is correctly configured to handle frontend requests
- If you encounter issues with the microservices architecture, ensure that all services are running and that the API Gateway can communicate with them
- When running tests, make sure you're using the correct paths for input files (like CSV, JSON, and TXT files) as they may have changed in the new structure
- If you encounter "Module not found" errors, double-check that all dependencies are correctly listed in the `package.json` file and that you've run `npm install` after making any changes
- If requests to the API Gateway are not being routed correctly, check the `server.js` file in the `api-gateway` directory and ensure all routes are properly configured
- Verify network connectivity between the API Gateway and individual services if requests are not