# Progress Tracker

The Progress Tracker is a utility that manages and calculates progress for job processing in the video creation system. It provides accurate progress updates based on the completion status of various services and their relative weights in the overall job.

//TODO: Progress tracker working for voice and image generation. Needs to be tested for music, video and animation generation. 

## Progress Calculation System

The progress calculation system uses a weighted approach to determine the overall job progress. The weights are dynamically calculated based on the enabled services and the number of scenes.

### Base Weights

- **LLM Service**: 5-10% of total progress
  - 5% when music is enabled
  - 10% when music is disabled
- **Music Service**: 10% of total progress (when enabled)

### Scene Service Weights

The remaining weight (90% or 85% depending on music) is distributed among scene services based on the enabled services:

#### Voice + Image (1 scene)
- Voice: 35% per scene
- Image: 65% per scene

#### Voice + Image + Music (1 scene)
- Voice: 25% per scene
- Image: 55% per scene
- Music: 10% (global)

#### Voice + Image (X scenes)
- Voice: 30%/X per scene
- Image: 60%/X per scene

#### Voice + Image + Music (X scenes)
- Voice: 25%/X per scene
- Image: 55%/X per scene
- Music: 10% (global)

#### Voice + Image + Animation (X scenes)
- Voice: 10%/X per scene
- Image: 25%/X per scene
- Animation: 55%/X per scene

#### Voice + Image + Animation + Music (X scenes)
- Voice: 5%/X per scene
- Image: 15%/X per scene
- Animation: 55%/X per scene
- Music: 10% (global)

#### Voice + Image + Video (X scenes)
- Voice: 10%/X per scene
- Image: 15%/X per scene
- Video: 65%/X per scene

#### Voice + Image + Video + Music (X scenes)
- Voice: 5%/X per scene
- Image: 15%/X per scene
- Video: 65%/X per scene
- Music: 10% (global)

### Progress Calculation Process

1. The system identifies enabled services and scene count
2. Weights are calculated based on the service configuration
3. Progress is tracked for each service:
   - Global services (LLM, Music) contribute their full weight
   - Scene services (Voice, Image, Video/Animation) contribute their weight divided by scene count
4. The overall progress is calculated as the weighted sum of all service progress values

### Example Calculations

For a job with 2 scenes, voice, image, and music enabled:
- LLM: 5%
- Music: 10%
- Voice: 25%/2 = 12.5% per scene
- Image: 55%/2 = 27.5% per scene

Total weights: 5% + 10% + (12.5% × 2) + (27.5% × 2) = 100%

## Implementation Details

The progress tracker uses a singleton pattern to maintain progress data for all active jobs. It provides methods for:

- Initializing job progress
- Updating service progress
- Updating scene progress
- Recalculating overall progress
- Managing job status

Progress updates are logged when significant changes occur or when the job status changes.
