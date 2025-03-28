/**
 * Transaction Routes
 * 
 * Defines routes for transaction-related endpoints:
 * - GET /transactions/user/:userId - Get user's token transactions
 * - GET /transactions/token-costs - Get token costs for services
 * - POST /transactions/calculate-job-cost - Calculate job token cost
 */

const express = require('express');
const router = express.Router();

module.exports = (transactionController) => {
  /**
   * @route GET /api/subscription/transactions/user/:userId
   * @description Get user's token transactions
   * @access Private
   */
  router.get('/user/:userId', transactionController.getUserTokenTransactions.bind(transactionController));
  
  /**
   * @route GET /api/subscription/transactions/token-costs
   * @description Get token costs for services
   * @access Public
   */
  router.get('/token-costs', transactionController.getTokenCosts.bind(transactionController));

  /**
   * @route POST /api/subscription/transactions/calculate-job-cost
   * @description Calculate token cost for a job
   * @access Private
   */
  router.post('/calculate-job-cost', transactionController.calculateJobTokenCost.bind(transactionController));

  return router;
}; 