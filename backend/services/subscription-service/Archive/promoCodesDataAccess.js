/**
 * PromoCodesDataAccess Module
 * 
 * This module provides methods for interacting with promotional codes in the database.
 * It handles the creation, retrieval, updating, and usage tracking of promo codes for 
 * discounts on subscriptions and token purchases.
 * 
 * The module interacts with the following tables:
 * - promo_codes: Stores promotional code details, including code, discount amount, 
 *   expiration date, maximum uses, and restrictions.
 * - promo_code_usages: Tracks when and how promotional codes are used, linking to users
 *   and the related purchases.
 * 
 * The module supports operations such as:
 * - Creating new promotional codes
 * - Validating code eligibility
 * - Tracking code usage
 * - Managing code expiration and limits
 */

const { db } = require('../../../db');
const config = require('config');
const path = require('path');
const fs = require('fs');
const logger = require('../../../logger');

class PromoCodesDataAccess {
  constructor() {
    this.tableName = 'promo_codes';
    this.usageTableName = 'promo_code_usages';
    this.logger = logger;
  }

  /**
   * Fetches all active promotional codes
   * @returns {Promise<Array>} Array of promo code objects
   */
  async fetchAllPromoCodes() {
    try {
      this.logger.info('Fetching all active promo codes');
      const promoCodes = await db(this.tableName)
        .where('is_active', true)
        .orderBy('created_at', 'desc');
      
      return promoCodes.map(this.formatPromoCodeData);
    } catch (error) {
      this.logger.error(`Error fetching promo codes: ${error.message}`);
      throw error;
    }
  }

  /**
   * Fetches a promotional code by its code string
   * @param {string} code - The promotional code to fetch
   * @returns {Promise<Object|null>} The promo code object or null if not found
   */
  async fetchPromoCodeByCode(code) {
    try {
      this.logger.info(`Fetching promo code with code: ${code}`);
      const promoCode = await db(this.tableName)
        .where('code', code)
        .where('is_active', true)
        .first();
      
      if (!promoCode) {
        this.logger.info(`No active promo code found with code: ${code}`);
        return null;
      }
      
      return this.formatPromoCodeData(promoCode);
    } catch (error) {
      this.logger.error(`Error fetching promo code by code ${code}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Validates if a promotional code is valid and can be used by a user
   * @param {string} code - The promotional code to validate
   * @param {number} userId - The user ID trying to use the code
   * @param {string} applicationType - The type of purchase (subscription or token_package)
   * @param {string|number} applicationId - The ID of the plan or token package
   * @returns {Promise<Object>} Object containing validity status and discount information
   */
  async validatePromoCode(code, userId, applicationType, applicationId) {
    try {
      this.logger.info(`Validating promo code: ${code} for user: ${userId}, type: ${applicationType}`);
      const promoCode = await this.fetchPromoCodeByCode(code);
      
      if (!promoCode) {
        return { valid: false, message: 'Promo code not found' };
      }
      
      // Check if code is expired
      if (promoCode.expiration_date && new Date(promoCode.expiration_date) < new Date()) {
        return { valid: false, message: 'Promo code has expired' };
      }
      
      // Check usage count if there's a maximum
      if (promoCode.max_uses !== null) {
        const usageCount = await db(this.usageTableName)
          .where('promo_code_id', promoCode.id)
          .count('id as count')
          .first();
        
        if (usageCount.count >= promoCode.max_uses) {
          return { valid: false, message: 'Promo code has reached maximum uses' };
        }
      }
      
      // Check if user has already used this code if it's once per user
      if (promoCode.once_per_user) {
        const userUsage = await db(this.usageTableName)
          .where('promo_code_id', promoCode.id)
          .where('user_id', userId)
          .first();
        
        if (userUsage) {
          return { valid: false, message: 'You have already used this promo code' };
        }
      }
      
      // Check if the code applies to the given application type and ID
      if (promoCode.restricted_applications) {
        let restrictedApps;
        try {
          restrictedApps = JSON.parse(promoCode.restricted_applications);
        } catch (e) {
          this.logger.error(`Error parsing restricted_applications JSON: ${e.message}`);
          restrictedApps = [];
        }
        
        const isApplicable = restrictedApps.some(app => 
          app.type === applicationType && 
          (app.id === applicationId || app.id === '*')
        );
        
        if (!isApplicable) {
          return { valid: false, message: 'Promo code not applicable to this purchase' };
        }
      }
      
      return { 
        valid: true, 
        discountType: promoCode.discount_type,
        discountValue: promoCode.discount_value,
        promoCodeId: promoCode.id
      };
    } catch (error) {
      this.logger.error(`Error validating promo code ${code}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Creates a new promotional code
   * @param {Object} promoCodeData - Data for the new promo code
   * @returns {Promise<Object>} The created promo code object
   */
  async createPromoCode(promoCodeData) {
    try {
      this.logger.info(`Creating new promo code: ${promoCodeData.code}`);
      
      // Ensure JSON fields are properly formatted
      if (promoCodeData.restricted_applications && typeof promoCodeData.restricted_applications === 'object') {
        promoCodeData.restricted_applications = JSON.stringify(promoCodeData.restricted_applications);
      }
      
      const [id] = await db(this.tableName).insert({
        ...promoCodeData,
        created_at: new Date(),
        updated_at: new Date()
      });
      
      const newPromoCode = await db(this.tableName).where('id', id).first();
      return this.formatPromoCodeData(newPromoCode);
    } catch (error) {
      this.logger.error(`Error creating promo code: ${error.message}`);
      throw error;
    }
  }

  /**
   * Updates an existing promotional code
   * @param {number} id - The ID of the promo code to update
   * @param {Object} promoCodeData - The updated promo code data
   * @returns {Promise<Object>} The updated promo code object
   */
  async updatePromoCode(id, promoCodeData) {
    try {
      this.logger.info(`Updating promo code with ID: ${id}`);
      
      // Ensure JSON fields are properly formatted
      if (promoCodeData.restricted_applications && typeof promoCodeData.restricted_applications === 'object') {
        promoCodeData.restricted_applications = JSON.stringify(promoCodeData.restricted_applications);
      }
      
      await db(this.tableName)
        .where('id', id)
        .update({
          ...promoCodeData,
          updated_at: new Date()
        });
      
      const updatedPromoCode = await db(this.tableName).where('id', id).first();
      return this.formatPromoCodeData(updatedPromoCode);
    } catch (error) {
      this.logger.error(`Error updating promo code with ID ${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Records the usage of a promotional code
   * @param {Object} usageData - Data about the usage of the promo code
   * @returns {Promise<Object>} The created usage record
   */
  async recordPromoCodeUsage(usageData) {
    try {
      this.logger.info(`Recording usage of promo code ID: ${usageData.promo_code_id} by user: ${usageData.user_id}`);
      
      const [id] = await db(this.usageTableName).insert({
        ...usageData,
        used_at: new Date()
      });
      
      const usageRecord = await db(this.usageTableName).where('id', id).first();
      return usageRecord;
    } catch (error) {
      this.logger.error(`Error recording promo code usage: ${error.message}`);
      throw error;
    }
  }

  /**
   * Deactivates a promotional code
   * @param {number} id - The ID of the promo code to deactivate
   * @returns {Promise<Object>} The deactivated promo code object
   */
  async deactivatePromoCode(id) {
    try {
      this.logger.info(`Deactivating promo code with ID: ${id}`);
      
      await db(this.tableName)
        .where('id', id)
        .update({
          is_active: false,
          updated_at: new Date()
        });
      
      const deactivatedPromoCode = await db(this.tableName).where('id', id).first();
      return this.formatPromoCodeData(deactivatedPromoCode);
    } catch (error) {
      this.logger.error(`Error deactivating promo code with ID ${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Formats promo code data for consistent output
   * @param {Object} promoCode - The raw promo code data from the database
   * @returns {Object} Formatted promo code data
   */
  formatPromoCodeData(promoCode) {
    if (!promoCode) return null;
    
    try {
      // Parse JSON fields if they are strings
      let restrictedApplications = promoCode.restricted_applications;
      if (typeof restrictedApplications === 'string') {
        try {
          restrictedApplications = JSON.parse(restrictedApplications);
        } catch (e) {
          this.logger.warn(`Error parsing restricted_applications for promo code ${promoCode.id}: ${e.message}`);
          restrictedApplications = [];
        }
      }
      
      return {
        ...promoCode,
        restricted_applications: restrictedApplications,
        created_at: promoCode.created_at ? new Date(promoCode.created_at).toISOString() : null,
        updated_at: promoCode.updated_at ? new Date(promoCode.updated_at).toISOString() : null,
        expiration_date: promoCode.expiration_date ? new Date(promoCode.expiration_date).toISOString() : null
      };
    } catch (error) {
      this.logger.error(`Error formatting promo code data: ${error.message}`);
      return promoCode;
    }
  }
}

module.exports = new PromoCodesDataAccess();