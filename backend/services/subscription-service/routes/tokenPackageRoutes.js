/**
 * Token Package Routes
 * 
 * Defines routes for token package-related endpoints:
 * - GET /token-packages - Get all token packages
 * - GET /token-packages/:packageId - Get token package by ID
 * - POST /token-packages/add - Create a new token package (admin only)
 * - POST /token-packages/buy - Purchase a token package
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

  /**
   * @route POST /api/subscription/token-packages/add
   * @description Create a new token package (admin only)
   * @access Private (admin only)
   */
  router.post('/add', tokenPackageController.createTokenPackage.bind(tokenPackageController));

  /**
   * @route POST /api/subscription/token-packages/buy
   * @description Purchase a token package
   * @access Private
   */
  router.post('/buy', tokenPackageController.purchaseTokenPackage.bind(tokenPackageController));

  return router;
};