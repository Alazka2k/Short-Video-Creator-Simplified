```markdown
# 4. API Reference

This section provides a detailed reference for the API endpoints used by the SHORT-VIDEO-CREATOR-SIMPLIFIED application. Each service component follows RESTful conventions and is designed to integrate seamlessly within the application’s microservices architecture.

## 4.1. API Gateway

### 4.1.1 /api/auth
Handles user authentication, including registration, login, and token management.

- **POST** `/register`
  - Description: Registers a new user.
  - Request Body:
    ```json
    {
      "username": "string",
      "email": "string",
      "password": "string"
    }
    ```
  - Response:
    ```json
    {
      "message": "User registered successfully",
      "userId": "UUID"
    }
    ```
  - Response Codes:  
    - 201: User registered
    - 400: Validation error
    - 409: User already exists

- **POST** `/login`
  - Description: Logs in a user and returns an authentication token.
  - Request Body:
    ```json
    {
      "email": "string",
      "password": "string"
    }
    ```
  - Response:
    ```json
    {
      "token": "string",
      "userId": "UUID"
    }
    ```
  - Response Codes:  
    - 200: Successful login
    - 401: Unauthorized

### 4.1.2 /api/job
Handles content creation jobs, managing processes across the AI services.

- **POST** `/create`
  - Description: Initiates a content generation job.
  - Request Body:
    ```json
    {
      "prompts": ["string"],
      "parameters": { "key": "value" }
    }
    ```
  - Response:
    ```json
    {
      "jobId": "UUID",
      "status": "created"
    }
    ```
  - Response Codes:  
    - 202: Job created
    - 400: Bad request

- **GET** `/status/:jobId`
  - Description: Retrieves the current status of a specific job.
  - Response:
    ```json
    {
      "jobId": "UUID",
      "status": "status enum",
      "details": { "key": "value" }
    }
    ```
  - Response Codes:  
    - 200: Success
    - 404: Job not found

## 4.2. LLM Service API

### 4.2.1 /api/llm/generate-script
Generates dynamic scripts using the OpenAI GPT model.

- **POST** `/`
  - Description: Sends prompts for script generation.
  - Request Body:
    ```json
    {
      "prompt": "string",
      "context": "string"
    }
    ```
  - Response:
    ```json
    {
      "script": "string",
      "metadata": { "key": "value" }
    }
    ```
  - Response Codes:  
    - 200: Script generated
    - 500: Internal server error

## 4.3. Voice Generation Service API

### 4.3.1 /api/voice/generate
Uses Elevenlabs for voice synthesis.

- **POST** `/`
  - Description: Converts text into a synthesized voice narration.
  - Request Body:
    ```json
    {
      "text": "string"
    }
    ```
  - Response:
    ```json
    {
      "voiceUrl": "string"
    }
    ```
  - Response Codes:  
    - 200: Voice generated
    - 400: Invalid input

## 4.4. Image Generation Service API

### 4.4.1 /api/image/generate
Integrates with Midjourney's API for creating images.

- **POST** `/`
  - Description: Generates images based on descriptive prompts.
  - Request Body:
    ```json
    {
      "description": "string"
    }
    ```
  - Response:
    ```json
    {
      "imageUrl": "string"
    }
    ```
  - Response Codes:  
    - 200: Image generated
    - 503: Service unavailable

## 4.5. Animation Generation Service API

### 4.5.1 /api/animation/generate
Creates animations using Immersity AI.

- **POST** `/`
  - Description: Converts images into animations.
  - Request Body:
    ```json
    {
      "imageId": "UUID"
    }
    ```
  - Response:
    ```json
    {
      "animationUrl": "string"
    }
    ```
  - Response Codes:  
    - 200: Animation created
    - 400: Invalid input

## 4.6. Music Generation Service API

### 4.6.1 /api/music/generate
Produces background scores utilizing Suno AI.

- **POST** `/`
  - Description: Generates custom music tracks.
  - Request Body:
    ```json
    {
      "style": "string",
      "duration": "number"
    }
    ```
  - Response:
    ```json
    {
      "musicUrl": "string"
    }
    ```
  - Response Codes:  
    - 200: Music track generated
    - 403: Forbidden

## 4.7. Video Generation Service API

### 4.7.1 /api/video/compose
Leverages Luma AI for video compilations.

- **POST** `/`
  - Description: Composes final video outputs from various media components.
  - Request Body:
    ```json
    {
      "components": [
        {
          "type": "enum",
          "id": "UUID"
        }
      ]
    }
    ```
  - Response:
    ```json
    {
      "videoUrl": "string"
    }
    ```
  - Response Codes:  
    - 200: Video composed
    - 500: Composition error

Each API endpoint follows a consistent pattern of authentication, resource handling, and error management, ensuring a streamlined development and operational workflow. Always ensure to handle API keys and user credentials securely when interacting with these endpoints.
```
