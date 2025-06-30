/**
 * Token Package Controller
 * 
 * This controller handles HTTP requests for token package-related endpoints:
 * - GET /token-packages - Get all token packages
 * - GET /token-packages/:packageId - Get token package by ID
 * - POST /token-packages - Create a new token package (admin only)
 * - POST /token-packages/buy - Purchase a token package
 */

const logger = require('../../../shared/utils/logger');

class TokenPackageController {
  constructor(tokenPackageService) {
    this.tokenPackageService = tokenPackageService;
    logger.info('TokenPackageController initialized');
  }

  /**
   * Get all token packages
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getTokenPackages(req, res) {
    try {
      const { includeInactive = 'true', status } = req.query;
      
      // Validate status parameter if provided
      if (status && !['active', 'inactive'].includes(status)) {
        return res.status(400).json({ 
          error: 'Bad Request', 
          message: 'Status parameter must be either "active" or "inactive"' 
        });
      }
      
      const tokenPackages = await this.tokenPackageService.getAllTokenPackages(
        includeInactive === 'true',
        status
      );
      
      res.json(tokenPackages);
    } catch (error) {
      logger.error('Error fetching token packages:', error);
      res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  }

  /**
   * Get token package by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getTokenPackageById(req, res) {
    try {
      const { packageId } = req.params;
      const tokenPackage = await this.tokenPackageService.getTokenPackageById(packageId);
      
      if (!tokenPackage) {
        return res.status(404).json({ error: 'Token package not found' });
      }
      
      res.json(tokenPackage);
    } catch (error) {
      logger.error('Error fetching token package:', error);
      res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  }

  /**
   * Create a new token package (admin only)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async createTokenPackage(req, res) {
    try {
      const packageData = req.body;
      
      // Validate required fields
      if (!packageData.packageName || !packageData.tokenAllocation || !packageData.price) {
        return res.status(400).json({ 
          error: 'Bad Request', 
          message: 'packageName, tokenAllocation, and price are required' 
        });
      }
      
      const tokenPackage = await this.tokenPackageService.createTokenPackage(packageData);
      
      res.status(201).json({
        success: true,
        data: tokenPackage
      });
    } catch (error) {
      logger.error('Error creating token package:', error);
      res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  }

  /**
   * Purchase a token package
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async purchaseTokenPackage(req, res) {
    try {
      const { userId, packageId, paymentProvider, stripePaymentIntentId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
      }
      
      if (!packageId) {
        return res.status(400).json({ error: 'packageId is required' });
      }
      
      if (!paymentProvider) {
        return res.status(400).json({ error: 'paymentProvider is required' });
      }
      
      if (!stripePaymentIntentId) {
        return res.status(400).json({ error: 'stripePaymentIntentId is required' });
      }
      
      const result = await this.tokenPackageService.purchaseTokenPackage(
        userId,
        packageId,
        paymentProvider,
        stripePaymentIntentId
      );
      
      res.status(201).json(result);
    } catch (error) {
      logger.error('Error purchasing token package:', error);
      res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  }
}

module.exports = TokenPackageController; 