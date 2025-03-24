/**
 * Token Service
 * 
 * This service handles token-related functionality including:
 * - Managing token balances
 * - Token allocation and deduction
 * - Token usage tracking
 * - Token cost calculations
 */

const logger = require('../../../shared/utils/logger');

class TokenService {
  constructor(dataAccess, tokenCalculator) {
    this.dataAccess = dataAccess;
    this.tokenCalculator = tokenCalculator;
    logger.info('TokenService initialized');
  }

  /**
   * Get a user's token balance
   * @param {string} userId - The user ID
   * @returns {Promise<Object>} - The token balance information
   */
  async getUserTokenBalance(userId) {
    try {
      logger.info('Getting token balance for user:', { userId });
      
      if (!userId) {
        throw new Error('User ID is required');
      }
      
      return await this.dataAccess.tokenBalance.getUserTokenBalance(userId);
    } catch (error) {
      logger.error('Error in getUserTokenBalance:', error);
      throw error;
    }
  }

  /**
   * Get a user's token transactions
   * @param {string} userId - The user ID
   * @param {number} limit - The maximum number of transactions to return
   * @param {number} offset - The offset for pagination
   * @returns {Promise<Array>} - List of token transactions
   */
  async getUserTokenTransactions(userId, limit = 100, offset = 0) {
    try {
      logger.info('Getting token transactions for user:', { userId, limit, offset });
      
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
   * Allocate subscription tokens to a user
   * @param {string} userId - The user ID
   * @param {string} subscriptionId - The subscription ID
   * @param {number} tokenAmount - The number of tokens to allocate
   * @param {string} description - The description of the allocation
   * @returns {Promise<Object>} - The token transaction record
   */
  async allocateSubscriptionTokens(userId, subscriptionId, tokenAmount, description) {
    try {
      logger.info('Allocating subscription tokens:', { userId, subscriptionId, tokenAmount });
      
      if (!userId) {
        throw new Error('User ID is required');
      }
      
      if (!subscriptionId) {
        throw new Error('Subscription ID is required');
      }
      
      if (!tokenAmount || tokenAmount <= 0) {
        throw new Error('Token amount must be positive');
      }
      
      const transaction = await this.dataAccess.tokenTransactions.allocateSubscriptionTokens(
        userId,
        subscriptionId,
        tokenAmount,
        description
      );
      
      logger.info('Tokens allocated successfully:', { 
        transactionId: transaction.transaction_id,
        userId,
        subscriptionId,
        tokenAmount
      });
      
      return transaction;
    } catch (error) {
      logger.error('Error in allocateSubscriptionTokens:', error);
      throw error;
    }
  }

  /**
   * Allocate tokens to a user (general allocation)
   * @param {string} userId - The user ID
   * @param {number} tokenAmount - The number of tokens to allocate
   * @param {string} relatedEntityType - The type of related entity
   * @param {string} relatedEntityId - The ID of the related entity
   * @param {string} description - The description of the allocation
   * @param {string} paymentId - The payment ID (if applicable)
   * @returns {Promise<Object>} - The token transaction record
   */
  async allocateTokens(userId, tokenAmount, relatedEntityType, relatedEntityId, description, paymentId = null) {
    try {
      logger.info('Allocating tokens:', { 
        userId, 
        tokenAmount, 
        relatedEntityType, 
        relatedEntityId,
        description,
        paymentId
      });
      
      if (!userId) {
        throw new Error('User ID is required');
      }
      
      if (!tokenAmount || tokenAmount <= 0) {
        throw new Error('Token amount must be positive');
      }
      
      if (!relatedEntityType) {
        throw new Error('Related entity type is required');
      }
      
      const transaction = await this.dataAccess.tokenTransactions.allocateTokens(
        userId,
        tokenAmount,
        relatedEntityType,
        relatedEntityId,
        description,
        paymentId
      );
      
      logger.info('Tokens allocated successfully:', { 
        transactionId: transaction.transaction_id,
        userId,
        tokenAmount
      });
      
      return transaction;
    } catch (error) {
      logger.error('Error in allocateTokens:', error);
      throw error;
    }
  }

  /**
   * Record token usage
   * @param {string} userId - The user ID
   * @param {string} jobId - The job ID
   * @param {string} serviceName - The service name
   * @param {number} tokenAmount - The number of tokens used
   * @param {Object} metadata - Additional metadata
   * @param {string} description - The description of the usage
   * @param {string} relatedEntityType - The type of related entity
   * @param {string} relatedEntityId - The ID of the related entity
   * @param {string} externalServiceName - The external service name
   * @returns {Promise<Object>} - The token transaction record
   */
  async recordTokenUsage(userId, jobId, serviceName, tokenAmount, metadata = {}, description = null, relatedEntityType = null, relatedEntityId = null, externalServiceName = null) {
    try {
      logger.info('Recording token usage:', { 
        userId, 
        jobId, 
        serviceName, 
        tokenAmount,
        metadata
      });
      
      if (!userId) {
        throw new Error('User ID is required');
      }
      
      if (!jobId) {
        throw new Error('Job ID is required');
      }
      
      if (!serviceName) {
        throw new Error('Service name is required');
      }
      
      if (!tokenAmount || tokenAmount <= 0) {
        throw new Error('Token amount must be positive');
      }
      
      // Convert tokenAmount to negative for deduction
      tokenAmount = -Math.abs(tokenAmount);
      
      // Check if user has enough tokens
      const balance = await this.dataAccess.tokenBalance.getUserTokenBalance(userId);
      
      if (balance.balance < Math.abs(tokenAmount)) {
        throw new Error(`Insufficient tokens. User has ${balance.balance} tokens, but needs ${Math.abs(tokenAmount)}`);
      }
      
      // Set up transaction data
      const transactionData = {
        userId,
        jobId,
        serviceName,
        tokenAmount,
        metadata,
        description,
        relatedEntityType,
        relatedEntityId,
        externalServiceName
      };
      
      // Process the token usage transaction
      const transaction = await this.dataAccess.tokenTransactions.recordTokenUsage(
        transactionData.userId,
        transactionData.jobId,
        transactionData.serviceName,
        transactionData.tokenAmount,
        transactionData.metadata
      );
      
      logger.info('Token usage recorded successfully:', { 
        transactionId: transaction.transaction_id,
        userId,
        tokenAmount
      });
      
      return transaction;
    } catch (error) {
      logger.error('Error in recordTokenUsage:', error);
      throw error;
    }
  }

  /**
   * Calculate the token cost of a job
   * @param {Object} jobData - The job data
   * @returns {Object} - The token cost breakdown
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

module.exports = TokenService; 