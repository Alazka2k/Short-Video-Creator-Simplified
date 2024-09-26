# Getting Started

Welcome to SHORT-VIDEO-CREATOR-SIMPLIFIED! This guide will walk you through the essential steps to set up and start using the application. Designed to enhance the process of short-form video content creation, this tool integrates a variety of AI services, automating many elements of the video production pipeline.

## Step 1: Prerequisites

Before you begin, ensure you have the following software and credentials ready:

- **Node.js**: Version 14.0.0 or higher. Install it from the [official website](https://nodejs.org/).
- **npm**: Version 6.0.0 or higher. It is typically included with Node.js.
- **API Keys/Authentication** for all the integrated services:
  - OpenAI for script generation
  - Elevenlabs for voice synthesis
  - Midjourney for image generation
  - Immersity AI for animation generation
  - Suno for music generation
  - Luma AI for video generation

## Step 2: Installation

To install the application locally, follow these steps:

1. **Clone the Repository**:
   ```sh
   git clone https://github.com/yourusername/SHORT-VIDEO-CREATOR-SIMPLIFIED.git
   cd SHORT-VIDEO-CREATOR-SIMPLIFIED
   ```

2. **Install Dependencies**:
   Use npm to install all necessary packages:
   ```sh
   npm install
   ```

## Step 3: Configuration

Configuration settings are managed through a JSON file. Here is how you can set it up:

1. **Copy the Example Configuration**:
   ```sh
   cp config/default.example.json config/default.json
   ```

2. **Edit the Configuration File**:
   Open `config/default.json` in a text editor and replace placeholder values with your actual API keys and settings. Here is an example of what the configuration might look like:

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

## Step 4: Preparing Your Input

To get started with content creation, prepare your input files:

1. **CSV File**:
   - Place your CSV file at `data/input/input.csv`. Each row represents a separate prompt for the video content generation.

2. **Parameters**:
   - Modify `data/input/parameters.json` to customize settings specific to each content generation session.

3. **Initial Prompt**:
   - Edit `data/input/initial_prompt.txt` to set a default prompt that will be used in generating scripts.

## Step 5: Running the Application

To start generating content, execute the following command:

```sh
npm start
```

This command runs the application, processing the prompts from the CSV file using various AI services to generate scripts, images, animations, and more.

## Step 6: Viewing Output

Upon successful execution, the generated content will be available in the `data/output` directory. The content is organized in a manner that facilitates easy import into video editing tools.

## Step 7: Troubleshooting

If you encounter any issues, check the `logs/app.log` file for messages, verify API keys, ensure proper CSV formatting, and double-check network configurations.

For further assistance, please refer to the [Troubleshooting](#troubleshooting) section of the documentation.

Congratulations! You are now ready to revolutionize your content creation process with SHORT-VIDEO-CREATOR-SIMPLIFIED.