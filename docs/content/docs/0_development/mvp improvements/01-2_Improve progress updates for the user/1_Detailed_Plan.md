# Detailed Plan: Improve progress updates for the user

## 1. Overview

This document outlines the improvements of improvements we need to do for the progress updates for the user.

**The Core Improvement:** Improve the progress updates for the user.

**The Solution:** We need to improve the progress updates for the user.

---

## 2. Success Criteria

## Phase 1: Refactor the progress tracker and add a progress simulation **STATUS: Not Started**
- **Service:** Implement Progress Simulation (Your Suggestion) and the visual progress for the frontend.
- **Goal:** Provide realistic, simulated progress updates for all services (llm, voice, music, image, video / animation) for the user, so that the user can see the progress of the job.
- **Action 1 (Create a Central Utility):** Create a new, reusable utility file at backend/services/job-service/utils/progress-simulator.js. This class will manage the logic for sending periodic progress updates for any in job in progress.
- **Action 2 (Integrate the Simulator):**
  - First, update the music-processor.js to use this new centralized simulator, cleaning up the existing code.
  - Then, in scene-processor.js, when an scene content generation request is successfully sent, start a progress simulation. The simulation needs to be different for each content type since each content type has a different time of creation. When a scene type content is completed and reported to the job service, the progress simulation for this part of the job is completed and the total progress needs to be updated (and shown continously to the user). The report of a completed scene content can be earlier then in the simulation. If different content pieces are generated asynchronously (e.g. music, voice, image with or without video), the total progress simulation needs to be updated accordingly.
- **Action 3 (Ensure Accuracy):** 
  - The simulation for each step will be automatically stopped and set to 100% as soon as the actual completion or failure message is received from the corresponding service, ensuring the final status is always accurate.

### Task 1.1: Create Central Progress Simulator and integrate it in the progress tracker
- **Service:** `job-service utils`
- **File:** `backend/services/job-service/utils/progress-simulator.js` and `backend/services/job-service/utils/progress-tracker.js`
- **Action:** Develop a new, reusable utility file at backend/services/job-service/utils/progress-simulator.js. The empty file is already created. This class will manage the logic for sending periodic progress updates for any in job in progress. The progress tracker will be updated to use the progress simulator.

### Task 1.2: Review and integrate the Simulator 
- **Service:** `job-service`
- **File:** `backend/services/job-service/job-pipeline-service.js` and `backend/services/job-service/scene-processor.js` and `backend/services/job-service/music-processor.js`
- **Action:** Update the job pipeline service and processors to use the progress simulator (if needed).
- **Details:**
    - The progress simulator in combination with the progress tracker will be used to send periodic progress updates for any in job in progress.

### Task 1.3: Update the database persistance logic of the progress. 
- **Service:** `job-service`
- **File:** `backend/services/job-service/data/jobDataAccess.js`
- **Action:** The database entry of a job does not need to be updated with each progress simulation. Important is the status (and the update of the status) not the progress. The progress can be in memory only for the frontend.
- **Details:**

### Task 1.4: Review and update the frontend hooks and components to show the progress (simulation) for the user.
- **Service:** `frontend`
- **File:** `frontend\src\lib\hooks\useWorkbench.ts` and `frontend\src\lib\hooks\useJobDetails.ts` and `frontend\src\components\workbench\sections\JobCard.tsx` and `frontend\src\components\job-details\sections\JobStatusView.tsx`
- **Action:** Update the frontend hooks and components to show the progress (simulation) for the user.
- **Details:**
    - The progress simulation will be shown in the frontend.
    - The progress simulation will be updated continuously to the user.