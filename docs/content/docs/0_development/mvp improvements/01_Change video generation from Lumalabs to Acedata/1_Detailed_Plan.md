# Detailed Plan: Refactoring Asynchronous Visualization Logic

## 1. Overview

This document outlines the architectural refactoring required to solve the change of the video generation service. The current implementation uses Lumalabs Dreammachine, but AceData Cloud offers a API to Midjourney which has a better video generation quality for image to video.

**The Core Improvement:** We use Midjourneys Video Generation through AceData Cloud API to have a better video generation quality for image to video.

**The Solution:** Change the implementation of the video generation service.

---

## 2. Success Criteria

## Phase 1: Establish `job-service` as the Central Hub **STATUS: ✅ Finished**

This phase creates the foundation for data stitching.

### Task 1.1: Create New Internal API Endpoint
- **Service:** `job-service`
- **File:** `backend/services/job-service/server.js`
- **Action:** Create a new, **internal-only** endpoint. This endpoint will **not** be exposed via the API Gateway.
  - **Endpoint:** `POST /internal/job/:jobId/scene/:sceneId/result`
  - **Purpose:** To securely receive completed data chunks from downstream services.

### Task 1.2: Implement Data Stitching Logic
- **Service:** `job-service`
- **File:** `backend/services/job-service/data/jobDataAccess.js` (or a new service layer file).
- **Action:** Create a new method, `addResultToScene(jobId, sceneId, serviceName, resultData)`.
  - **Logic:**
    1.  Atomically fetch the job from the database using the `jobId`.
    2.  Find the specific scene in the `metadata.scenes` array via `sceneId`.
    3.  Dynamically add the result. For example: `scene[serviceName] = resultData;`, where `serviceName` is `"image"`, `"video"`, or `"animation"`. This ensures consistent handling.
    4.  Save the entire, updated job object back to the database.
    5.  This method must be robust against race conditions if possible (e.g., using transactions).

---

## Phase 2: Refactor `image-service` to Orchestrate Visualization **STATUS: ✅ Finished**

The `image-service` becomes the primary trigger for the rest of the visual pipeline.

### Task 2.1: Report Image Completion
- **Service:** `image-service`
- **File:** `backend/services/image-service/image-gen-service.js`
- **Action:** In the `handleWebhook` method, after an image has been successfully processed and uploaded to S3:
  - It must call the new `job-service` endpoint: `POST /internal/job/:jobId/scene/:sceneId/result`.
  - The payload will be: `{ "service": "image", "data": { ...finalImageResult } }`.

### Task 2.2: Implement Visualization Orchestration
- **Service:** `image-service`
- **File:** `backend/services/image-service/image-gen-service.js`
- **Action:** The `handleWebhook` method's responsibility is expanded.
  1.  The initial request from `scene-processor` **must** include the `visualizationType` and all `videoGenParams` and `animationGenParams`. These must be stored in the `pendingJobs` map.
  2.  After reporting its own completion (Task 2.1), the webhook handler will inspect the stored job data.
  3.  **If `visualizationType` is `"video"`:** It will make a non-blocking "fire-and-forget" call to `video-service` (`POST /generate`), passing the public URL of the newly created image and the relevant `videoGenParams`.
  4.  **If `visualizationType` is `"animation"`:** It will make a non-blocking call to `animation-service` (`POST /process`), passing the image URL and `animationGenParams`.

---

## Phase 3: Update Visualization Services to be Independent Workers **STATUS: ✅ Finished**

Both `video-service` and `animation-service` now operate as fully independent, asynchronous workers.

### Task 3.1: Refactor `video-service`
- **Service:** `video-service`
- **File:** `backend/services/video-service/video-gen-service.js`
- **Action:**
  - The main processing method (`pollForCompletion` or equivalent) will run independently after being triggered by the `image-service`.
  - When video generation is 100% complete and the asset is on S3, it will call the `job-service` endpoint: `POST /internal/job/:jobId/scene/:sceneId/result`.
  - The payload will be: `{ "service": "video", "data": { ...finalVideoResult } }`.

### Task 3.2: Refactor `animation-service`
- **Service:** `animation-service`
- **File:** `backend/services/animation-service/animation-gen-service.js`
- **Action:**
  - Same as the video service. Upon completion, it calls the `job-service` endpoint: `POST /internal/job/:jobId/scene/:sceneId/result`.
  - The payload will be: `{ "service": "animation", "data": { ...finalAnimationResult } }`.

---

## Phase 4: Refactor the data persistance of progress in the job metadata **STATUS: ✅ Finished**
- **Service:** Implement the job data metadata progress storage consistently in comparison to the job service temporary memory.
- **Goal:** Consistency in the progress storage and retrieval.
- **Action 1 (Write documentation):** Write a new documentation file at docs/content/docs/0_development/mvp plan/08_Refactoring_visualization-creation-logic/2_Progress_Tracking.md that explains the new progress tracking logic.
- **Action 2 (Adapt the job data access):** Adapt the job data access to use the new progress tracking data structure.

## Phase 5: Testing and Validation **STATUS: In Progress**

- **Test Case 1 (Video):** Run a one-scene job with `visualizationType: "video"`.
  - **Verify:** The job completes. The final database record for the scene contains a valid `image` object **and** a valid `video` object. The progress is persisted in the job metadata as long as the job is not completed.
- **Test Case 2 (Video):** Run a multi-scene job with `visualizationType: "video"`.
  - **Verify:** The job completes. The final database record for each scene contains a valid `image` object **and** a valid `video` object. The progress of each scene is persisted in the job metadata as long as the job is not completed.
- **Test Case 3 (Animation):** Run a one-scene job with `visualizationType: "animation"`.
  - **Verify:** The job completes. The final database record for the scene contains a valid `image` object **and** a valid `animation` object. The progress is persisted in the job metadata as long as the job is not completed.
- **Test Case 4 (Animation):** Run a multi-scene job with `visualizationType: "animation"`.
  - **Verify:** The job completes. The final database record for each scene contains a valid `image` object **and** a valid `animation` object. The progress of each scene is persisted in the job metadata as long as the job is not completed.
- **Test Case 5 (High Concurrency):** Run multiple jobs from different users simultaneously.
  - **Verify:** All jobs complete successfully without data from one leaking into another. The data structures remain correct for all jobs.
- **Test Case 6 (Failure):** Manually simulate a failure in the `video-service`.
  - **Verify:** The `video-service` reports a "failed" status to the `job-service`. The final job record correctly shows the image as `completed` but the video as `failed`, and the overall job status is `failed`.

## Phase 5: Refactor the progress tracker and add a progress simulation **STATUS: Not Started**
- **Service:** Implement Progress Simulation (Your Suggestion)
    This will solve the "0% progress" problem for long-running tasks.
- **Goal:** Provide realistic, simulated progress updates for image and video generation.
- **Action 1 (Create a Central Utility):** Create a new, reusable utility file at backend/services/job-service/utils/progress-simulator.js. This class will manage the logic for sending periodic progress updates for any long-running task.
- **Action 2 (Integrate the Simulator):**
  - First, update the music-processor.js to use this new centralized simulator, cleaning up the existing code.
  - Then, in scene-processor.js, when an image generation request is successfully sent, start a progress simulation for the image step of that scene.
  - Finally, once the image-service reports back to the job-service that the image is done, the job-service will automatically start a new progress simulation for the video step.
- **Action 3 (Ensure Accuracy):** 
  - The simulation for each step will be automatically stopped and set to 100% as soon as the actual completion or failure message is received from the corresponding service, ensuring the final status is always accurate.