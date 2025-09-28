# Detailed Plan: Token Deduction and Plan Limitations

## 1. Overview

This document outlines the plan for the deployment of the MVP.

**The Core Requirement:**
- Fix all bugs and issues that are not related to the subscription flow.
- The MVP needs to be deployed to the production environment.

**The Solution:** 
- Fix all bugs and issues that are not related to the subscription flow.
- The MVP needs to be deployed to the production environment.

---

## 2. Success Criteria


## Phase 1: Fixes and Fine Tuning
### Task 1.1: Review and finalize all protected pages. **STATUS: Not Started**
- **Action:** Review and finalize all protected pages. Go over each page and make sure everything is finalized. Fine tune the look and feel so it is consistent.

- **Sub-Task 1.1.1: Review video assembly page.** **STATUS: Not Started**
  - **Action:** Fix Bug: Download button is not working on the video assembly page. Deactivate direct share buttons for social media for now. Adapt "My Videos" to the "Content workbench" text style.

- **Sub-Task 1.1.2: Modal for "View Full History" in the Usage History card is missing** **STATUS: Not Started**
  - **Action:** Add a modal for "View Full History" in the Usage History card. The modal should display the full transaction history of tokens. The endpoint is already available.

- **Sub-Task 1.1.3: Fix the button "Manage Plan" in the Plan & Usage card.** **STATUS: Not Started**
  - **Action:** Show the "Manage Plan" button in the Plan & Usage card not when the user already is on the Subscription page to manage the plan. Still show it on other pages like dashboard.

- **Sub-Task 1.1.4: Make all pages and components mobile responsive.** **STATUS: Not Started**
  - **Action:** Make all pages and components mobile responsive.

## Phase 2: Final Testing & Deployment **STATUS: Not Started**
**Objective:** Ensure the entire system is robust, secure, and ready for production.

### Task 2.1: Comprehensive E2E Testing
- **Action:** Perform end-to-end testing of all user flows in a staging environment connected to Stripe's test mode.

### Task 2.2: Production Deployment
- **Action:** Execute the production deployment, ensuring all environment variables, API keys, and webhook endpoints are correctly configured for the live environment.

### Task 2.3: Monitoring & Alerting
- **Action:** Set up monitoring and alerts for key metrics like webhook success rates and payment failures.

#### **Phase 3: Styling & Layout Alignment** *(Lower Priority)*
**Goal:** Make subscription page visually consistent with dashboard (addressed after functionality is complete).

### Task 3.1: Update Container Structure and Background
  - **Action:** Align visual styling with dashboard page structure and apply consistent backgrounds.

### Task 3.2: Add Consistent Header with Icon Pattern
  - **Action:** Add header icon and styling consistent with dashboard sections.

### Task 3.3: Ensure Responsive Behavior and Mobile Design
  - **Action:** Optimize responsive design and mobile experience.
