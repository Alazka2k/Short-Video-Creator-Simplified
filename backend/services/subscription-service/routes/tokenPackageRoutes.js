 /**
 * Token Package Routes
 * 
 * Defines routes for token package-related endpoints:
 * - GET /token-packages - Get all token packages
 * - GET /token-packages/:packageId - Get token package by ID
 */

const express = require('express');
const router = express.Router();

module.exports = (tokenPackageController) => {
  /**
   * @route GET /api/subscription/token-packages
   * @description Get all token packages
   * @access Public
   */
  router.get('/', tokenPackageController.getTokenPackages.bind(tokenPackageController));

  /**
   * @route GET /api/subscription/token-packages/:packageId
   * @description Get token package by ID
   * @access Public
   */
  router.get('/:packageId', tokenPackageController.getTokenPackageById.bind(tokenPackageController));

  return router;
};