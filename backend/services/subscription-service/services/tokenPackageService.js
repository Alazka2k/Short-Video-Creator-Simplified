/**
 * Token Package Service
 * 
 * This service handles token package-related functionality including:
 * - Retrieving all token packages
 * - Getting token package by ID
 * - Creating new token packages
 */

const logger = require('../../../shared/utils/logger');

class TokenPackageService {
  constructor(dataAccess, paymentService) {
    this.dataAccess = dataAccess;
    this.paymentService = paymentService;
    logger.info('TokenPackageService initialized');
  }

  /**
   * Get all token packages
   * @param {boolean} includeInactive - Whether to include inactive packages
   * @param {string} status - Optional status to filter by ('active', 'inactive')
   * @returns {Promise<Array>} - List of token packages
   */
  async getAllTokenPackages(includeInactive = true, status = null) {
    try {
      logger.info('Getting all token packages:', { includeInactive, status });
      return await this.dataAccess.tokenPackages.getAllTokenPackages(includeInactive, status);
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

  /**
   * Create a new token package
   * @param {Object} packageData - The token package data
   * @returns {Promise<Object>} - The created token package
   */
  async createTokenPackage(packageData) {
    try {
      logger.info('Creating new token package:', packageData);
      
      // Validate required fields
      if (!packageData.packageName) {
        throw new Error('Package name is required');
      }
      
      if (!packageData.tokenAllocation || packageData.tokenAllocation <= 0) {
        throw new Error('Token allocation must be a positive number');
      }
      
      if (!packageData.price || packageData.price <= 0) {
        throw new Error('Price must be a positive number');
      }
      
      // Set default values
      const formattedPackageData = {
        ...packageData,
        active: packageData.active !== undefined ? packageData.active : true,
        created_at: new Date(),
        updated_at: new Date()
      };
      
      const tokenPackage = await this.dataAccess.tokenPackages.createTokenPackage(formattedPackageData);
      
      logger.info('Token package created successfully:', {
        packageId: tokenPackage.package_id,
        packageName: tokenPackage.package_name
      });
      
      return tokenPackage;
    } catch (error) {
      logger.error('Error in createTokenPackage:', error);
      throw error;
    }
  }

  /**
   * Purchase a token package
   * @param {string} userId - The user ID
   * @param {string} packageId - The token package ID
   * @param {string} paymentProvider - The payment provider
   * @param {string} stripePaymentIntentId - The external payment ID (stripe)for the payment intent
   * @returns {Promise<Object>} - The purchase result
   */
  async purchaseTokenPackage(userId, packageId, paymentProvider, stripePaymentIntentId) {
    try {
      logger.info('Purchasing token package:', { userId, packageId, paymentProvider, stripePaymentIntentId });
      
      // Delegate to payment service for handling the purchase
      return await this.paymentService.purchaseTokenPackage(
        userId,
        packageId,
        paymentProvider,
        stripePaymentIntentId
      );
    } catch (error) {
      logger.error('Error in purchaseTokenPackage:', error);
      throw error;
    }
  }
}

module.exports = TokenPackageService; 