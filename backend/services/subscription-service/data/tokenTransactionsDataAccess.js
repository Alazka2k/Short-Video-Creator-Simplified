/**
 * Token Transactions Data Access Layer
 * 
 * This module provides methods for interacting with token transactions in the database.
 * It handles operations related to token allocations, usage tracking, and balance calculations.
 *
 * The token_transactions table is the central record of all token-related activities,
 * tracking allocations from subscriptions, purchases of token packages, and token usage
 * across various services in the application.
 */

const knex = require('knex')(require('../../../../knexfile')[process.env.NODE_ENV || 'development']);
const logger = require('../../../shared/utils/logger');
const config = require('../../../shared/utils/config');
const path = require('path');
const fs = require('fs').promises;

class TokenTransactionsDataAccess {
  constructor() {
    this.tableName = 'token_transactions';
    this.logger = logger;
  }

  /**
   * Get all token transactions for a user
   * @param {string} userId - The user ID
   * @param {number} limit - The maximum number of transactions to return (default: 100)
   * @param {number} offset - The offset to start from (default: 0)
   * @returns {Promise<Array>} - List of token transactions
   */
  async getUserTokenTransactions(userId, limit = 100, offset = 0) {
    try {
      this.logger.info('Fetching token transactions for user:', { userId, limit, offset });
      
      const transactions = await knex(this.tableName)
        .where('user_id', userId)
        .orderBy('created_at', 'desc')
        .limit(limit)
        .offset(offset);
      
      return transactions.map(tx => this.formatTransaction(tx));
    } catch (error) {
      this.logger.error('Error fetching user token transactions:', error);
      throw error;
    }
  }
  
  /**
   * Get a token transaction by ID
   * @param {number} transactionId - The transaction ID
   * @returns {Promise<Object|null>} - The token transaction or null if not found
   */
  async getTransactionById(transactionId) {
    try {
      this.logger.info('Fetching token transaction by ID:', { transactionId });
      
      const transaction = await knex(this.tableName)
        .where('transaction_id', transactionId)
        .first();
      
      if (!transaction) {
        this.logger.warn('Token transaction not found:', { transactionId });
        return null;
      }
      
      return this.formatTransaction(transaction);
    } catch (error) {
      this.logger.error('Error fetching token transaction by ID:', error);
      throw error;
    }
  }
  
  /**
   * Create a new token transaction
   * @param {Object} transactionData - The transaction data
   * @returns {Promise<Object>} - The created token transaction
   */
  async createTransaction(transactionData) {
    try {
      this.logger.info('Creating new token transaction:', transactionData);
      
      // Set timestamps
      transactionData.created_at = knex.fn.now();
      
      const [newTransaction] = await knex(this.tableName)
        .insert(transactionData)
        .returning('*');
      
      this.logger.info('Token transaction created successfully:', { 
        transactionId: newTransaction.transaction_id,
        userId: newTransaction.user_id,
        type: newTransaction.transaction_type,
        amount: newTransaction.token_amount
      });
      
      return this.formatTransaction(newTransaction);
    } catch (error) {
      this.logger.error('Error creating token transaction:', error);
      throw error;
    }
  }
  
  /**
   * Allocate subscription tokens to a user
   * @param {string} userId - The user ID
   * @param {number} subscriptionId - The subscription ID
   * @param {number} tokenAmount - The token amount to allocate
   * @param {string} description - Optional description of the allocation
   * @returns {Promise<Object>} - The created token transaction
   */
  async allocateSubscriptionTokens(userId, subscriptionId, tokenAmount, description = 'Monthly subscription token allocation') {
    try {
      this.logger.info('Allocating subscription tokens to user:', {
        userId,
        subscriptionId,
        tokenAmount
      });
      
      const transactionData = {
        user_id: userId,
        transaction_type: 'subscription_allocation',
        token_amount: tokenAmount,
        related_entity_type: 'subscription',
        related_entity_id: subscriptionId,
        description: description
      };
      
      return this.createTransaction(transactionData);
    } catch (error) {
      this.logger.error('Error allocating subscription tokens:', error);
      throw error;
    }
  }
  
  /**
   * Record token package purchase
   * @param {string} userId - The user ID
   * @param {number} packageId - The token package ID
   * @param {number} tokenAmount - The token amount purchased
   * @param {number} paymentId - The payment ID
   * @returns {Promise<Object>} - The created token transaction
   */
  async recordTokenPackagePurchase(userId, packageId, tokenAmount, paymentId) {
    try {
      this.logger.info('Recording token package purchase:', {
        userId,
        packageId,
        tokenAmount,
        paymentId
      });
      
      const transactionData = {
        user_id: userId,
        transaction_type: 'purchase',
        token_amount: tokenAmount,
        related_entity_type: 'token_package',
        related_entity_id: packageId,
        payment_id: paymentId,
        description: `Purchased ${tokenAmount} tokens`
      };
      
      return this.createTransaction(transactionData);
    } catch (error) {
      this.logger.error('Error recording token package purchase:', error);
      throw error;
    }
  }
  
  /**
   * Record token usage
   * @param {string} userId - The user ID
   * @param {number} jobId - The job ID
   * @param {string} serviceName - The service name (e.g., 'llm', 'image', 'voice')
   * @param {number} tokenAmount - The token amount used
   * @param {Object} metadata - Optional metadata for the usage
   * @returns {Promise<Object>} - The created token transaction
   */
  async recordTokenUsage(userId, jobId, serviceName, tokenAmount, metadata = {}) {
    try {
      this.logger.info('Recording token usage:', {
        userId,
        jobId,
        serviceName,
        tokenAmount
      });
      
      const transactionData = {
        user_id: userId,
        transaction_type: 'usage',
        token_amount: tokenAmount,
        related_entity_type: 'job',
        related_entity_id: jobId,
        service_name: serviceName,
        metadata: JSON.stringify(metadata),
        description: `Used ${tokenAmount} tokens for ${serviceName}`
      };
      
      return this.createTransaction(transactionData);
    } catch (error) {
      this.logger.error('Error recording token usage:', error);
      throw error;
    }
  }
  
  /**
   * Add bonus tokens to a user
   * @param {string} userId - The user ID
   * @param {number} tokenAmount - The token amount to add
   * @param {string} reason - The reason for the bonus
   * @returns {Promise<Object>} - The created token transaction
   */
  async addBonusTokens(userId, tokenAmount, reason) {
    try {
      this.logger.info('Adding bonus tokens to user:', {
        userId,
        tokenAmount,
        reason
      });
      
      const transactionData = {
        user_id: userId,
        transaction_type: 'bonus',
        token_amount: tokenAmount,
        description: reason
      };
      
      return this.createTransaction(transactionData);
    } catch (error) {
      this.logger.error('Error adding bonus tokens:', error);
      throw error;
    }
  }
  
  /**
   * Get user's token balance
   * @param {string} userId - The user ID
   * @returns {Promise<Object>} - Token balance information
   */
  async getUserTokenBalance(userId) {
    try {
      this.logger.info('Calculating token balance for user:', { userId });
      
      // Calculate token credits (additions)
      const creditsResult = await knex(this.tableName)
        .where('user_id', userId)
        .whereIn('transaction_type', ['subscription_allocation', 'purchase', 'bonus', 'refund', 'adjustment'])
        .sum('token_amount as total')
        .first();
      
      // Calculate token debits (usage)
      const debitsResult = await knex(this.tableName)
        .where('user_id', userId)
        .whereIn('transaction_type', ['usage'])
        .sum('token_amount as total')
        .first();
      
      const credits = parseInt(creditsResult.total) || 0;
      const debits = parseInt(debitsResult.total) || 0;
      const balance = credits - debits;
      
      this.logger.info('Token balance calculated for user:', { userId, credits, debits, balance });
      
      return {
        userId,
        totalTokens: credits,
        usedTokens: debits,
        availableTokens: balance,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('Error calculating user token balance:', error);
      throw error;
    }
  }
  
  /**
   * Get token usage statistics for a user
   * @param {string} userId - The user ID
   * @param {string} startDate - The start date (ISO string)
   * @param {string} endDate - The end date (ISO string)
   * @returns {Promise<Object>} - Token usage statistics
   */
  async getUserTokenUsageStats(userId, startDate, endDate) {
    try {
      this.logger.info('Fetching token usage stats for user:', { userId, startDate, endDate });
      
      // Ensure we have valid dates
      const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default: 30 days ago
      const end = endDate ? new Date(endDate) : new Date(); // Default: now
      
      // Get usage by day
      const usageByDay = await knex(this.tableName)
        .where('user_id', userId)
        .where('transaction_type', 'usage')
        .whereBetween('created_at', [start, end])
        .select(
          knex.raw('DATE(created_at) as date'),
          knex.raw('SUM(token_amount) as total_usage')
        )
        .groupBy('date')
        .orderBy('date', 'asc');
      
      // Get usage by service
      const usageByService = await knex(this.tableName)
        .where('user_id', userId)
        .where('transaction_type', 'usage')
        .whereBetween('created_at', [start, end])
        .select(
          'service_name',
          knex.raw('SUM(token_amount) as total_usage')
        )
        .groupBy('service_name')
        .orderBy('total_usage', 'desc');
      
      // Get total usage
      const totalUsage = await knex(this.tableName)
        .where('user_id', userId)
        .where('transaction_type', 'usage')
        .whereBetween('created_at', [start, end])
        .sum('token_amount as total')
        .first();
      
      return {
        userId,
        period: {
          start: start.toISOString(),
          end: end.toISOString()
        },
        totalUsage: parseInt(totalUsage.total) || 0,
        usageByDay: usageByDay.map(item => ({
          date: item.date,
          usage: parseInt(item.total_usage) || 0
        })),
        usageByService: usageByService.map(item => ({
          serviceName: item.service_name,
          usage: parseInt(item.total_usage) || 0
        }))
      };
    } catch (error) {
      this.logger.error('Error fetching user token usage stats:', error);
      throw error;
    }
  }
  
  /**
   * Get recent token allocations for a user
   * @param {string} userId - The user ID
   * @param {number} limit - The maximum number of allocations to return (default: 10)
   * @returns {Promise<Array>} - List of recent token allocations
   */
  async getUserRecentAllocations(userId, limit = 10) {
    try {
      this.logger.info('Fetching recent token allocations for user:', { userId, limit });
      
      const allocations = await knex(this.tableName)
        .where('user_id', userId)
        .whereIn('transaction_type', ['subscription_allocation', 'purchase', 'bonus'])
        .orderBy('created_at', 'desc')
        .limit(limit);
      
      return allocations.map(allocation => this.formatTransaction(allocation));
    } catch (error) {
      this.logger.error('Error fetching user recent allocations:', error);
      throw error;
    }
  }
  
  /**
   * Format transaction data
   * @param {Object} transaction - The transaction data from the database
   * @returns {Object} - The formatted transaction data
   */
  formatTransaction(transaction) {
    if (!transaction) return null;
    
    const formattedTransaction = {
      ...transaction
    };
    
    // Format dates
    formattedTransaction.created_at = transaction.created_at ? new Date(transaction.created_at).toISOString() : null;
    
    // Parse metadata if it exists
    if (transaction.metadata) {
      try {
        formattedTransaction.metadata = JSON.parse(transaction.metadata);
      } catch (error) {
        this.logger.warn('Error parsing transaction metadata JSON:', { 
          transactionId: transaction.transaction_id,
          error: error.message 
        });
      }
    }
    
    return formattedTransaction;
  }
}

module.exports = new TokenTransactionsDataAccess(); 