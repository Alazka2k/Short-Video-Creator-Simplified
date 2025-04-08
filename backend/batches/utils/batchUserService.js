/**
 * System User Service
 * 
 * This service provides access to system users (batch and api users) from the database.
 * It caches the user IDs to avoid unnecessary database queries.
 */

const logger = require('../../shared/utils/logger');
const knex = require('knex')(require('../../../knexfile')[process.env.NODE_ENV]);

class BatchUserService {
  constructor() {
    this.batchUserId = null;
  }

  /**
   * Get the batch user ID from the database
   * @returns {Promise<string>} The batch user ID
   */
  async getBatchUserId() {
    try {
      if (this.batchUserId) {
        return this.batchUserId;
      }

      const batchUser = await knex('users')
        .where({
          provider: 'system',
          auth0_id: 'batch'
        })
        .select('user_id')
        .first();

      if (!batchUser) {
        throw new Error('Batch user not found in database');
      }

      this.batchUserId = batchUser.user_id;
      return this.batchUserId;
    } catch (error) {
      logger.error('Error fetching batch user ID:', error);
      throw error;
    }
  }

  /**
   * Clear the cached user IDs
   * This can be useful if the users are updated in the database
   */
  clearCache() {
    this.batchUserId = null;
    logger.debug('Cleared system user ID cache');
  }
}

// Export a singleton instance
module.exports = new BatchUserService(); 