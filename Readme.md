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

SHORT-VIDEO-CREATOR-SIMPLIFIED is a powerful Node.js application designed to revolutionize the content creation process for short-form videos. By harnessing the capabilities of various AI services, this tool automates the generation of engaging scripts, lifelike voice narrations, compelling images, and mood-setting background music, producing a comprehensive package of content ready for video editing.

## Project Overview

This project aims to streamline the content creation pipeline by integrating several cutting-edge AI services:
- Language Model (LLM) for dynamic script generation
- Voice Generation (Elevenlabs) for natural-sounding narration
- Image Creation (Midjourney) for visually stunning scenes
- Music Generation (Suno) for custom background tracks (planned)

The system processes input from a CSV file, leverages these AI services, and outputs a structured set of files primed for import into video editing software such as Capcut, significantly reducing the time and effort required in the content creation process.

## Features

- Efficient CSV input processing for batch content creation
- AI-powered script generation using advanced GPT models
- Realistic voice narration synthesis using Elevenlabs
- AI-generated images using Midjourney
- Structured output optimized for video editing workflows
- Highly configurable pipeline to suit various content needs
- Robust error handling and comprehensive logging
- Separate test environment for LLM, voice generation, and image generation services

## Prerequisites

- Node.js (v14.0.0 or later)
- npm (v6.0.0 or later)
- API keys for the following services:
  - OpenAI (GPT) for script generation
  - Elevenlabs for voice synthesis
  - Midjourney for image generation

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
       "serverId": "YOUR_DISCORD_SERVER_ID", // The unique identifier for the Discord server (guild) where the bot will operate
       "channelId": "YOUR_DISCORD_CHANNEL_ID", // The specific channel ID within the server where the bot will post or listen for commands.
       "salaiToken": "YOUR_DISCORD_TOKEN", // The personal authentication token for your Discord. More information here:https://www.androidauthority.com/get-discord-token-3149920/
       "debug": true,
       "ws": true
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

1. Prepare your input CSV file in `data/input/input.csv`
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
│   │   └── image-gen-service.js
│   ├── utils/
│   │   ├── config.js
│   │   ├── logger.js
│   │   └── prompt-utils.js
│   ├── models.js
│   └── index.js
├── tests/
│   ├── llm-test.js
│   ├── voice-gen-test.js
│   ├── image-gen-test.js
│   └── test_output/
│       ├── llm/
│       ├── voice/
│       └── image/
├── .gitignore
├── package.json
└── README.md
```

## Architecture

The application follows a modular architecture designed for flexibility and maintainability:

1. Input Processing: Parses CSV input and loads configuration parameters
2. LLM Service: Generates dynamic script content based on input and parameters
3. Voice Generation Service: Synthesizes natural-sounding narration from the generated script
4. Image Generation Service: Creates visual content based on scene descriptions
5. Content Pipeline: Orchestrates the flow between services and manages the overall process
6. Output Formatting: Structures and saves the generated content in an editor-friendly format

## API Integrations

- LLM: Leverages OpenAI's GPT models for advanced script generation
- Voice Generation: Integrates with Elevenlabs for high-quality voice synthesis
- Image Generation: Utilizes Midjourney's API for creating visual content

Detailed documentation for each service integration can be found in the respective files within the `src/services/` directory.

## Output Format

The generated content is structured as follows for each video:

```
output/
└── YYYY-MM-DD/
    └── 1_video_prompt/
        ├── scene_1.mp3
        ├── scene_1_image.png
        ├── scene_2.mp3
        ├── scene_2_image.png
        └── ...
```

This structure is optimized for seamless import into video editing software, allowing for efficient post-processing and finalization.

## Testing

The project includes separate test files for the LLM, voice generation, and image generation services:

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

Test outputs are stored in the `tests/test_output/` directory.

## Troubleshooting

- Review the `logs/app.log` file for detailed error messages and execution logs
- Ensure all API keys are correctly set in the `config/default.json` file
- Verify that the input CSV, parameters JSON, and initial prompt TXT files are correctly formatted and located in the `data/input/` directory
- Check that all required npm packages are installed by running `npm install`
- For Midjourney-specific issues, ensure your Discord bot has the necessary permissions and that the server and channel IDs are correct

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