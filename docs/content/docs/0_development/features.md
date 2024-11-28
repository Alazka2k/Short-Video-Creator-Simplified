## Current features in development:

### Frontend:
- Landing page with explanation of service, pricing and features (orientation of direct competitor invideo.ai / vidiq.com / crayo.com)
- Login Page with Social Login and Email/Password Login / Registration
- Features of the service (as mouseover on the features with links to the corresponding features)
- Pricing Page
- FAQ Page
- Use Cases Page

### Frontend process of creation:

#### Firt Input and Creation process (this interface should be as easy as possible with the possibilit to open an "advanced mode" with more options):
- The user shall be able to input a prompt for the video
- The user has different options apart of the prompt:
- Select option for the scenes, length of the video, general additional (e.g. Focus on positive and negative impacts)
- (Advanced mode) Select option for the style of the script
- Select option for the voiceover (here we need to offer different voices as examples)
- Image options: Select option for aspect ration with hint for what is the best option for short videos and for long videos
- (Advanced mode) Image options: Shot Style (e.g. cinematic, photorealistic, black and white, etc.), Style (standard or raw), Stylize (Value between 0 and 1000; default is 100)
- Select option for animation of scenes: Yes / No, if yes select option for animation type of scenes: AI Video / 3D Effect Animation of Image 
- [Currently music service is out of scope, but preparation for it:] Yes / No option for background music, if yes, Yes / No option for instrumental

#### Step 2: User Interface after input (and creation of the scenes):
- Show the user the scenes with the output data of the scenes (description column of llm_scenes), the images, the video file if created, the voiceover and the background music
- The user shall be able recreate each content of the scene (image (and video if selected), voiceover)
- The user shall be able to recreated the backround music
- [Currently finalization of video service is out of scope, but preparation for it:] Button for generation of the final video

#### User Interface after generation of the final video:

- Button for download of the final video
- Button for generation of another video

#### Workspace / Library
- The user shall be able to see all his videos and settings / input data of the videos. 

### Backend:

#### Integration of Final Video Generation:
- Integration of JSON2Video API for completevideo generation. Currently only all pieces are created by the integration service in there corresponding folders.

#### Authentication and Authorization:
- The user shall be able to login and logout with social media accounts (Google and Apple)
- The user shall be able to register an account with email and password
- The user shall have a dashboard to see all his videos and settings

#### Credit, Premium and Billing System:
- The user shall be able to buy credits in packages
- The user shall be able to see his credit balance and transaction history
- The user shall be able to update his billing information  

#### Differentation of premium and free features:

##### Free Features:
- Free users will have a watermark in the video
- Free users will have a time limit of 30 seconds for the video
- Free users will have a limit of 3 videos per day  

##### Premium Features:
- The user shall have the possibility to repeat the creation of any part of the scene of the video (complete Step 2 of the creation process is premium)
- If the user is satisfied with the result, he can download the video and use it as he wants
- The user shall have the possibility to download the 

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