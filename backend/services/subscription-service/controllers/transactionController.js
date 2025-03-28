/**
 * Transaction Controller
 * 
 * This controller handles HTTP requests for transaction-related endpoints:
 * - GET /transactions/user/:userId - Get user's token transactions
 * - GET /transactions/token-costs - Get token costs
 * - POST /transactions/calculate-job-cost - Calculate job token cost
 */

const logger = require('../../../shared/utils/logger');

class TransactionController {
  constructor(transactionService) {
    this.transactionService = transactionService;
    logger.info('TransactionController initialized');
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
      
      const transactions = await this.transactionService.getUserTokenTransactions(
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
   * Get token costs
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getTokenCosts(req, res) {
    try {
      const { service } = req.query;
      
      if (service) {
        const cost = this.transactionService.getServiceTokenCost(service);
        return res.json({ service, cost });
      }
      
      const costs = this.transactionService.getAllTokenCosts();
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
      
      const costBreakdown = this.transactionService.calculateJobTokenCost(jobData);
      
      res.json(costBreakdown);
    } catch (error) {
      logger.error('Error calculating job token cost:', error);
      res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  }
}

module.exports = TransactionController; 