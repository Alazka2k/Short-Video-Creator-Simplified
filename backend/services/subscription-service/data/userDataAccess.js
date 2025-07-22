/**
 * User Data Access
 * 
 * This module provides methods for interacting with the users table.
 * It's used by the subscription service to fetch user details required for
 * payment processing without directly coupling with the auth service's data layer.
 */
const knex = require('knex')(require('../../../../knexfile')[process.env.NODE_ENV]);
const logger = require('../../../shared/utils/logger');

const USER_TABLE = 'users';

class UserDataAccess {
  /**
   * Find a user by their ID.
   * @param {number} userId - The user's ID.
   * @returns {Promise<Object|null>} The user object or null if not found.
   */
  async getUserById(userId) {
    try {
      logger.info(`Fetching user by ID: ${userId}`);
      const user = await knex(USER_TABLE).where('user_id', userId).first();
      return user;
    } catch (error) {
      logger.error(`Error fetching user by ID ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Update a user's details.
   * @param {number} userId - The user's ID.
   * @param {Object} updates - An object containing the fields to update.
   * @returns {Promise<Object>} The updated user object.
   */
  async updateUser(userId, updates) {
    try {
      logger.info(`Updating user ${userId} with:`, updates);
      const [updatedUser] = await knex(USER_TABLE)
        .where('user_id', userId)
        .update(updates)
        .returning('*');
      
      return updatedUser;
    } catch (error) {
      logger.error(`Error updating user ${userId}:`, error);
      throw error;
    }
  }
}

module.exports = new UserDataAccess(); 