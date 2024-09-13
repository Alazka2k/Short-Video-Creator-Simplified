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
13. [Troubleshooting](#troubleshooting)
14. [Contributing](#contributing)
15. [License](#license)

## Introduction

SHORT-VIDEO-CREATOR-SIMPLIFIED is a powerful Node.js application designed to revolutionize the content creation process for short-form videos. By harnessing the capabilities of various AI services, this tool automates the generation of engaging scripts, lifelike voice narrations, compelling images, and background music, producing a comprehensive package of content ready for video editing.

## Project Overview

This project aims to streamline the content creation pipeline by integrating several cutting-edge AI services:
- Language Model (LLM) for dynamic script generation
- Voice Generation (Elevenlabs) for natural-sounding narration
- Image Creation (Midjourney) for visually stunning scenes
- Music Generation (Suno) for custom background tracks

The system processes input from a CSV file containing multiple prompts, leverages these AI services, and outputs a structured set of files primed for import into video editing software such as Capcut, significantly reducing the time and effort required in the content creation process.

## Features

- Efficient CSV input processing for batch content creation with multiple prompts
- AI-powered script generation using advanced GPT models
- Realistic voice narration synthesis using Elevenlabs
- AI-generated images using Midjourney
- Custom background music generation using Suno AI
- Structured output optimized for video editing workflows
- Highly configurable pipeline to suit various content needs
- Robust error handling and comprehensive logging
- Separate test environment for LLM, voice generation, image generation, and music generation services
- Integration test for end-to-end workflow verification

## Prerequisites

- Node.js (v14.0.0 or later)
- npm (v6.0.0 or later)
- API keys and authentication for the following services:
  - OpenAI (GPT) for script generation
  - Elevenlabs for voice synthesis
  - Midjourney for image generation
  - Suno for music generation

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/SHORT-VIDEO-CREATOR-SIMPLIFIED.git
   cd SHORT-VIDEO-CREATOR-SIMPLIFIED
   ```

2. Install dependencies:
   ```
   npm install
   ```

## Configuration

1. Copy `config/default.example.json` to `config/default.json`
2. Edit `config/default.json` and add your API keys and other settings:
   ```json
   {
     "llm": {
       "model": "gpt-4o-2024-08-06",
       "apiKey": "YOUR_OPENAI_API_KEY"
     },
     "voiceGen": {
       "apiKey": "YOUR_ELEVENLABS_API_KEY",
       "modelId": "eleven_multilingual_v2",
       "defaultVoiceId": "YOUR_CHOSEN_VOICE_ID"
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
4. Run the application:
   ```
   npm start
   ```
5. Find the generated content in the `data/output` directory

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
├── logs/
├── src/
│   ├── services/
│   │   ├── llm-service.js
│   │   ├── voice-gen-service.js
│   │   ├── image-gen-service.js
│   │   ├── music-gen-service.js
│   │   └── suno_auth.js
│   ├── utils/
│   │   ├── config.js
│   │   ├── logger.js
│   │   ├── prompt-utils.js
│   │   └── audio-utils.js
│   ├── models.js
│   └── index.js
├── tests/
│   ├── llm-test.js
│   ├── voice-gen-test.js
│   ├── image-gen-test.js
│   ├── music-gen-test.js
│   ├── integration-test.js
│   └── test_output/
│       ├── llm/
│       ├── voice/
│       ├── image/
│       ├── music/
│       └── integration/
├── .gitignore
├── package.json
└── README.md
```

## Architecture

The application follows a modular architecture designed for flexibility and maintainability:

1. Input Processing: Parses CSV input with multiple prompts and loads configuration parameters
2. LLM Service: Generates dynamic script content based on input and parameters
3. Voice Generation Service: Synthesizes natural-sounding narration from the generated script
4. Image Generation Service: Creates visual content based on scene descriptions
5. Music Generation Service: Produces custom background music tracks
6. Content Pipeline: Orchestrates the flow between services and manages the overall process
7. Output Formatting: Structures and saves the generated content in an editor-friendly format

## API Integrations

- LLM: Leverages OpenAI's GPT models for advanced script generation
- Voice Generation: Integrates with Elevenlabs for high-quality voice synthesis
- Image Generation: Utilizes Midjourney's API for creating visual content
- Music Generation: Uses Suno AI for custom background music creation

Detailed documentation for each service integration can be found in the respective files within the `src/services/` directory.

## Output Format

The generated content is structured as follows for each video:

```
output/
└── YYYY-MM-DD_HH-MM-SS/
    ├── prompt_1/
    │   ├── llm_output.json
    │   ├── background_music.mp3
    │   └── scene_1/
    │       ├── voice.mp3
    │       ├── image.png
    │       └── metadata.json
    ├── prompt_2/
    │   ├── llm_output.json
    │   ├── background_music.mp3
    │   └── scene_1/
    │       ├── voice.mp3
    │       ├── image.png
    │       └── metadata.json
    └── ...
```

This structure is optimized for seamless import into video editing software, allowing for efficient post-processing and finalization.

## Testing

The project includes separate test files for the LLM, voice generation, image generation, music generation services, and an integration test:

- To run all tests:
  ```
  npm test
  ```
- To run only the LLM test:
  ```
  npm run test:llm
  ```
- To run only the voice generation test:
  ```
  npm run test:voice
  ```
- To run only the image generation test:
  ```
  npm run test:image
  ```
- To run only the music generation test:
  ```
  npm run test:music
  ```
- To run the integration test:
  ```
  npm run test:integration
  ```

Test outputs are stored in the `tests/test_output/` directory. The integration test processes one scene for each prompt in the input CSV, exercising all components of the pipeline.

## Troubleshooting

- Review the `logs/app.log` file for detailed error messages and execution logs
- Ensure all API keys and authentication details are correctly set in the `config/default.json` file
- Verify that the input CSV, parameters JSON, and initial prompt TXT files are correctly formatted and located in the `data/input/` directory
- Check that all required npm packages are installed by running `npm install`
- For Midjourney-specific issues, ensure your Discord bot has the necessary permissions and that the server and channel IDs are correct
- For Suno-specific issues, ensure your cookie and session ID are up-to-date and valid
- If the integration test fails, check individual component tests to isolate the issue

## Contributing

Contributions to SHORT-VIDEO-CREATOR-SIMPLIFIED are welcome! Please follow these steps:

1. Fork the repository
2. Create a new branch for your feature or bug fix
3. Commit your changes with clear, descriptive messages
4. Push the branch to your fork
5. Submit a pull request with a comprehensive description of your changes

For major changes, please open an issue first to discuss what you would like to change.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.