/**
 * Token Packages Data Access Layer
 * 
 * This module provides methods for interacting with token packages in the database.
 * It handles CRUD operations for token packages, including creating, retrieving, updating,
 * and formatting token package data.
 * 
 * The token_packages table stores the different token package options available to users,
 * including token allocation and pricing information. These packages allow users to purchase
 * additional tokens on demand to supplement their subscription token allocation.
 */

const knex = require('knex')(require('../../../../knexfile')[process.env.NODE_ENV]);
const logger = require('../../../shared/utils/logger');
const config = require('../../../shared/utils/config');
const path = require('path');
const fs = require('fs').promises;

class TokenPackagesDataAccess {
  constructor() {
    this.tableName = 'token_packages';
    this.logger = logger;
  }

  /**
   * Get all token packages
   * @param {boolean} includeInactive - Whether to include inactive packages
   * @param {string} status - Optional status to filter by ('active', 'inactive')
   * @returns {Promise<Array>} - List of token packages
   */
  async getAllTokenPackages(includeInactive = true, status = null) {
    try {
      this.logger.info('Fetching all token packages:', { includeInactive, status });
      
      let query = knex(this.tableName);
      
      if (status) {
        query = query.where('active', status === 'active');
      } else if (!includeInactive) {
        query = query.where('active', true);
      }
      
      const packages = await query.orderBy('token_allocation', 'asc');
      
      return packages.map(pkg => this.formatTokenPackage(pkg));
    } catch (error) {
      this.logger.error('Error fetching token packages:', error);
      throw error;
    }
  }
  
  /**
   * Get a token package by ID
   * @param {number} packageId - The package ID
   * @returns {Promise<Object|null>} - The token package or null if not found
   */
  async getTokenPackageById(packageId) {
    try {
      this.logger.info('Fetching token package by ID:', { packageId });
      
      const tokenPackage = await knex(this.tableName)
        .where('package_id', packageId)
        .first();
      
      if (!tokenPackage) {
        this.logger.warn('Token package not found:', { packageId });
        return null;
      }
      
      return this.formatTokenPackage(tokenPackage);
    } catch (error) {
      this.logger.error('Error fetching token package by ID:', error);
      throw error;
    }
  }
  
  /**
   * Get a token package by token allocation
   * @param {number} tokenAllocation - The token allocation
   * @returns {Promise<Object|null>} - The token package or null if not found
   */
  async getTokenPackageByTokenAllocation(tokenAllocation) {
    try {
      this.logger.info('Fetching token package by token allocation:', { tokenAllocation });
      
      const tokenPackage = await knex(this.tableName)
        .where('token_allocation', tokenAllocation)
        .where('active', true)
        .first();
      
      if (!tokenPackage) {
        this.logger.warn('Token package not found for token allocation:', { tokenAllocation });
        return null;
      }
      
      return this.formatTokenPackage(tokenPackage);
    } catch (error) {
      this.logger.error('Error fetching token package by token allocation:', error);
      throw error;
    }
  }
  
  /**
   * Update a token package
   * @param {number} packageId - The package ID
   * @param {Object} packageData - The updated package data
   * @returns {Promise<Object|null>} - The updated token package or null if not found
   */
  async updateTokenPackage(packageId, packageData) {
    try {
      this.logger.info('Updating token package:', { packageId, packageData });
      
      // Prevent updating the package_id
      delete packageData.package_id;
      
      // Update the updated_at timestamp
      packageData.updated_at = knex.fn.now();
      
      const [updatedPackage] = await knex(this.tableName)
        .where('package_id', packageId)
        .update(packageData)
        .returning('*');
      
      if (!updatedPackage) {
        this.logger.warn('Token package not found for update:', { packageId });
        return null;
      }
      
      this.logger.info('Token package updated successfully:', { 
        packageId,
        packageName: updatedPackage.package_name
      });
      return this.formatTokenPackage(updatedPackage);
    } catch (error) {
      this.logger.error('Error updating token package:', error);
      throw error;
    }
  }
  
  /**
   * Create a new token package
   * @param {Object} packageData - The package data
   * @returns {Promise<Object>} - The created token package
   */
  async createTokenPackage(packageData) {
    try {
      this.logger.info('Creating new token package:', packageData);
      
      // Convert camelCase to snake_case for database
      const dbPackageData = {
        package_name: packageData.packageName,
        token_allocation: packageData.tokenAllocation,
        price: packageData.price,
        active: packageData.active !== undefined ? packageData.active : true,
        marketing_description: packageData.marketingDescription ? JSON.stringify(packageData.marketingDescription) : null
      };
      
      // Set timestamps
      dbPackageData.created_at = knex.fn.now();
      dbPackageData.updated_at = knex.fn.now();
      
      // Get the highest existing package_id
      const maxResult = await knex(this.tableName)
        .max('package_id as max_id')
        .first();
      
      // Set the next package_id (highest + 1)
      const nextId = (maxResult.max_id || 0) + 1;
      this.logger.info(`Using next package_id: ${nextId}`);
      
      // Insert with the explicit ID
      const [newPackage] = await knex(this.tableName)
        .insert({
          ...dbPackageData,
          package_id: nextId
        })
        .returning('*');
      
      this.logger.info('Token package created successfully:', { 
        packageId: newPackage.package_id,
        packageName: newPackage.package_name
      });
      return this.formatTokenPackage(newPackage);
    } catch (error) {
      this.logger.error('Error creating token package:', error);
      throw error;
    }
  }
  
  /**
   * Format token package data including parsing any JSON fields
   * @param {Object} tokenPackage - The token package data from the database
   * @returns {Object} - The formatted token package data
   */
  formatTokenPackage(tokenPackage) {
    if (!tokenPackage) return null;
    
    const formattedPackage = {
      ...tokenPackage
    };
    
    // Format dates
    formattedPackage.created_at = tokenPackage.created_at ? new Date(tokenPackage.created_at).toISOString() : null;
    formattedPackage.updated_at = tokenPackage.updated_at ? new Date(tokenPackage.updated_at).toISOString() : null;
    
    // Parse JSON fields
    if (tokenPackage.marketing_description) {
      try {
        // If it's already an object, use it as is
        if (typeof tokenPackage.marketing_description === 'object') {
          formattedPackage.marketing_description = tokenPackage.marketing_description;
        } else {
          // If it's a string, try to parse it as JSON
          formattedPackage.marketing_description = JSON.parse(tokenPackage.marketing_description);
        }
      } catch (error) {
        this.logger.warn('Error parsing marketing_description JSON:', { 
          packageId: tokenPackage.package_id,
          error: error.message 
        });
      }
    }
    
    return formattedPackage;
  }
}

module.exports = new TokenPackagesDataAccess(); 