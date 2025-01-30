# Content Generation API Examples

This document provides examples of API requests that can be generated from our UI input funnel, along with explanations of the parameters and expected responses.

## Basic Structure

All requests are made to the endpoint: `/api/job/generate`

### Request Structure
```typescript
interface JobRequest {
  prompt: string;                 // Main content prompt
  parameters: {
    llmGenParams: {              // Language model parameters
      general: {
        sceneAmount?: string;    // Number of scenes to generate
        lengthDescription?: string; // Target video length description
      };
      script: {
        characterPerspective?: string; // Narrative perspective
        pacingStructure?: string;    // Scene pacing and transitions
        scriptTone?: string;         // Tone of the content
        vocabulary?: string;         // Language style
      };
      image?: {
        aspectRatio?: string;      // Image aspect ratio
      };
    };
    voiceGenParams?: {           // Voice generation parameters
      elevenlabsVoiceId?: string; // Selected voice ID
    };
    imageGenParams?: {};         // Image generation parameters (reserved)
    animationGenParams?: {};     // Animation parameters (reserved)
    videoGenParams?: {           // Video generation parameters
      aspectRatio?: string;      // Video aspect ratio
    };
    musicGenParams?: {           // Music generation parameters
      instrumental?: boolean;     // Whether to generate instrumental
    };
    serviceConfig: {             // Service execution flags
      skipVoice: boolean;        // Skip voice generation
      skipMusic: boolean;        // Skip music generation
      skipImage: boolean;        // Skip image generation
      skipVisualization: boolean; // Skip visualization (video/animation)
    };
    visualizationType: "video" | "animation"; // Type of visualization
  };
}
```

### Response Structure
```typescript
interface JobResponse {
  message: string;
  result: {
    jobId: string;
    status: "completed" | "failed" | "in_progress";
    outputDir: string;
    content: {
      llm: {
        prompt: string;
        title: string;
        description: string;
        hashtags: string;
        scenes: Array<{
          description: string;
          visual_prompt: string;
          video_prompt: string;
          camera_movement: string;
          visual_metadata: {
            aspectRatio: string;
          };
        }>;
        music: {
          title: string;
          prompt: string;
          style: string;
          lyrics?: string;
        };
      };
      scenes: Array<{
        sceneId: number;
        voice?: {
          filePath: string;
          fileName: string;
          elevenlabsVoiceId: string;
          storageKey: string;
          publicUrl: string;
          metadata: {
            text: string;
            modelId: string;
            generatedAt: string;
          };
        };
        image?: {
          filePath: string;
          fileName: string;
          originalUrl: string;
          imageUrl: string;
          storageKey: string;
          publicUrl: string;
          metadata: {
            prompt: string;
            generatedAt: string;
          };
        };
        video?: {
          filePath: string;
          fileName: string;
          storage_key: string;
          public_url: string;
          metadata: {
            generationId: string;
            sourceImageUrl: string;
            generationDuration: number;
            generatedAt: string;
          };
        };
      }>;
      music?: {
        filePath: string;
        fileName: string;
        title: string;
        style: string;
        storage_key: string;
        public_url: string;
        metadata: {
          generationId: string;
          created_at: string;
          generatedAt: string;
        };
      };
    };
  };
}
```

## Example 1: Story-based Video Content

### Description
Creates a narrative video with voice, music, and visual elements.

```json
{
  "prompt": "A day in the life of a software developer",
  "parameters": {
    "llmGenParams": {
      "general": {
        "sceneAmount": "3",
        "lengthDescription": "Create a 60-second video"
      },
      "script": {
        "characterPerspective": "First Person: Personal narrative style",
        "pacingStructure": "Steady Flow: Natural transitions between scenes",
        "scriptTone": "Professional: Clear and informative delivery",
        "vocabulary": "Technical: Industry-specific terms with explanations"
      },
      "image": {
        "aspectRatio": "16:9"
      }
    },
    "voiceGenParams": {
      "elevenlabsVoiceId": "pNInz6obpgDQGcFmaJgB"
    },
    "videoGenParams": {
      "aspectRatio": "16:9"
    },
    "musicGenParams": {
      "instrumental": true
    },
    "serviceConfig": {
      "skipVoice": false,
      "skipMusic": false,
      "skipImage": false,
      "skipVisualization": false
    },
    "visualizationType": "video"
  }
}
```

**Expected Output:**
- 3 scenes showing different aspects of developer life
- Professional voice narration
- Background instrumental music
- Landscape format video clips
- Natural transitions between scenes

### Example 1 Expected Response:
```json
{
  "message": "Content generation completed successfully",
  "result": {
    "jobId": "dev-123-456",
    "status": "completed",
    "outputDir": "data/output/integration/2025-01-30/dev-123-456",
    "content": {
      "llm": {
        "prompt": "A day in the life of a software developer",
        "title": "Modern Developer's Journey",
        "description": "Experience a typical day of a software developer, from morning coding sessions to collaborative team meetings.",
        "hashtags": "#CodingLife #DeveloperDay #TechCareer #Programming #SoftwareEngineering",
        "scenes": [
          {
            "description": "Early morning. A developer starts their day with a fresh cup of coffee, reviewing code on multiple monitors.",
            "visual_prompt": "A modern home office setup with multiple monitors displaying code, a steaming coffee cup nearby, and morning light streaming through the window; --ar 16:9",
            "video_prompt": "Camera slowly pans across the desk setup, focusing on the screens with code and the coffee cup",
            "camera_movement": "Pan Right",
            "visual_metadata": {
              "aspectRatio": "16:9"
            }
          }
        ],
        "music": {
          "title": "Productive Flow",
          "prompt": "Modern, ambient electronic music with a steady rhythm perfect for focused work",
          "style": "Electronic Ambient"
        }
      },
      "scenes": [
        {
          "sceneId": 1,
          "voice": {
            "filePath": "data/output/voice/dev-123-456/scene_1/voice.mp3",
            "fileName": "voice.mp3",
            "elevenlabsVoiceId": "pNInz6obpgDQGcFmaJgB",
            "storageKey": "voice/dev-123-456/scene_1/voice.mp3",
            "publicUrl": "https://storage.example.com/voice/dev-123-456/scene_1/voice.mp3",
            "metadata": {
              "text": "Early morning. A developer starts their day with a fresh cup of coffee, reviewing code on multiple monitors.",
              "modelId": "eleven_multilingual_v2",
              "generatedAt": "2025-01-30T08:00:00Z"
            }
          }
        }
      ]
    }
  }
}
```

## Example 2: Social Media Short

### Description
Creates a vertical format video optimized for social media platforms.

```json
{
  "prompt": "5 quick productivity hacks",
  "parameters": {
    "llmGenParams": {
      "general": {
        "sceneAmount": "5",
        "lengthDescription": "Create a 30-second video"
      },
      "script": {
        "characterPerspective": "Content Creator: Shares tips and advice",
        "pacingStructure": "Fast-Paced Rhythm: Quick transitions",
        "scriptTone": "Energetic: Engaging and motivational",
        "vocabulary": "Casual: Accessible to general audience"
      },
      "image": {
        "aspectRatio": "9:16"
      }
    },
    "voiceGenParams": {
      "elevenlabsVoiceId": "EXAVITQu4vr4xnSDxMaL"
    },
    "videoGenParams": {
      "aspectRatio": "9:16"
    },
    "musicGenParams": {
      "instrumental": true
    },
    "serviceConfig": {
      "skipVoice": false,
      "skipMusic": false,
      "skipImage": false,
      "skipVisualization": false
    },
    "visualizationType": "video"
  }
}
```

**Expected Output:**
- 5 quick scenes with productivity tips
- Energetic voice narration
- Upbeat background music
- Vertical format optimized for mobile
- Dynamic transitions

## Example 3: Animation-based Educational Content

### Description
Creates an animated educational video with simplified visuals.

```json
{
  "prompt": "How does photosynthesis work?",
  "parameters": {
    "llmGenParams": {
      "general": {
        "sceneAmount": "4",
        "lengthDescription": "Create a 45-second educational video"
      },
      "script": {
        "characterPerspective": "Expert: Educational and explanatory",
        "pacingStructure": "Step-by-Step: Clear progression",
        "scriptTone": "Educational: Clear and engaging",
        "vocabulary": "Educational: Scientific terms with explanations"
      },
      "image": {
        "aspectRatio": "16:9"
      }
    },
    "voiceGenParams": {
      "elevenlabsVoiceId": "D38z5RcWu1voky8WS1ja"
    },
    "videoGenParams": {
      "aspectRatio": "16:9"
    },
    "musicGenParams": {
      "instrumental": true
    },
    "serviceConfig": {
      "skipVoice": false,
      "skipMusic": false,
      "skipImage": false,
      "skipVisualization": false
    },
    "visualizationType": "animation"
  }
}
```

**Expected Output:**
- 4 scenes explaining photosynthesis process
- Clear, educational voice narration
- Subtle background music
- Animated visuals with educational focus
- Smooth transitions between concepts

## Example 4: Product Showcase Video

### Description
Creates a product demonstration video with detailed visuals and professional narration.

```json
{
  "prompt": "Showcase the new iPhone 15 Pro features",
  "parameters": {
    "llmGenParams": {
      "general": {
        "sceneAmount": "4",
        "lengthDescription": "Create a 90-second product showcase"
      },
      "script": {
        "characterPerspective": "Professional Presenter: Expert product demonstration",
        "pacingStructure": "Feature Highlight: Focus on key features with smooth transitions",
        "scriptTone": "Professional and Enthusiastic: Engaging product presentation",
        "vocabulary": "Technical with Clarity: Balance of technical terms and consumer-friendly language"
      },
      "image": {
        "aspectRatio": "16:9"
      }
    },
    "voiceGenParams": {
      "elevenlabsVoiceId": "TxGEqnHWrfWFTfGW9XjX"
    },
    "videoGenParams": {
      "aspectRatio": "16:9"
    },
    "musicGenParams": {
      "instrumental": true
    },
    "serviceConfig": {
      "skipVoice": false,
      "skipMusic": false,
      "skipImage": false,
      "skipVisualization": false
    },
    "visualizationType": "video"
  }
}
```

**Expected Output:**
- 4 scenes highlighting different product features
- Professional presenter voice style
- Modern background music
- High-quality product visualization
- Cinematic transitions

### Example 4 Expected Response:
```json
{
  "message": "Content generation completed successfully",
  "result": {
    "jobId": "dev-789-012",
    "status": "completed",
    "outputDir": "data/output/integration/2025-01-30/dev-789-012",
    "content": {
      "llm": {
        "prompt": "Showcase the new iPhone 15 Pro features",
        "title": "iPhone 15 Pro: Innovation Unleashed",
        "description": "Discover the groundbreaking features of the iPhone 15 Pro, from its revolutionary camera system to its powerful performance.",
        "hashtags": "#iPhone15Pro #Apple #TechReview #Innovation #Smartphone",
        "scenes": [
          {
            "description": "The iPhone 15 Pro emerges from darkness, its titanium frame gleaming under dramatic lighting.",
            "visual_prompt": "A professional product shot of the iPhone 15 Pro rotating slowly, with dramatic lighting highlighting its premium design; --ar 16:9",
            "video_prompt": "Camera circles around the iPhone, revealing its design details with dramatic lighting",
            "camera_movement": "Orbit",
            "visual_metadata": {
              "aspectRatio": "16:9"
            }
          }
        ],
        "music": {
          "title": "Tech Innovation",
          "prompt": "Modern, sophisticated electronic music with a sense of innovation and progress",
          "style": "Contemporary Electronic"
        }
      }
    }
  }
}
```

## Example 5: Recipe Tutorial

### Description
Creates a cooking tutorial with step-by-step instructions and detailed food visuals.

```json
{
  "prompt": "How to make authentic Italian pasta carbonara",
  "parameters": {
    "llmGenParams": {
      "general": {
        "sceneAmount": "6",
        "lengthDescription": "Create a 3-minute cooking tutorial"
      },
      "script": {
        "characterPerspective": "Chef: Expert culinary guidance",
        "pacingStructure": "Step-by-Step: Clear instruction flow",
        "scriptTone": "Warm and Instructive: Friendly expert guidance",
        "vocabulary": "Culinary: Professional cooking terms with explanations"
      },
      "image": {
        "aspectRatio": "16:9"
      }
    },
    "voiceGenParams": {
      "elevenlabsVoiceId": "VR6AewLTigWG4xSOukaG"
    },
    "videoGenParams": {
      "aspectRatio": "16:9"
    },
    "musicGenParams": {
      "instrumental": true
    },
    "serviceConfig": {
      "skipVoice": false,
      "skipMusic": false,
      "skipImage": false,
      "skipVisualization": false
    },
    "visualizationType": "video"
  }
}
```

**Expected Output:**
- 6 scenes showing cooking steps
- Warm, instructive narration
- Italian-inspired background music
- Detailed food photography
- Clear step transitions

### Example 5 Expected Response:
```json
{
  "message": "Content generation completed successfully",
  "result": {
    "jobId": "dev-345-678",
    "status": "completed",
    "outputDir": "data/output/integration/2025-01-30/dev-345-678",
    "content": {
      "llm": {
        "prompt": "How to make authentic Italian pasta carbonara",
        "title": "Perfect Pasta Carbonara: Italian Kitchen Secrets",
        "description": "Learn the authentic way to prepare pasta carbonara, straight from an Italian kitchen.",
        "hashtags": "#ItalianFood #Carbonara #CookingTutorial #Pasta #FoodLovers",
        "scenes": [
          {
            "description": "Fresh ingredients laid out on a rustic wooden table: pasta, eggs, pecorino cheese, guanciale, and black pepper.",
            "visual_prompt": "Overhead shot of traditional carbonara ingredients beautifully arranged on a rustic wooden surface with soft, natural lighting; --ar 16:9",
            "video_prompt": "Camera slowly moves across the ingredients, focusing on each component's quality and texture",
            "camera_movement": "Slow Pan",
            "visual_metadata": {
              "aspectRatio": "16:9"
            }
          }
        ],
        "music": {
          "title": "Italian Kitchen",
          "prompt": "Traditional Italian acoustic guitar with a warm, homey feeling",
          "style": "Traditional Italian Acoustic"
        }
      }
    }
  }
}
```

## Notes on Response Structure

The API response includes:
1. Generated content for each scene
2. Public URLs for all media files
3. Metadata about generation process
4. Scene-specific information including:
   - Voice audio files
   - Generated images
   - Animated/video content
   - Background music
5. Overall content summary including:
   - Title
   - Description
   - Hashtags
   - Scene descriptions
   - Camera movements
   - Music details

## Important Considerations

1. **Aspect Ratio Consistency**: Ensure `image.aspectRatio` and `videoGenParams.aspectRatio` match for proper rendering
2. **Service Configuration**: Use `serviceConfig` flags to skip specific generation steps if needed
3. **Voice Selection**: Valid `elevenlabsVoiceId` is required unless voice generation is skipped
4. **Scene Amount**: Should match the content length and complexity of the topic
5. **Visualization Type**: Choose between "video" or "animation" based on content needs 