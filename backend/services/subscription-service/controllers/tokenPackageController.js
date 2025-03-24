/**
 * Token Package Controller
 * 
 * This controller handles HTTP requests for token package-related endpoints:
 * - GET /token-packages - Get all token packages
 * - GET /token-packages/:packageId - Get token package by ID
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
      const { includeInactive } = req.query;
      const tokenPackages = await this.tokenPackageService.getAllTokenPackages(includeInactive === 'true');
      
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
}

module.exports = TokenPackageController; 