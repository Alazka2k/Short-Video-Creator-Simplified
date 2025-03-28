/**
 * Token Controller
 * 
 * This controller handles HTTP requests for token-related endpoints:
 * - GET /tokens/balance/:userId - Get user's token balance
 * - POST /tokens/allocate - Allocate tokens to a user (admin only)
 * - POST /tokens/usage - Record token usage (deduct tokens)
 */

const logger = require('../../../shared/utils/logger');

class TokenController {
  constructor(tokenService) {
    this.tokenService = tokenService;
    logger.info('TokenController initialized');
  }

  /**
   * Get user's token balance
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getUserTokenBalance(req, res) {
    try {
      const { userId } = req.params;
      const balance = await this.tokenService.getUserTokenBalance(userId);
      res.json(balance);
    } catch (error) {
      logger.error('Error in getUserTokenBalance:', error);
      res.status(500).json({ error: 'Failed to get token balance', details: error.message });
    }
  }

  /**
   * Allocate tokens to a user (admin only)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async allocateTokens(req, res) {
    try {
      const { userId, tokenAmount, description, relatedEntityType, relatedEntityId, paymentId } = req.body;
      
      if (!userId || !tokenAmount) {
        return res.status(400).json({ error: 'User ID and token amount are required' });
      }
      
      if (tokenAmount <= 0) {
        return res.status(400).json({ error: 'Token amount must be a positive number' });
      }
      
      const transaction = await this.tokenService.allocateTokens(
        userId,
        tokenAmount,
        relatedEntityType || 'other',
        relatedEntityId,
        description,
        paymentId
      );
      
      res.json(transaction);
    } catch (error) {
      logger.error('Error in allocateTokens:', error);
      res.status(500).json({ error: 'Failed to allocate tokens', details: error.message });
    }
  }

  /**
   * Record token usage (deduct tokens)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async recordTokenUsage(req, res) {
    try {
      const { 
        userId, 
        tokenAmount, 
        jobId, 
        serviceName, 
        description, 
        metadata,
        relatedEntityType,
        relatedEntityId,
        externalServiceName
      } = req.body;
      
      if (!userId || !tokenAmount) {
        return res.status(400).json({ error: 'User ID and token amount are required' });
      }
      
      if (tokenAmount <= 0) {
        return res.status(400).json({ error: 'Token amount must be a positive number' });
      }
      
      // Check if user has active subscription before allowing token deduction
      const hasActiveSubscription = await this.tokenService.checkUserHasActiveSubscription(userId);
      if (!hasActiveSubscription) {
        return res.status(403).json({ 
          error: 'Forbidden', 
          message: 'User does not have an active subscription. Token deduction not allowed.'
        });
      }
      
      const transaction = await this.tokenService.recordTokenUsage(
        userId,
        jobId || (metadata && metadata.jobId),
        serviceName,
        tokenAmount,
        metadata || {},
        description,
        relatedEntityType,
        relatedEntityId,
        externalServiceName
      );
      
      res.json(transaction);
    } catch (error) {
      logger.error('Error in recordTokenUsage:', error);
      
      // Check for specific error types
      if (error.message && error.message.includes('Insufficient tokens')) {
        return res.status(402).json({ 
          error: 'Payment Required', 
          message: error.message
        });
      }
      
      res.status(500).json({ error: 'Failed to record token usage', details: error.message });
    }
  }
}

module.exports = TokenController; 