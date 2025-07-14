# Detailed Refactoring Plan: Image Service Migration to AceData API

## Overview

This document provides a concrete, step-by-step guide for refactoring the application's `image-service`. The goal is to migrate from the current brittle, Puppeteer-based scraping solution to a robust and reliable integration with the **AceData Midjourney API**. This will resolve critical timeout issues, improve performance, and make the service significantly more maintainable.

---

## Phase 1: Backend Refactoring (Image Service) **STATUS: Started**

This phase focuses on overhauling the core logic within the `image-service` to communicate with the new external API instead of scraping Midjourney directly.

**1. Update Environment Configuration and add it to Config** **STATUS: ✅ Finished**
   - **Purpose:** Add the necessary API token for authenticating with the AceData service and add it to the config for loading it.
   - **File to Modify:** 
      `.env.example` (and your local `.env.development` file)
      `backend\shared\utils\config.js`
   - **Action:** Add the following new variable to env file:
     ```
     ACEDATA__MIDJOURNEY_API_TOKEN=your_acedata_midjourney_api_token_here
     ``` and load it in the config file

**2. Refactor the Midjourney Client** **STATUS: ✅ Finished**
   - **File to Refactor:** `backend/services/image-service/clients/midjourney-client.js`
   - **Purpose:** This is the central part of the refactor. This file will be entirely rewritten to handle all communication with the AceData API.
   - **Actions:**
     - Remove the `midjourney-npm` dependency.
     - Use `axios` to make `POST` requests to the AceData endpoint (`https://api.acedata.cloud/midjourney/imagine`).
     - Re-implement the `generateImage` method to construct the request body based on the AceData API documentation (passing `prompt`, `action`, `image_id`, etc.).
     - The method must correctly handle the API response, extracting the `image_id`, `image_url`, and `actions` for the calling service.
     - Implement logic to pass the `onProgress` callback via the AceData streaming functionality (`accept: 'application/x-ndjson'`). This will allow for real-time progress updates.

**3. Replace the Image Downloader Utility** **STATUS: ✅ Finished**
   - **File to Refactor:** `backend/services/image-service/utils/image-downloader.js`
   - **Purpose:** The current Puppeteer-based downloader is the source of the timeouts and will be completely replaced.
   - **Actions:**
     - Remove all Puppeteer-related code and dependencies.
     - Create a new, simple `downloadImage` function.
     - This function will use `axios` with `responseType: 'stream'` to fetch the image URL provided by the AceData API.
     - It will then pipe the stream into a local file using `fs.createWriteStream`.
     - Implement robust error handling and a reasonable timeout for the download request itself.

**4. Update the Image Generation Service** **STATUS: ✅ Finished**
   - **File to Refactor:** `backend/services/image-service/image-gen-service.js`
   - **Purpose:** This service orchestrates the client and the downloader. Its logic needs to be updated to align with the new workflow.
   - **Actions:**
     - Modify the `generateImage` method to correctly call the newly refactored `midjourney-client.js`.
     - After the client returns a final `image_url` (progress is 100%), the service must call the new `downloadImage` utility to save the image.
     - The final result returned by the service (including the local file path, metadata, etc.) should remain consistent with the existing data structure to minimize impact on dependent services.

**5. Review depending classes and side effects** **STATUS: ✅ Finished**
- Purpose: Review the classes that depend on the image service and the side effects of the refactoring.
- **File to Review:** 
      `backend/services/image-service/server.js` -> Updated
      `backend/services/image-service/index.js` -> No changes needed
      `backend/api-gateway/routes/image.js` -> No changes needed
      `backend/services/job-service/utils/progress-tracker.js` -> No changes needed
      `backend/services/job-service/processors/scene-processor.js` -> No changes needed
      `backend\shared\utils\image-helper.js` -> No changes needed

**6. Smoke Testing Image Service**  **STATUS: In progress**
- **Purpose:** Test the image service to ensure it is working as expected.
- **Actions:**
    - Test the image service directly / Test the image service with gateway **STATUS: ✅ Finished**
    -> Progress tracking is not working, but the image is generated. Progress fix in 6.1. Progress tracking can only be tested with job execution and then calling endpoint to get the progress http://localhost:3000/api/job/jobs/[jobId]/progress.
    - Test the image service with a job execution **STATUS: In progress**
      **Findings:**:
      1. The Job is Genuinely Stuck: The job isn't completing and then having its progress tracker erased. It's truly getting stuck mid-process. The images are not being generated, and the progress is not advancing beyond the initial "in_progress" state set by the scene-processor.
      2. No image-service Logs for the Job: This is the most telling clue. If the job-service is trying to generate images, but the image-service shows no logs of receiving the requests, it points to a communication breakdown or a logical error before the API call is made.
      3. Cross-Job/User Contamination: The log showing a request for a different jobId and userId is extremely concerning. It suggests a potential state management issue where data from one request might be leaking into another. This is a serious problem.
   
**6.1 Test the image service with image (http://localhost:3000/api/image/generate) and job (http://localhost:3000/api/job/generate) execution**
- **Purpose:** Collect all open issues, define them and fix them.
- **Actions:** 
    - Fix the progress tracking with a full asynchronous webhook-to-callback flow. **STATUS: ✅ Finished**
      1. Modify Config: Add IMAGE_SERVICE_WEBHOOK_BASE_URL to config.js. 
      2. Enforce jobId: Make jobId mandatory in api-gateway/routes/image.js and image-gen-service.js.
      3. Create Job Service Progress Endpoint: Add a new internal route `POST /progress/update` to `job-service/server.js` to receive real-time progress updates.
      4. Create Webhook Endpoint in API Gateway: Add a route `POST /api/image/webhook/:jobId/:sceneId` to `api-gateway/routes/image.js` to receive callbacks and forward them.
      5. Create Webhook Endpoint in Image Service: Add the corresponding `POST /webhook/:jobId/:sceneId` route to `image-service/server.js`.
      6. Implement Async Logic in Image Service: Refactor `image-gen-service.js` to use a `Map` to store promises. The webhook handler will call the new `job-service` progress endpoint and resolve the promise on completion.
      7. Update Client: Modify `midjourney-client.js` to accept `sceneId` and construct the full `callback_url` including the `sceneId`.
   - Fix the image downloader **STATUS: ✅ Finished**
      1. Find alternative solutions for the image downloader, since CDN Midjourney is blocking the download.
      Alternatives are documented in docs\content\docs\0_development\mvp plan\07_Refactoring Image Service\4_New_Workflow_Documentation.md
      2. Implement the new workflow
         1. Install `sharp` and add it to the image-service
         2. Adapt `midjourney-client.js`
         2. Adapt `image-gen-service.js`
      3. Test the image service with new cropped images downloader
   - Fix the stuck / not working image generation for job execution **STATUS: ✅ Finished**


**7. Update Service Dependencies after testing**
    - **File to Modify:** `package.json` (in the project root)
    - **Purpose:** Clean up unused packages.
    - **Actions:**
        - Remove `puppeteer` and `midjourney-npm`.
        - Ensure `axios` is listed as a dependency.

---

## Phase 2: Testing & Validation **STATUS: Not Started**

**1. Direct API Testing (Postman):**
   - Call the `image-service`'s `/generate` endpoint directly.
   - **Test Case 1: Simple Generation.** Send a simple text prompt. Verify a 200 OK response, and check the server logs and file system to confirm the image was downloaded.
   - **Test Case 2: Failure.** Use an invalid API token in the `.env` file. Verify that the service returns a proper error (e.g., 401 or 500) with a clear error message in the logs.

**2. End-to-End Testing (Frontend):**
   - **Purpose:** Ensure the refactored service integrates correctly into the full application workflow.
   - **Actions:**
     - Start a new job creation process from the frontend UI.
     - Select a job type that requires image generation (e.g., "Short Story with Images").
     - Monitor the job's progress in the workbench.
     - **Verification:**
       - The job should *not* get stuck.
       - The job should complete successfully.
       - The final generated image should be visible in the job details page.
       - The image should be downloadable from the job details page.

**3. Test Scenarios to Cover:**
   - Single-scene image generation.
   - Multi-scene image generation (ensure scenes are processed sequentially or correctly in parallel without hanging).
   - Test the `upscale` and `variation` actions if they are exposed through the `job-service`.
   - Test how the system handles an error response from the AceData API (e.g., a banned prompt). The job should fail gracefully with a descriptive error message.

---

## Success Criteria

- The `puppeteer` and `midjourney-npm` dependencies are completely removed from the project.
- The `image-service` reliably generates and downloads images without timing out or hanging.
- End-to-end image generation jobs complete successfully.
- The service is now more maintainable, and its external API dependency is clear and well-documented.
- Error handling is robust, and failures from the external API result in a graceful failure of the job with clear logging. 