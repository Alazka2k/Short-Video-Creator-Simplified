/**
 * Token Controller
 * 
 * This controller handles HTTP requests for token-related endpoints:
 * - GET /tokens/balance/:userId - Get user's token balance
 * - GET /tokens/transactions/:userId - Get user's token transactions
 * - POST /tokens/allocate - Allocate tokens to a user
 * - POST /tokens/usage - Record token usage
 * - GET /tokens/costs - Get token costs
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
      const tokenBalance = await this.tokenService.getUserTokenBalance(userId);
      
      res.json(tokenBalance);
    } catch (error) {
      logger.error('Error fetching user token balance:', error);
      res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  }

  /**
   * Get user's token transactions
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getUserTokenTransactions(req, res) {
    try {
      const { userId } = req.params;
      const { limit = 100, offset = 0 } = req.query;
      
      const transactions = await this.tokenService.getUserTokenTransactions(
        userId, 
        parseInt(limit), 
        parseInt(offset)
      );
      
      res.json(transactions);
    } catch (error) {
      logger.error('Error fetching user token transactions:', error);
      res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  }

  /**
   * Allocate tokens to a user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async allocateTokens(req, res) {
    try {
      const { 
        userId, 
        tokenAmount, 
        relatedEntityType, 
        relatedEntityId, 
        description, 
        paymentId 
      } = req.body;
      
      if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
      }
      
      if (!tokenAmount || tokenAmount <= 0) {
        return res.status(400).json({ error: 'tokenAmount must be a positive number' });
      }
      
      const transaction = await this.tokenService.allocateTokens(
        userId,
        tokenAmount,
        relatedEntityType,
        relatedEntityId,
        description,
        paymentId
      );
      
      res.status(201).json({
        success: true,
        data: transaction
      });
    } catch (error) {
      logger.error('Error allocating tokens:', error);
      res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  }

  /**
   * Allocate subscription tokens to a user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async allocateSubscriptionTokens(req, res) {
    try {
      const { userId, subscriptionId, tokenAmount, description } = req.body;
      
      if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
      }
      
      if (!subscriptionId) {
        return res.status(400).json({ error: 'subscriptionId is required' });
      }
      
      if (!tokenAmount || tokenAmount <= 0) {
        return res.status(400).json({ error: 'tokenAmount must be a positive number' });
      }
      
      const transaction = await this.tokenService.allocateSubscriptionTokens(
        userId,
        subscriptionId,
        tokenAmount,
        description
      );
      
      res.status(201).json({
        success: true,
        data: transaction
      });
    } catch (error) {
      logger.error('Error allocating subscription tokens:', error);
      res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  }

  /**
   * Record token usage
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async recordTokenUsage(req, res) {
    try {
      const { 
        userId, 
        jobId, 
        serviceName, 
        tokenAmount, 
        metadata, 
        description,
        relatedEntityType,
        relatedEntityId,
        externalServiceName
      } = req.body;
      
      if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
      }
      
      if (!jobId) {
        return res.status(400).json({ error: 'jobId is required' });
      }
      
      if (!serviceName) {
        return res.status(400).json({ error: 'serviceName is required' });
      }
      
      if (!tokenAmount || tokenAmount <= 0) {
        return res.status(400).json({ error: 'tokenAmount must be a positive number' });
      }
      
      const transaction = await this.tokenService.recordTokenUsage(
        userId,
        jobId,
        serviceName,
        tokenAmount,
        metadata,
        description,
        relatedEntityType,
        relatedEntityId,
        externalServiceName
      );
      
      res.status(201).json({
        success: true,
        data: transaction
      });
    } catch (error) {
      logger.error('Error recording token usage:', error);
      res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  }

  /**
   * Get token costs
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getTokenCosts(req, res) {
    try {
      const { service } = req.query;
      
      if (service) {
        const cost = this.tokenService.getServiceTokenCost(service);
        return res.json({ service, cost });
      }
      
      const costs = this.tokenService.getAllTokenCosts();
      res.json(costs);
    } catch (error) {
      logger.error('Error getting token costs:', error);
      res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  }

  /**
   * Calculate job token cost
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async calculateJobTokenCost(req, res) {
    try {
      const jobData = req.body;
      
      if (!jobData) {
        return res.status(400).json({ error: 'Job data is required' });
      }
      
      const costBreakdown = this.tokenService.calculateJobTokenCost(jobData);
      
      res.json(costBreakdown);
    } catch (error) {
      logger.error('Error calculating job token cost:', error);
      res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  }
}

module.exports = TokenController; 