# Content Creation Automation

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
12. [Troubleshooting](#troubleshooting)
13. [Contributing](#contributing)
14. [License](#license)

## Introduction

Content Creation Automation is a powerful Node.js application designed to streamline the process of creating multimedia content. By leveraging various AI services, this tool automates the generation of text, voice narration, images, and background music, producing ready-to-edit content for video production.

## Project Overview

This project aims to automate the content creation pipeline by integrating several AI services:
- Language Model (LLM) for text generation
- Voice Generation (Elevenlabs)
- Image Creation (Midjourney)
- Music Generation (Suno)

The system takes input from a CSV file, processes it through these services, and outputs a structured set of files ready for import into video editing software like Capcut.

## Features

- CSV input processing
- AI-powered text generation using GPT models
- Voice narration generation
- AI image creation
- Background music generation
- Structured output for easy video editing
- Configurable pipeline
- Error handling and logging

## Prerequisites

- Node.js (v14.0.0 or later)
- npm (v6.0.0 or later)
- API keys for:
  - OpenAI (GPT)
  - Elevenlabs
  - Midjourney
  - Suno

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/content-creation-automation.git
   cd content-creation-automation
   ```

2. Install dependencies:
   ```
   npm install
   ```

## Configuration

1. Copy `config/default.json` to `config/custom.json`
2. Edit `config/custom.json` and add your API keys and other settings:
   ```json
   {
     "llm": {
       "model": "gpt-4o-2024-08-06",
       "apiKey": "YOUR_OPENAI_API_KEY"
     },
     "voiceGen": {
       "provider": "elevenlabs",
       "apiKey": "YOUR_ELEVENLABS_API_KEY"
     },
     "imageGen": {
       "provider": "midjourney",
       "apiKey": "YOUR_MIDJOURNEY_API_KEY"
     },
     "audioGen": {
       "provider": "suno",
       "apiKey": "YOUR_SUNO_API_KEY"
     },
     "input": {
       "csvPath": "./data/input/content.csv"
     },
     "output": {
       "directory": "./data/output"
     }
   }
   ```

## Usage

1. Prepare your input CSV file in `data/input/content.csv`
2. Run the application:
   ```
   npm start
   ```
3. Check the output in the `data/output` directory

## Project Structure

```
content-creation-automation/
│
├── config/
│   ├── default.json
│   └── custom.json
│
├── src/
│   ├── index.js
│   ├── utils/
│   ├── services/
│   ├── workflows/
│   └── output-formatter.js
│
├── data/
│   ├── input/
│   └── output/
│
├── scripts/
└── README.md
```

## Architecture

The application follows a modular architecture:

1. CSV Parser: Reads input data
2. LLM Service: Generates text content
3. Voice Generation Service: Creates voice narration
4. Image Generation Service: Produces images for scenes
5. Audio Generation Service: Creates background music
6. Output Formatter: Structures and saves the generated content

The main workflow orchestrates these services in the `content-pipeline.js` file.

## API Integrations

- LLM: Uses OpenAI's GPT models for text generation
- Voice Generation: Integrates with Elevenlabs for voice synthesis
- Image Creation: Utilizes Midjourney's API for image generation
- Music Generation: Employs Suno's API for creating background music

Refer to each service's documentation in the `src/services/` directory for detailed API usage.

## Output Format

The output is structured as follows for each video:

```
output/
└── video1/
    ├── images/
    │   ├── scene1.png
    │   ├── scene2.png
    │   └── ...
    ├── audio/
    │   ├── narration.mp3
    │   └── background_music.mp3
    └── metadata.json
```

This structure is designed for easy import into video editing software like Capcut.

## Troubleshooting

- Check the logs in `content-creation-automation.log` for error messages
- Ensure all API keys are correctly set in the configuration file
- Verify that the input CSV file is correctly formatted and located in the specified path

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.