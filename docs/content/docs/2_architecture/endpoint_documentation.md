# API Endpoints Overview

## API Gateway (Port 3000)

### LLM Service
- **POST /api/llm/generate**
  - Generates script content using OpenAI
  - Request:
  ```json
  {
    "inputPrompt": "A video about the impact of Pokemon",
    "llmGenParams": {
      "general": {
        "sceneAmount": "2",
        "lengthDescription": "Your task is to write a 45 seconds video",
        "generalDescription": "Focus on both impacts"
      },
      "script": {
        "characterPerspective": "Content Creator",
        "pacingStructure": "Fast-Paced Rhythm",
        "scriptTone": "Enthusiastic",
        "vocabulary": "Engaging Questions"
      },
      "image": {
        "artistStyle": "Jakub Rozalski",
        "shotStyle": "Photorealistic, cinematic",
        "aspectRatio": "9:16",
        "style": "raw",
        "sValue": "500"
      }
    }
  }
  ```

### Voice Service
- **POST /api/voice/generate**
  - Generates voice narration using ElevenLabs
  - Request:
  ```json
  {
    "text": "Script text to convert",
    "sceneIndex": 1,
    "jobId": "uuid",
    "voiceId": "21m00Tcm4TlvDq8ikWAM"
  }
  ```

### Image Service
- **POST /api/image/generate**
  - Generates images using Midjourney
  - Request:
  ```json
  {
    "prompt": "Image generation prompt",
    "sceneIndex": 1,
    "jobId": "uuid"
  }
  ```

### Video Service
- **POST /api/video/generate**
  - Creates videos using Luma AI
  - Request:
  ```json
  {
    "imagePath": "path/to/source/image.png",
    "videoPrompt": "Video scene description",
    "cameraMovement": "pan/zoom/etc",
    "aspectRatio": "16:9",
    "sceneIndex": 1,
    "jobId": "uuid"
  }
  ```

### Job Service
- **POST /api/job/generate**
  - Complete content pipeline execution
  - Request:
  ```json
  {
    "prompt": "Video topic",
    "parameters": {
      "llmGenParams": {/* Same as LLM params */},
      "voiceGenParams": {"voiceId": "21m00Tcm4TlvDq8ikWAM"},
      "imageGenParams": {},
      "videoGenParams": {"aspectRatio": "16:9"}
    },
    "visualizationType": "video"
  }
  ```

- **GET /api/job/jobs/:jobId**
  - Retrieves status of specific job
  - Response includes job status, metadata, progress

- **GET /api/job/jobs**
  - Lists all jobs
  - Optional query parameters for filtering

## Health Checks
All services expose:
- **GET /health**
  - Returns service health status
  ```json
  {"status": "Service is healthy"}
  ```

Files are stored in service-specific directories:
- LLM: `data/output/llm/[date]/[jobId]`
- Voice: `data/output/voice/[date]/[jobId]/scene_[X]`
- Image: `data/output/image/[date]/[jobId]/scene_[X]`
- Video: `data/output/video/[date]/[jobId]/scene_[X]`