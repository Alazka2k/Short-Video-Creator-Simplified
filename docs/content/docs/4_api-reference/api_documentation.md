# API Endpoints Documentation

## API Gateway (`localhost:3000`)

### Content Generation Services

#### LLM Service
- **Endpoint:** `POST /api/llm/generate`
- **Description:** Generates script content using OpenAI GPT models
- **Request Body:**
```json
{
    "jobId": "uuid",
    "inputPrompt": "Main video topic or theme",
    "llmGenParams": {
        "general": {
            "sceneAmount": "1-n",
            "lengthDescription": "Video length description",
            "generalDescription": "Additional context"
        },
        "script": {
            "characterPerspective": "Narrative perspective",
            "pacingStructure": "Rhythm and pacing style",
            "scriptTone": "Emotional tone",
            "vocabulary": "Language style"
        },
        "image": {
            "artistStyle": "Reference artist name",
            "shotStyle": "Visual style description",
            "aspectRatio": "9:16",
            "style": "raw",
            "sValue": "500"
        }
    }
}
```
- **Response:** `200 OK`
```json
{
    "message": "Content generated successfully",
    "result": {
        "jobId": "uuid",
        "content": {
            "prompt": "string",
            "title": "string",
            "description": "string",
            "hashtags": "string",
            "scenes": [
                {
                    "description": "string",
                    "visual_prompt": "string",
                    "video_prompt": "string",
                    "camera_movement": "string"
                }
            ],
            "music": {
                "title": "string",
                "lyrics": "string",
                "tags": "string"
            }
        }
    }
}
```

#### Voice Service
- **Endpoint:** `POST /api/voice/generate`
- **Description:** Generates voice narration using ElevenLabs
- **Request Body:**
```json
{
    "jobId": "uuid",
    "text": "Text to convert to speech",
    "sceneIndex": 1,
    "voiceId": "optional-voice-id"
}
```
- **Response:** `200 OK`
```json
{
    "message": "Voice generated successfully",
    "result": {
        "filePath": "string",
        "fileName": "string",
        "metadata": {
            "text": "string",
            "voiceId": "string",
            "generatedAt": "timestamp"
        }
    }
}
```

#### Image Service
- **Endpoint:** `POST /api/image/generate`
- **Description:** Generates images using Midjourney
- **Request Body:**
```json
{
    "jobId": "uuid",
    "prompt": "Image generation prompt",
    "sceneIndex": 1
}
```
- **Response:** `200 OK`
```json
{
    "message": "Image generated successfully",
    "result": {
        "filePath": "string",
        "fileName": "string",
        "originalUrl": "string",
        "imageUrl": "string",
        "metadata": {
            "prompt": "string",
            "generatedAt": "timestamp"
        }
    }
}
```

#### Animation Service
- **Endpoint:** `POST /api/animation/generate`
- **Description:** Creates animations from static images using Immersity AI
- **Request Body:**
```json
{
    "jobId": "uuid",
    "imagePath": "path/to/source/image",
    "videoPrompt": "Animation description",
    "sceneIndex": 1,
    "options": {
        "animationLength": 5,
        "animationPrompt": "Animation guidance"
    }
}
```
- **Response:** `200 OK`
```json
{
    "message": "Animation generated successfully",
    "result": {
        "filePath": "string",
        "fileName": "string",
        "metadata": {
            "duration": "number",
            "pattern": "string",
            "generatedAt": "timestamp"
        }
    }
}
```

#### Video Service
- **Endpoint:** `POST /api/video/generate`
- **Description:** Creates videos using Luma AI
- **Request Body:**
```json
{
    "jobId": "uuid",
    "imagePath": "path/to/source/image",
    "videoPrompt": "Video scene description",
    "cameraMovement": "pan/zoom/etc",
    "aspectRatio": "9:16",
    "sceneIndex": 1
}
```
- **Response:** `200 OK`
```json
{
    "message": "Video generated successfully",
    "result": {
        "filePath": "string",
        "fileName": "string",
        "metadata": {
            "duration": "number",
            "generatedAt": "timestamp"
        }
    }
}
```

#### Assembly Service
- **Endpoint:** `POST /api/assembly/assemble`
- **Description:** Assembles final video from generated content using JSON2Video
- **Request Body:**
```json
{
    "jobId": "uuid",
    "scenes": [
        {
            "duration": 5,
            "transition": {
                "type": "fade|dissolve|slide",
                "duration": 0.5
            },
            "videoUrl": "path/to/video/file.mp4",
            "voiceUrl": "path/to/voice/file.mp3"
        }
    ],
    "musicUrl": "path/to/music/file.mp3",
    "options": {
        "format": "mp4",
        "resolution": "1080p",
        "aspectRatio": "9:16",
        "fps": 30,
        "musicVolume": 0.3,
        "voiceVolume": 1.0
    }
}
```
- **Response:** `200 OK`
```json
{
    "message": "Video assembled successfully",
    "result": {
        "assemblyId": "string",
        "status": "processing|completed|failed",
        "outputUrl": "string",
        "metadata": {
            "duration": "number",
            "format": "string",
            "resolution": "string",
            "generatedAt": "timestamp"
        }
    }
}
```

- **Endpoint:** `GET /api/assembly/status/:jobId`
- **Description:** Retrieves assembly status
- **Response:** `200 OK`
```json
{
    "status": "processing|completed|failed",
    "progress": "number",
    "error": "string|null"
}
```

### Job Management

#### Job Service
- **Endpoint:** `POST /api/job/generate`
- **Description:** Initiates complete content generation pipeline
- **Request Body:**
```json
{
    "prompt": "Video topic or theme",
    "parameters": {
        "llmGenParams": {
            "general": {
                "sceneAmount": "1-n",
                "lengthDescription": "Video length description",
                "generalDescription": "Additional context"
            },
            "script": {
                "characterPerspective": "Narrative perspective",
                "pacingStructure": "Rhythm and pacing style",
                "scriptTone": "Emotional tone",
                "vocabulary": "Language style"
            },
            "image": {
                "artistStyle": "Reference artist name",
                "shotStyle": "Visual style description",
                "aspectRatio": "9:16",
                "style": "raw",
                "sValue": "500"
            }
        },
        "voiceGenParams": {
            "voiceId": "voice-id"
        },
        "imageGenParams": {},
        "videoGenParams": {
            "aspectRatio": "9:16"
        }
    },
    "visualizationType": "video"
}
```

- **Endpoint:** `GET /api/job/jobs/:jobId`
- **Description:** Retrieves job status and details
- **Response:** `200 OK`
```json
{
    "jobId": "uuid",
    "status": "pending|in_progress|completed|failed",
    "prompt": "string",
    "metadata": {
        "progress": {
            "llm": "status",
            "voice": "status",
            "image": "status",
            "video": "status"
        },
        "outputs": {
            "llm": "object",
            "voice": "object",
            "image": "object",
            "video": "object"
        }
    },
    "createdAt": "timestamp",
    "updatedAt": "timestamp"
}
```

### Health Checks
All services implement a standard health check endpoint:
- **Endpoint:** `GET /health`
- **Response:** `200 OK`
```json
{
    "status": "Service is healthy"
}
```

### Media Access
- **Endpoint:** `GET /media/*`
- **Description:** Serves generated media files
- **Base Path:** `/media/[service]/[date]/[jobId]/[filename]`

### Error Responses
All services use standardized error responses:
```json
{
    "error": "Error type",
    "details": "Error description",
    "code": "Error code"
}
```

Common HTTP status codes:
- `400`: Bad Request
- `401`: Unauthorized
- `404`: Not Found
- `500`: Internal Server Error
- `504`: Gateway Timeout