# Detailed Plan: Token Deduction and Plan Limitations

## 1. Overview

This document outlines the plan for the token reduction and plan limitations for the MVP.

**The Core Requirement:** 
- The token reduction needs to be implemented for the MVP. We need to implement inside of each job the token deduction logic depending on the selected requested content to be generated.
- The plan limitations shall be implemented for the MVP. Plan limitations depend on the selected plan.

**The Solution:** 
- The token deduction logic shall be implemented inside of each job.
- The plan limitations shall be implemented inside of each job.

---

## 2. Success Criteria

## Phase 1: Business Logic Finalization (Post-Stripe E2E) **STATUS: Not Started**
**Objective:** Implement the token deduction and plan limitation logic now that the core subscription flow is complete.

### Task 1.1: Integrate and test Token Deduction
- **Action:** Modify the `job-service` processors (`scene-processor`, `music-processor`, etc.) to call the existing `POST /api/subscription/tokens/usage` endpoint *before* executing a token-consuming task. The job will fail gracefully if the user has an insufficient balance.

#### Task 1.1.1: Review the current logic and implementation of the token deduction and the logic for the different services
- **Action:** Review the current classes of the token deduction and the logic for the different services.

#### Task 1.1.2: Implement token usage calculation for each job to show the user the cost of the job before execution in real time. Let a job fail (validation) if the user has an insufficient balance and tries to execute. Disable the button and show a message to the user if the user has an insufficient balance.

### Task 1.2: Enforce Plan Limitations
- **Action:** Before starting a job, the `job-pipeline-service` will call a new endpoint (e.g., `GET /api/subscription/limitations/usage` as described in your docs) to check usage against plan limits (e.g., `max_jobs_per_month` and `max_scenes_per_job` and `allowed_content_types`). The job will be rejected if limits are exceeded or the content type is is not included in the tier.

### Task 1.3: Enfore Frontend Plan Limitations
- **Action:** In the frontend the user can select different script settings, visual selection styles, voice styles and templates for the assembly. The frontend shall only render the options that are allowed for the current plan. The options are defined in visual_selection_count, voice_selection_count, template_selection_count and script_settings_count. In different json configuration files there are properties added to the json files for each option (e.g. template-select-option.json with property planId). Higher plans always include the lower plans ids.

### Task 1.4: Add watermark for free tier users
- **Action:** As defined in has_watermark different plans have watermark setting enabled or disabled. Depending on that a new backend service needs to add a watermark to the created content pieces (images).