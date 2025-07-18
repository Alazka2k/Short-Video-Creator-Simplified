# Detailed Plan: Refactoring Asynchronous Visualization Logic

## 1. Overview

This document outlines the architectural refactoring required to solve critical bugs related to timeouts and data corruption in the visualization pipeline. The previous "fire-and-forget" fix for the image service stopped the timeouts but broke the data flow, resulting in incomplete records that are unacceptable for the frontend.

This plan details a robust, asynchronous solution that ensures data consistency, supports both **video** and **animation** generation, and allows for high-throughput, parallel processing of multiple scenes and jobs.

**The Core Problem:** Long-running tasks (image, video, animation) cannot be handled with simple request/response calls without causing timeouts or data loss.

**The Solution:** We will implement a "data stitching" pattern. The `job-service` will become the central source of truth. Asynchronous services will perform their work independently and then "stitch" their results back into the main job record by calling a new internal endpoint on the `job-service`.

---

## 2. Success Criteria

- **No Timeouts:** Jobs with many scenes or long visualization times complete without any service timing out.
- **Data Integrity:** The final job metadata in the database is **always complete and structurally consistent**, containing the full `image`, `video`, or `animation` objects as required by the frontend. The `undefined` key bug is permanently eradicated.
- **Full Asynchronicity:** Multiple jobs from multiple users can run in parallel without interfering with each other. Multiple scenes within a single job are processed asynchronously.
- **Support for All Visualization Types:** The system handles `visualizationType: "video"` and `visualizationType: "animation"` through a consistent and unified data flow.
- **Maintainability:** Service responsibilities are clear, making the system easier to debug and extend.

---

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

## Phase 5: Finalize Progress Tracking Persistence Logic **STATUS: ✅ Finished**
**Objective:** Implement a hybrid approach that uses the in-memory `ProgressTracker` for performance while consistently mirroring its state to the database. This ensures data persistence for the frontend, with a clean separation of concerns. The `progress` object will exist inside the job's `metadata` field during execution and will be removed upon successful completion.

#### Step 1: Refactor `jobDataAccess.js` **STATUS: ✅ Finished**
- **Action:** Modify `jobDataAccess.js` to serve as the single point of interaction with the database for progress updates.
- **Details:**
    - Create a new function: `updateJobProgress(jobId, progressData)`.
    - This function will take the complete `progressData` object from the in-memory tracker.
    - It will fetch the current job's metadata, embed the `progressData` into a `progress` key within the metadata, and save the entire updated metadata object back to the database.
    - It will also update the top-level `status` and `overall_progress` columns on the `jobs` table from the `progressData` object to ensure consistency.

#### Step 2: Implement Job Finalization Logic in `jobDataAccess.js` **STATUS: ✅ Finished**
- **Action:** Add a new function: `finalizeJob(jobId)`.
- **Details:**
    - When a job succeeds, this function will be called.
    - It will load the job's metadata, **delete** the `progress` key entirely, set the top-level `status` to `completed`, and save the cleaned metadata back. This ensures the final output is clean and matches the required structure for the frontend.

#### Step 3: Update Orchestration Services **STATUS: ✅ Finished**
- **Files:** `job-pipeline-service.js`, `scene-processor.js`.
- **Action:** Modify the services that manage the job lifecycle.
- **Details:**
    - After every call to a `progressTracker.update...` method, the service will immediately call the new `jobDataAccess.updateJobProgress` function, passing the `jobId` and the updated progress object to persist it.
    - The `job-pipeline-service` will be updated to call `jobDataAccess.finalizeJob(jobId)` at the very end of a successful job.

#### Step 4: End-to-End Alignment Review **STATUS: ✅ Finished**
- **Action:** Review all services that generate assets to ensure they follow the new, robust pattern.
- **Details:**
    - Specifically check the `music-processor` and any other relevant services to guarantee they update the in-memory tracker and then immediately persist the state to the database via `jobDataAccess`.

#### Step 5: Fix issue of data consistency for voice and music generation. **STATUS: ✅ Finished**
- **Action:** Fix the issue of data consistency for voice and music generation. They are missing in the job metadata.
- **Details:**
    - The results for synchronous services like `voice` and `music`, along with the initial `llmResult`, are not being correctly saved to the permanent job metadata structure.
    - They are either only stored in the temporary `progress` object within the metadata (which is deleted upon finalization) or lost entirely.
    - This leads to an incomplete final job record in the database, causing the frontend to receive missing data. The fix involves ensuring these results are written to a permanent location in the metadata before the job is finalized.

#### Step 6: Improve music generation error handling, voice metadata structure issue and scene completion logic. **STATUS: ✅ Finished**
- **Action:** Add robust error handling for music generation timeouts and fix the data structure for voice results.
- **Details:**
    - **Music Service:**
        - Implement a retry mechanism in the `music-processor` for network-related errors like timeouts (`ECONNABORTED`).
        - If a retry fails or for any other error, persist a final error object (`{ status: 'failed', error: '...' }`) to the `metadata.music` field.
        - Crucially, also update the top-level `error` and `error_type` columns on the `jobs` table to ensure critical failures are visible at a glance.
        - The frontend will be updated to display a consistent `ErrorCard` component (similar to the one in `JobStatusView`) when `metadata.music.status` is `'failed'`.
    - **Voice Service:**
        - Correct the data persistence call in `scene-processor.js` to prevent creating a nested `status` object within the `voice` metadata.
    - **Scene Completion:**
        - Enhance the `jobDataAccess.addResultToScene` method to intelligently check if a scene's components are all complete. If they are, it will add `status: 'completed'` and a `completedAt` timestamp to the root of that scene object in the `metadata.scenes` array.



## Continous Testing and Validation 
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