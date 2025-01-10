# API Endpoints Documentation

## API Gateway (`localhost:3000`)

### Content Generation Services

#### LLM Service
- **Endpoint:** `POST /api/llm/generate`
- **Description:** Generates script content using OpenAI GPT models
- **Request Body:**
```json
{
    "jobId": "uuid",                    // required
    "inputPrompt": "string",            // required
    "llmGenParams?": {                  // optional
        "general?": {                   // optional
            "sceneAmount?": "number",   // optional, default: 3, range: 1-10
            "lengthDescription?": "string", // optional, e.g., "short", "medium", "long"
            "generalDescription?": "string", // optional, additional context
            "targetAudience?": "string", // optional, e.g., "teens", "adults"
            "contentStyle?": "string"    // optional, e.g., "educational", "entertaining"
        },
        "script?": {                    // optional
            "characterPerspective?": "first_person|second_person|third_person", // optional
            "pacingStructure?": "string", // optional, e.g., "dynamic", "steady"
            "scriptTone?": "string",    // optional, e.g., "professional", "casual"
            "vocabulary?": "string",     // optional, e.g., "simple", "technical"
            "emotionalTone?": "string",  // optional, e.g., "upbeat", "serious"
            "callToAction?": "string"    // optional, ending message type
        },
        "image?": {                     // optional
            "artistStyle?": "string",   // optional, reference artist or style
            "shotStyle?": "string",     // optional, e.g., "close-up", "wide"
            "aspectRatio?": "string",   // optional, default: "9:16"
            "style?": "raw|artistic",   // optional, default: "raw"
            "sValue?": "number",        // optional, default: 500
            "colorScheme?": "string",   // optional, preferred colors
            "lighting?": "string",      // optional, e.g., "bright", "moody"
            "background?": "string"     // optional, background description
        }
    },
    "model?": "string",                 // optional, default: "gpt-4"
    "temperature?": "number",           // optional, default: 0.7, range: 0-2
    "maxTokens?": "number",             // optional, default: 2000
    "language?": "string",              // optional, default: "en"
    "format?": "json|markdown|text",    // optional, default: "json"
}
```
- **Response:** `200 OK`
```json
{
    "message": "Content generated successfully",
    "result": {
        "jobId": "uuid",
        "content": {
            "prompt": "string",         // Original or enhanced prompt
            "title": "string",          // Generated video title
            "description": "string",    // Video description
            "hashtags": ["string"],     // Relevant hashtags
            "scenes": [
                {
                    "sceneId": "number",
                    "description": "string",     // Scene narrative
                    "visual_prompt": "string",   // Image generation prompt
                    "video_prompt": "string",    // Video generation guidance
                    "camera_movement?": "string", // Optional camera direction
                    "duration?": "number",       // Suggested duration in seconds
                    "transition?": {             // Optional transition effect
                        "style": "string",
                        "duration": "number"
                    },
                    "voice": {
                        "text": "string",        // Narration text
                        "tone?": "string",       // Speaking tone
                        "emphasis?": ["string"]  // Words to emphasize
                    }
                }
            ],
            "music": {
                "mood": "string",       // Suggested music mood
                "tempo": "string",      // Suggested tempo
                "genre?": "string",     // Optional genre
                "keywords": ["string"]  // Music search keywords
            },
            "metadata": {
                "totalScenes": "number",
                "estimatedDuration": "number",
                "targetAudience": "string",
                "contentStyle": "string",
                "generatedAt": "timestamp"
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
    "elevenlabsVoiceId": "optional-voice-id"
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

#### Music Service
- **Endpoint:** `POST /api/music/generate`
- **Description:** Generates background music using Suno API and Acedata API
- **Request Body:**
```json
{
    "jobId": "uuid",                    // required
    "title": "string",                  // required
    "prompt": "string",                 // required
    "style?": "string",                 // optional
    "lyric?": "string",                 // optional
    "custom?": "boolean",               // optional, default: false
    "instrumental?": "boolean"          // optional, default: true
}
```
- **Response:** `200 OK`
```json
{
    "message": "Music generated successfully",
    "result": {
        "filePath": "string",
        "fileName": "string",
        "title": "string",
        "style": "string",
        "storage_key": "string",
        "public_url": "string",
        "metadata": {
            "generationId": "string",
            "created_at": "timestamp",
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
    "jobId": "uuid",                    // required
    "imagePath": "string",              // required, local path or URL
    "sceneIndex": "number",             // required
    "options?": {                       // optional
        "animationLength?": "number",   // optional, in seconds, default from config
        "videoPrompt?": "string"        // optional, used for pattern selection
    }
}
```
- **Response:** `200 OK`
```json
{
    "message": "Animation generated successfully",
    "result": {
        "filePath": "string",           // Local file path
        "fileName": "string",           // Name of generated file
        "storage_key": "string",        // S3 storage key
        "public_url": "string",         // Public access URL
        "metadata": {
            "prompt": "string",         // Original video prompt
            "duration": "number",       // Animation length in seconds
            "generatedAt": "timestamp", // Generation timestamp
            "patternId": "string",      // Used animation pattern ID
            "animationParameters": {     // Technical parameters
                "inputImageUrl": "string",
                "animationLength": "number"
            }
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
    "jobId": "uuid",                    // required
    "imagePath": "string",              // required, local path or URL
    "sceneIndex": "number",             // required
    "videoPrompt": "string",            // required, scene description
    "options?": {                       // optional
        "cameraMovement?": "string",    // optional, e.g., "pan", "zoom"
        "aspectRatio?": "string",       // optional, default: "9:16"
        "duration?": "number",          // optional, in seconds, default: 5
        "quality?": "string",           // optional, default: "high"
        "fps?": "number",               // optional, default: 30
        "stabilization?": "boolean"     // optional, default: true
    }
}
```
- **Response:** `200 OK`
```json
{
    "message": "Video generated successfully",
    "result": {
        "video_id": "number",
        "job_id": "uuid",
        "scene_id": "number",
        "file_path": "string",          // Local file path
        "storage_key": "string",        // S3 storage key
        "public_url": "string",         // Public access URL
        "metadata": {
            "prompt": "string",         // Original video prompt
            "duration": "number",       // Video length in seconds
            "generatedAt": "timestamp", // Generation timestamp
            "cameraMovement": "string", // Used camera movement
            "aspectRatio": "string",    // Video aspect ratio
            "quality": "string",        // Video quality setting
            "fps": "number",            // Frames per second
            "generatedFromImage": "boolean" // Whether video was generated from image
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
    "jobId": "uuid",                    // required
    "scenes": [                         // required, array of scenes
        {
            "sceneId": "number",        // required
            "duration": "number",        // required, in seconds
            "elements": {               // required
                "visual": "string",     // required, URL to video/image
                "voice": "string"       // required, URL to voice audio
            },
            "transition?": {            // optional
                "style": "string",      // required if transition present
                "duration": "number"    // required if transition present, in seconds
            }
        }
    ],
    "exports?": [{                      // optional
        "format": "mp4",               // optional, default: "mp4"
        "resolution": "1080p"          // optional, default: "1080p"
    }],
    "fps?": "number",                   // optional, default: 30
    "width?": "number",                 // optional, default: 1080
    "height?": "number",                // optional, default: 1920
    "quality?": "string"                // optional, default: "high"
}
```
- **Response:** `200 OK`
```json
{
    "message": "Video assembly started",
    "result": {
        "assembly_id": "number",
        "job_id": "uuid",
        "project_id": "string",        // JSON2Video project ID
        "status": "processing",
        "file_path": "string",         // Local file path
        "storage_key": "string",       // S3 storage key
        "public_url": "string",        // Public access URL
        "metadata": {
            "scenes": "number",
            "startedAt": "timestamp",
            "completedAt?": "timestamp",
            "duration?": "number",      // Total duration in seconds
            "finalStats?": {
                "framesProcessed": "number",
                "totalFrames": "number"
            }
        }
    }
}
```

- **Endpoint:** `GET /api/assembly/status/:jobId`
- **Description:** Retrieves assembly status and output information
- **Response:** `200 OK`
```json
{
    "assembly_id": "number",
    "job_id": "uuid",
    "project_id": "string",
    "status": "pending|processing|completed|failed",
    "file_path": "string",
    "storage_key": "string",
    "public_url": "string",
    "metadata": {
        "scenes": "number",
        "startedAt": "timestamp",
        "completedAt?": "timestamp",
        "duration?": "number",
        "error?": "string",
        "progress?": "number",         // 0-100
        "finalStats?": {
            "framesProcessed": "number",
            "totalFrames": "number"
        }
    }
}
```

#### Assembly Configuration
The service supports the following video configurations:
- **Resolution:** 1080p (1080x1920 for vertical videos)
- **Frame Rate:** 30 fps
- **Quality:** High
- **Output Format:** MP4
- **Transitions:**
  - fade
  - fade_to_black
  - fade_to_white
  - slide_left
  - slide_right
  - slide_up
  - slide_down
  - zoom_in
  - zoom_out

### Job Management

#### Job Service
- **Endpoint:** `POST /api/job/generate`
- **Description:** Initiates complete content generation pipeline
- **Request Body:**
```json
{
    "prompt": "string",                 // required, main video topic/theme
    "userId?": "string",                // optional, user identifier
    "parameters?": {                    // optional
        "llmGenParams?": {             // optional, LLM generation parameters
            "general?": {
                "sceneAmount?": "number",
                "lengthDescription?": "string", // optional
                "generalDescription?": "string", // optional
                "targetAudience?": "string" // optional
            },
            "script?": {
                "characterPerspective?": "string", // optional
                "pacingStructure?": "string", // optional
                "scriptTone?": "string",    // optional
                "vocabulary?": "string"     // optional
            },
            "image?": {
                "aspectRatio?": "string",   // required, e.g. "9:16"
                "artistStyle?": "string",   // optional
                "shotStyle?": "string",     // optional
                "style?": "string",         // optional
                "colorScheme?": "string"    // optional
            }
        },
        "voiceGenParams?": {           // optional, voice generation parameters
            "elevenlabsVoiceId": "string",      // required, select from list of voices
            "stability?": "number",     // optional, range: 0-1
            "similarity?": "number",    // optional, range: 0-1
            "style?": "string"         // optional
        },
        "imageGenParams?": {           // optional, image generation parameters
            "quality?": "string",      // optional
            "style?": "string",        // optional
            "negativePrompt?": "string" // optional
        },
        "videoGenParams?": {           // optional, video generation parameters
            "aspectRatio?": "string",  // required, e.g. "16:9"
            "quality?": "string",      // optional, default: "high"
            "fps?": "number"           // optional, default: 30
        }
    },
    "serviceConfig?": {                // optional, service configuration parameters
        "skipVoice?": "boolean",      // optional, default: false
        "skipMusic?": "boolean",       // optional, default: false
        "skipImage?": "boolean",       // optional, default: false
        "skipVisualization?": "boolean",       // optional, default: false
    },  
    "visualizationType?": "video|animation", // optional, default: "video"
    "priority?": "number"             // optional, default: 1
}
```

- **Response:** `200 OK`
```json
{
    "message": "Job created successfully",
    "result": {
        "jobId": "uuid",
        "userId": "string",
        "status": "pending",
        "prompt": "string",
        "visualizationType": "string",
        "priority": "number",
        "metadata": {
            "createdAt": "timestamp",
            "updatedAt": "timestamp",
            "parameters": {
                "llmGenParams": {},
                "voiceGenParams": {},
                "imageGenParams": {},
                "videoGenParams": {}
            }
        }
    }
}
```

- **Endpoint:** `GET /api/job/status/:jobId`
- **Description:** Retrieves job status and progress
- **Response:** `200 OK`
```json
{
    "jobId": "uuid",
    "status": "pending|in_progress|completed|failed",
    "progress": {
        "llm": "pending|completed|failed",
        "voice": "pending|completed|failed",
        "image": "pending|completed|failed",
        "video": "pending|completed|failed",
        "assembly": "pending|completed|failed"
    },
    "outputs": {
        "llm?": {},      // LLM generation result
        "voice?": {},    // Voice generation result
        "image?": {},    // Image generation result
        "video?": {},    // Video generation result
        "assembly?": {}  // Assembly result
    },
    "error?": {
        "service": "string",
        "message": "string",
        "details": "string"
    },
    "metadata": {
        "createdAt": "timestamp",
        "updatedAt": "timestamp",
        "completedAt?": "timestamp",
        "duration?": "number"
    }
}
```

### Media Access
- **Endpoint:** `GET /media/*`
- **Query Parameters:**
```
download?: boolean  // optional, force download instead of preview
expires?: number    // optional, URL expiration time in seconds
quality?: string    // optional, image quality for resizing
```

### Health Checks
- **Endpoint:** `GET /health`
- **Query Parameters:**
```
detailed?: boolean  // optional, include detailed service status
timeout?: number    // optional, custom timeout for checks
```

### Error Responses