/**
 * Plan Service
 * 
 * This service handles plan-related functionality including:
 * - Retrieving all plans
 * - Getting plans by frequency
 * - Getting plan by ID
 * - Creating new plans
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
   * @param {string} status - Filter by status ('active' or 'inactive')
   * @returns {Promise<Array>} - List of subscription plans
   */
  async getAllPlans(includeInactive = false, sortBy = 'monthly_price', sortOrder = 'asc', status = null) {
    try {
      logger.info('Getting all plans:', { includeInactive, sortBy, sortOrder, status });
      return await this.dataAccess.plans.getAllPlans(includeInactive, sortBy, sortOrder, status);
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
   * @param {string} status - Filter by status ('active' or 'inactive')
   * @returns {Promise<Array>} - List of subscription plans with the specified billing frequency
   */
  async getPlansByFrequency(billingFrequency, includeInactive = false, sortBy = 'monthly_price', sortOrder = 'asc', status = null) {
    try {
      logger.info('Getting plans by frequency:', { billingFrequency, includeInactive, sortBy, sortOrder, status });
      
      if (!billingFrequency) {
        throw new Error('Billing frequency is required');
      }
      
      if (!['monthly', 'yearly'].includes(billingFrequency)) {
        throw new Error('Invalid billing frequency. Must be "monthly" or "yearly"');
      }
      
      return await this.dataAccess.plans.getPlansByFrequency(billingFrequency, includeInactive, sortBy, sortOrder, status);
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

  /**
   * Create a new plan
   * @param {Object} planData - The plan data
   * @returns {Promise<Object>} - The created plan
   */
  async createPlan(planData) {
    try {
      logger.info('Creating new plan:', planData);
      
      // Create the plan
      const plan = await this.dataAccess.plans.createPlan(planData);
      
      logger.info('Plan created successfully:', { 
        planId: plan.plan_id,
        planName: plan.plan_name
      });
      
      return plan;
    } catch (error) {
      logger.error('Error creating plan:', error);
      throw error;
    }
  }
}

module.exports = PlanService; 