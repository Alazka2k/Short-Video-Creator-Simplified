/**
 * Transaction Service
 * 
 * This service handles transaction-related functionality including:
 * - Getting token costs
 * - Retrieving user token transactions
 * - Calculating token cost for jobs
 */

const logger = require('../../../shared/utils/logger');

class TransactionService {
  constructor(dataAccess, tokenCalculator) {
    this.dataAccess = dataAccess;
    this.tokenCalculator = tokenCalculator;
    logger.info('TransactionService initialized');
  }

  /**
   * Get user's token transactions
   * @param {string} userId - The user ID
   * @param {number} limit - Maximum number of transactions to return
   * @param {number} offset - Offset to start from
   * @returns {Promise<Array>} - List of token transactions
   */
  async getUserTokenTransactions(userId, limit = 100, offset = 0) {
    try {
      logger.info('Getting user token transactions:', { userId, limit, offset });
      
      if (!userId) {
        throw new Error('User ID is required');
      }
      
      return await this.dataAccess.tokenTransactions.getUserTokenTransactions(userId, limit, offset);
    } catch (error) {
      logger.error('Error in getUserTokenTransactions:', error);
      throw error;
    }
  }

  /**
   * Calculate job token cost
   * @param {Object} jobData - The job data
   * @returns {Object} - The job cost breakdown
   */
  calculateJobTokenCost(jobData) {
    try {
      logger.info('Calculating job token cost:', jobData);
      return this.tokenCalculator.calculateJobCost(jobData);
    } catch (error) {
      logger.error('Error in calculateJobTokenCost:', error);
      throw error;
    }
  }

  /**
   * Get the token cost for a specific service
   * @param {string} service - The service name
   * @returns {number} - The token cost
   */
  getServiceTokenCost(service) {
    try {
      return this.tokenCalculator.getServiceCost(service);
    } catch (error) {
      logger.error('Error in getServiceTokenCost:', error);
      throw error;
    }
  }

  /**
   * Get all token costs
   * @returns {Object} - Object containing all token costs
   */
  getAllTokenCosts() {
    try {
      return this.tokenCalculator.getAllCosts();
    } catch (error) {
      logger.error('Error in getAllTokenCosts:', error);
      throw error;
    }
  }
}

module.exports = TransactionService; 