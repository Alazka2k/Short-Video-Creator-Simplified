# Job Progress Tracking Documentation

This document explains the structure and logic of the progress tracking object within the `job-service`. This object is designed to provide a comprehensive, real-time view of a job's status as it moves through the various microservices.

## How the Progress Object Works

The `ProgressTracker` utility maintains a single, detailed object for each active job in memory. This object is not overwritten on each update; instead, it's a living document where individual pieces are updated as services report their status.

The core design principles are:
- **No Overwriting:** Progress for one scene or service does not overwrite another. The object is a composite state of all components.
- **Scene-Specific Tracking:** The `sceneProgress` object acts as a map, where each scene ID has its own sub-object to track the state of all services for that specific scene.
- **Job-Wide Services:** Services like `music` that are not tied to a scene are tracked separately in the `serviceProgress` object.

### High-Level Structure

```javascript
// High-Level Structure
{
  jobId: "...",
  status: "in_progress",
  services: ["llm", "image", "video"], // List of active services for this job
  scenesCount: 2,
  overallProgress: 45, // Weighted and calculated from all sub-tasks below

  // For job-wide services (not tied to a specific scene)
  serviceProgress: {
    "llm": { status: "completed", ... },
    "music": { status: "in_progress", progress: 50, ... }
  },

  // For scene-specific services
  sceneProgress: {
    "1": { // Progress for Scene 1
      "image": { status: "completed", ... },
      "video": { status: "in_progress", progress: 20, ... },
      "voice": { status: "skipped", ... }
    },
    "2": { // Progress for Scene 2
      "image": { status: "in_progress", progress: 30, ... },
      "video": { status: "pending", ... } // Not yet started
    }
  }
}
```

---

## Progress Object Examples for Different Use Cases

#### 1. Image Only (One Scene)
Midway through image generation.
```json
{
  "status": "in_progress",
  "services": ["llm", "image"],
  "scenesCount": 1,
  "overallProgress": 60,
  "serviceProgress": {
    "llm": { "status": "completed" }
  },
  "sceneProgress": {
    "1": {
      "image": { "status": "in_progress", "progress": 55 }
    }
  }
}
```

#### 2. Image Only (Multiple Scenes)
`scene 1` is done, `scene 2` is in progress.
```json
{
  "status": "in_progress",
  "services": ["llm", "image"],
  "scenesCount": 2,
  "overallProgress": 73,
  "serviceProgress": {
    "llm": { "status": "completed" }
  },
  "sceneProgress": {
    "1": {
      "image": { "status": "completed" }
    },
    "2": {
      "image": { "status": "in_progress", "progress": 42 }
    }
  }
}
```

#### 3. Image with Video
`scene 1`'s image is done and its video has just started. `scene 2`'s image is still generating.
```json
{
  "status": "in_progress",
  "services": ["llm", "image", "video"],
  "scenesCount": 2,
  "overallProgress": 41,
  "serviceProgress": {
    "llm": { "status": "completed" }
  },
  "sceneProgress": {
    "1": {
      "image": { "status": "completed" },
      "video": { "status": "in_progress", "progress": 10 }
    },
    "2": {
      "image": { "status": "in_progress", "progress": 80 },
      "video": { "status": "pending" }
    }
  }
}
```

#### 4. Image with Animation
This looks identical to "Image with Video," just with `animation` as the service key.
```json
{
  "status": "in_progress",
  "services": ["llm", "image", "animation"],
  "scenesCount": 1,
  "overallProgress": 55,
  "serviceProgress": {
    "llm": { "status": "completed" }
  },
  "sceneProgress": {
    "1": {
      "image": { "status": "completed" },
      "animation": { "status": "in_progress", "progress": 15 }
    }
  }
}
```

#### 5. Image with Voice
A single scene where the voice is done but the image is still processing.
```json
{
  "status": "in_progress",
  "services": ["llm", "image", "voice"],
  "scenesCount": 1,
  "overallProgress": 48,
  "serviceProgress": {
    "llm": { "status": "completed" }
  },
  "sceneProgress": {
    "1": {
      "image": { "status": "in_progress", "progress": 40 },
      "voice": { "status": "completed" }
    }
  }
}
```

#### 6. Music Only
The job is only generating an LLM script and a music track. There are no scenes.
```json
{
  "status": "in_progress",
  "services": ["llm", "music"],
  "scenesCount": 0,
  "overallProgress": 50,
  "serviceProgress": {
    "llm": { "status": "completed" },
    "music": { "status": "in_progress", "progress": 48 }
  },
  "sceneProgress": {}
}
```

#### 7. Image with Music
A combination of a job-level service (`music`) and scene-level services (`image`).
```json
{
  "status": "in_progress",
  "services": ["llm", "music", "image"],
  "scenesCount": 2,
  "overallProgress": 65,
  "serviceProgress": {
    "llm": { "status": "completed" },
    "music": { "status": "in_progress", "progress": 70 }
  },
  "sceneProgress": {
    "1": {
      "image": { "status": "completed" }
    },
    "2": {
      "image": { "status": "in_progress", "progress": 30 }
    }
  }
}
```

## Final Metadata Object Examples for Different Use Cases of Completed Jobs

This section shows what the `metadata` JSON object in the `jobs` table should look like for various types of **completed** jobs. This object contains the final results and assets, not the in-flight progress.

#### 1. Image Only (Single Scene)
```json
{
  "llmResult": {
    "title": "My Video Title",
    "scenes": [{ "description": "A cat wearing a tiny hat." }]
  },
  "scenes": [
    {
      "sceneId": 1,
      "image": {
        "status": "completed",
        "publicUrl": "https://your-s3-bucket/image/...",
        "storageKey": "image/..."
      }
    }
  ],
  "parameters": { "...": "..." }
}
```

#### 2. Image with Video (Multiple Scenes)
```json
{
  "llmResult": {
    "title": "My Multi-Scene Video",
    "scenes": [
      { "description": "A dog on a skateboard." },
      { "description": "The same dog surfing." }
    ]
  },
  "scenes": [
    {
      "sceneId": 1,
      "image": {
        "status": "completed",
        "publicUrl": "https://your-s3-bucket/image/scene1...",
        "storageKey": "image/scene1..."
      },
      "video": {
        "status": "completed",
        "publicUrl": "https://your-s3-bucket/video/scene1...",
        "storageKey": "video/scene1..."
      }
    },
    {
      "sceneId": 2,
      "image": {
        "status": "completed",
        "publicUrl": "https://your-s3-bucket/image/scene2...",
        "storageKey": "image/scene2..."
      },
      "video": {
        "status": "completed",
        "publicUrl": "https://your-s3-bucket/video/scene2...",
        "storageKey": "video/scene2..."
      }
    }
  ],
  "parameters": { "...": "..." }
}
```

#### 3. Image with Animation and Voice
```json
{
  "llmResult": {
    "title": "My Animated Story",
    "scenes": [{ "description": "A robot learning to paint." }]
  },
  "scenes": [
    {
      "sceneId": 1,
      "image": {
        "status": "completed",
        "publicUrl": "https://your-s3-bucket/image/...",
        "storageKey": "image/..."
      },
      "animation": {
        "status": "completed",
        "publicUrl": "https://your-s3-bucket/animation/...",
        "storageKey": "animation/..."
      },
      "voice": {
        "status": "completed",
        "publicUrl": "https://your-s3-bucket/voice/...",
        "storageKey": "voice/..."
      }
    }
  ],
  "parameters": { "...": "..." }
}
```

#### 4. Music Only
For a job that only creates a script and a background track, the `scenes` array will be empty.
```json
{
  "llmResult": {
    "title": "My Audio Track",
    "scenes": []
  },
  "music": {
    "status": "completed",
    "publicUrl": "https://your-s3-bucket/music/...",
    "storageKey": "music/..."
  },
  "scenes": [],
  "parameters": { "...": "..." }
}
```

#### 5. Image with Music (Job-level service)
```json
{
  "llmResult": {
    "title": "My Slideshow with Music",
    "scenes": [
      { "description": "A picture of a mountain." },
      { "description": "A picture of a beach." }
    ]
  },
  "music": {
    "status": "completed",
    "publicUrl": "https://your-s3-bucket/music/...",
    "storageKey": "music/..."
  },
  "scenes": [
    {
      "sceneId": 1,
      "image": {
        "status": "completed",
        "publicUrl": "https://your-s3-bucket/image/scene1...",
        "storageKey": "image/scene1..."
      }
    },
    {
      "sceneId": 2,
      "image": {
        "status": "completed",
        "publicUrl": "https://your-s3-bucket/image/scene2...",
        "storageKey": "image/scene2..."
      }
    }
  ],
  "parameters": { "...": "..." }
}
```
