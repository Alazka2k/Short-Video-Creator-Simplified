/**
 * Plan Routes
 * 
 * Defines routes for plan-related endpoints:
 * - GET /plans - List all plans
 * - GET /plans/:planId - Get plan by ID
 */

const express = require('express');
const router = express.Router();

module.exports = (planController) => {
  /**
   * @route GET /api/subscription/plans
   * @description Get all plans or plans filtered by billing frequency
   * @access Public
   */
  router.get('/', planController.getPlans.bind(planController));

  /**
   * @route GET /api/subscription/plans/:planId
   * @description Get plan by ID
   * @access Public
   */
  router.get('/:planId', planController.getPlanById.bind(planController));

  return router;
}; 