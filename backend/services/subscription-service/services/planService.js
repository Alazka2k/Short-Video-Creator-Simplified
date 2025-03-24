/**
 * Plan Service
 * 
 * This service handles plan-related functionality including:
 * - Retrieving all plans
 * - Getting plans by frequency
 * - Getting plan by ID
 */

const logger = require('../../../shared/utils/logger');

class PlanService {
  constructor(dataAccess) {
    this.dataAccess = dataAccess;
    logger.info('PlanService initialized');
  }

  /**
   * Get all subscription plans
   * @param {boolean} includeInactive - Whether to include inactive plans
   * @param {string} sortBy - Field to sort by
   * @param {string} sortOrder - Sort order: 'asc' or 'desc'
   * @returns {Promise<Array>} - List of subscription plans
   */
  async getAllPlans(includeInactive = false, sortBy = 'monthly_price', sortOrder = 'asc') {
    try {
      logger.info('Getting all plans:', { includeInactive, sortBy, sortOrder });
      return await this.dataAccess.plans.getAllPlans(includeInactive, sortBy, sortOrder);
    } catch (error) {
      logger.error('Error in getAllPlans:', error);
      throw error;
    }
  }

  /**
   * Get plans by billing frequency
   * @param {string} billingFrequency - The billing frequency (monthly or yearly)
   * @param {boolean} includeInactive - Whether to include inactive plans
   * @param {string} sortBy - Field to sort by
   * @param {string} sortOrder - Sort order: 'asc' or 'desc'
   * @returns {Promise<Array>} - List of subscription plans with the specified billing frequency
   */
  async getPlansByFrequency(billingFrequency, includeInactive = false, sortBy = 'monthly_price', sortOrder = 'asc') {
    try {
      logger.info('Getting plans by frequency:', { billingFrequency, includeInactive, sortBy, sortOrder });
      
      if (!billingFrequency) {
        throw new Error('Billing frequency is required');
      }
      
      if (!['monthly', 'yearly'].includes(billingFrequency)) {
        throw new Error('Invalid billing frequency. Must be "monthly" or "yearly"');
      }
      
      return await this.dataAccess.plans.getPlansByFrequency(billingFrequency, includeInactive, sortBy, sortOrder);
    } catch (error) {
      logger.error('Error in getPlansByFrequency:', error);
      throw error;
    }
  }

  /**
   * Get plan by ID
   * @param {number} planId - The plan ID
   * @returns {Promise<Object>} - The plan or null if not found
   */
  async getPlanById(planId) {
    try {
      logger.info('Getting plan by ID:', { planId });
      
      if (!planId) {
        throw new Error('Plan ID is required');
      }
      
      return await this.dataAccess.plans.getPlanById(planId);
    } catch (error) {
      logger.error('Error in getPlanById:', error);
      throw error;
    }
  }
}

module.exports = PlanService; 