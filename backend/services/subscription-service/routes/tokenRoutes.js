/**
 * Token Routes
 * 
 * Defines routes for token-related endpoints:
 * - GET /tokens/balance/:userId - Get user's token balance
 * - POST /tokens/allocate - Allocate tokens to a user (admin only, for bonuses, promotions, etc.)
 * - POST /tokens/usage - Record token usage (deduct tokens)
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
   * @route POST /api/subscription/tokens/allocate
   * @description Allocate tokens to a user (admin only, for bonuses, promotions, etc.)
   * @access Private (admin only)
   */
  router.post('/allocate', tokenController.allocateTokens.bind(tokenController));

  /**
   * @route POST /api/subscription/tokens/usage
   * @description Record token usage (deduct tokens) for content generation, assemblies, or recreation
   * @access Private
   */
  router.post('/usage', tokenController.recordTokenUsage.bind(tokenController));

  return router;
}; 