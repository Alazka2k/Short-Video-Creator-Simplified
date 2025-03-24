/**
 * Token Package Service
 * 
 * This service handles token package-related functionality including:
 * - Retrieving all token packages
 * - Getting token package by ID
 */

const logger = require('../../../shared/utils/logger');

class TokenPackageService {
  constructor(dataAccess) {
    this.dataAccess = dataAccess;
    logger.info('TokenPackageService initialized');
  }

  /**
   * Get all token packages
   * @param {boolean} includeInactive - Whether to include inactive packages
   * @returns {Promise<Array>} - List of token packages
   */
  async getAllTokenPackages(includeInactive = false) {
    try {
      logger.info('Getting all token packages:', { includeInactive });
      return await this.dataAccess.tokenPackages.getAllTokenPackages(includeInactive);
    } catch (error) {
      logger.error('Error in getAllTokenPackages:', error);
      throw error;
    }
  }

  /**
   * Get token package by ID
   * @param {number} packageId - The token package ID
   * @returns {Promise<Object>} - The token package or null if not found
   */
  async getTokenPackageById(packageId) {
    try {
      logger.info('Getting token package by ID:', { packageId });
      
      if (!packageId) {
        throw new Error('Package ID is required');
      }
      
      return await this.dataAccess.tokenPackages.getTokenPackageById(packageId);
    } catch (error) {
      logger.error('Error in getTokenPackageById:', error);
      throw error;
    }
  }
}

module.exports = TokenPackageService; 