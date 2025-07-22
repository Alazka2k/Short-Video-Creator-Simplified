/**
 * Token Balance Data Access
 * 
 * This module manages operations on the tokens table, which stores up-to-date user token balances.
 */

const knex = require('knex')(require('../../../../knexfile')[process.env.NODE_ENV]);
const logger = require('../../../shared/utils/logger');

class TokenBalanceDataAccess {
  constructor() {
    this.tableName = 'tokens';
    this.logger = logger;
  }

  /**
   * Get the current token balance for a user
   * @param {string|number} userId - The user ID
   * @returns {Promise<Object>} - Token balance information
   */
  async getUserTokenBalance(userId) {
    try {
      this.logger.info('Fetching token balance for user:', { userId });
      
      const tokenRecord = await knex(this.tableName)
        .where('user_id', userId)
        .first();
      
      if (tokenRecord) {
        return {
          userId,
          balance: tokenRecord.balance,
          lastUpdated: tokenRecord.last_updated
        };
      }
      
      // If no record exists, calculate the balance from transactions and create a new record
      return this.calculateAndCreateTokenBalance(userId);
    } catch (error) {
      this.logger.error('Error fetching user token balance:', error);
      throw error;
    }
  }

  /**
   * Calculate token balance from transactions and create a token balance record
   * @param {string|number} userId - The user ID
   * @returns {Promise<Object>} - Token balance information
   */
  async calculateAndCreateTokenBalance(userId) {
    try {
      this.logger.info('Calculating token balance from transactions for user:', { userId });
      
      // Calculate total from all transactions
      const result = await knex('token_transactions')
        .where('user_id', userId)
        .sum('token_amount as total')
        .first();
      
      const balance = parseInt(result?.total || 0);
      const now = new Date();
      
      // Create a new token balance record
      const tokenRecord = await knex(this.tableName)
        .insert({
          user_id: userId,
          balance: balance,
          last_updated: now
        })
        .returning(['token_id', 'user_id', 'balance', 'last_updated']);
      
      this.logger.info('Created new token balance record for user:', { 
        userId, 
        balance, 
        tokenId: tokenRecord[0].token_id 
      });
      
      return {
        userId,
        balance: balance,
        lastUpdated: now.toISOString()
      };
    } catch (error) {
      this.logger.error('Error calculating and creating token balance:', error);
      throw error;
    }
  }

  /**
   * Update the token balance for a user
   * @param {string|number} userId - The user ID
   * @param {number} transactionAmount - The amount of the transaction (positive for additions, negative for deductions)
   * @param {Object} trx - Optional Knex transaction object
   * @returns {Promise<Object>} - Updated token balance information
   */
  async updateTokenBalance(userId, transactionAmount, trx) {
    try {
      this.logger.info('Updating token balance for user:', { 
        userId, 
        transactionAmount,
        hasTransaction: !!trx
      });
      
      const queryBuilder = trx ? trx(this.tableName) : knex(this.tableName);
      
      // Check if user has a token balance record
      const exists = await queryBuilder
        .where('user_id', userId)
        .first();
      
      const now = new Date();
      
      if (exists) {
        // Update existing record
        const newBalance = exists.balance + parseInt(transactionAmount);
        
        const updated = await queryBuilder
          .where('user_id', userId)
          .update({
            balance: newBalance,
            last_updated: now
          })
          .returning(['token_id', 'user_id', 'balance', 'last_updated']);
        
        this.logger.info('Updated token balance for user:', { 
          userId, 
          oldBalance: exists.balance,
          newBalance: updated[0].balance
        });
        
        return {
          userId,
          balance: updated[0].balance,
          lastUpdated: updated[0].last_updated
        };
      } else {
        // Create new record
        const balance = parseInt(transactionAmount);
        
        const inserted = await queryBuilder
          .insert({
            user_id: userId,
            balance: balance,
            last_updated: now
          })
          .returning(['token_id', 'user_id', 'balance', 'last_updated']);
        
        this.logger.info('Created token balance record for user:', { 
          userId, 
          balance: inserted[0].balance
        });
        
        return {
          userId,
          balance: inserted[0].balance,
          lastUpdated: inserted[0].last_updated
        };
      }
    } catch (error) {
      this.logger.error('Error updating token balance:', error);
      throw error;
    }
  }
}

module.exports = TokenBalanceDataAccess; 