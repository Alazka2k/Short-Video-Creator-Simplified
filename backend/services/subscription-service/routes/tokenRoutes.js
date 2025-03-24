/**
 * Token Routes
 * 
 * Defines routes for token-related endpoints:
 * - GET /tokens/balance/:userId - Get user's token balance
 * - GET /tokens/transactions/:userId - Get user's token transactions
 * - POST /tokens/allocate - Allocate tokens to a user
 * - POST /tokens/allocate/subscription - Allocate subscription tokens
 * - POST /tokens/usage - Record token usage
 * - GET /tokens/costs - Get token costs
 * - POST /tokens/calculate-cost - Calculate job token cost
 */

const express = require('express');
const router = express.Router();

module.exports = (tokenController) => {
  /**
   * @route GET /api/subscription/tokens/balance/:userId
   * @description Get user's token balance
   * @access Private
   */
  router.get('/balance/:userId', tokenController.getUserTokenBalance.bind(tokenController));

  /**
   * @route GET /api/subscription/tokens/transactions/:userId
   * @description Get user's token transactions
   * @access Private
   */
  router.get('/transactions/:userId', tokenController.getUserTokenTransactions.bind(tokenController));

  /**
   * @route POST /api/subscription/tokens/allocate
   * @description Allocate tokens to a user
   * @access Private (admin only)
   */
  router.post('/allocate', tokenController.allocateTokens.bind(tokenController));

  /**
   * @route POST /api/subscription/tokens/allocate/subscription
   * @description Allocate subscription tokens
   * @access Private (admin only)
   */
  router.post('/allocate/subscription', tokenController.allocateSubscriptionTokens.bind(tokenController));

  /**
   * @route POST /api/subscription/tokens/usage
   * @description Record token usage
   * @access Private
   */
  router.post('/usage', tokenController.recordTokenUsage.bind(tokenController));

  /**
   * @route GET /api/subscription/tokens/costs
   * @description Get token costs for services
   * @access Public
   */
  router.get('/costs', tokenController.getTokenCosts.bind(tokenController));

  /**
   * @route POST /api/subscription/tokens/calculate-cost
   * @description Calculate token cost for a job
   * @access Private
   */
  router.post('/calculate-cost', tokenController.calculateJobTokenCost.bind(tokenController));

  return router;
}; 