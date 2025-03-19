/**
 * Plans Data Access Layer
 * 
 * This module provides methods for interacting with subscription plans in the database.
 * It handles CRUD operations for plans, including retrieving, updating, and formatting plan data.
 * 
 * The plans table stores the different subscription tiers available to users, including
 * pricing information, token allocations, and feature entitlements for each plan.
 */

const knex = require('knex')(require('../../../../knexfile')[process.env.NODE_ENV || 'development']);
const logger = require('../../../shared/utils/logger');
const config = require('../../../shared/utils/config');
const path = require('path');
const fs = require('fs').promises;

class PlansDataAccess {
  constructor() {
    this.tableName = 'plans';
    this.logger = logger;
  }

  /**
   * Get all active subscription plans
   * @param {boolean} includeInactive - Whether to include inactive plans
   * @returns {Promise<Array>} - List of subscription plans
   */
  async getAllPlans(includeInactive = false) {
    try {
      this.logger.info('Fetching all plans:', { includeInactive });
      
      let query = knex(this.tableName);
      
      if (!includeInactive) {
        query = query.where('active', true);
      }
      
      const plans = await query.orderBy('monthly_price', 'asc');
      
      return plans.map(plan => this.formatPlanData(plan));
    } catch (error) {
      this.logger.error('Error fetching plans:', error);
      throw error;
    }
  }
  
  /**
   * Get plans by billing frequency
   * @param {string} billingFrequency - 'monthly' or 'yearly'
   * @param {boolean} includeInactive - Whether to include inactive plans
   * @returns {Promise<Array>} - List of subscription plans with specified billing frequency
   */
  async getPlansByFrequency(billingFrequency, includeInactive = false) {
    try {
      this.logger.info('Fetching plans by frequency:', { billingFrequency, includeInactive });
      
      let query = knex(this.tableName)
        .where('billing_frequency', billingFrequency);
      
      if (!includeInactive) {
        query = query.where('active', true);
      }
      
      const plans = await query.orderBy('price', 'asc');
      
      return plans.map(plan => this.formatPlanData(plan));
    } catch (error) {
      this.logger.error('Error fetching plans by frequency:', error);
      throw error;
    }
  }
  
  /**
   * Get a plan by ID
   * @param {number} planId - The plan ID
   * @returns {Promise<Object|null>} - The plan or null if not found
   */
  async getPlanById(planId) {
    try {
      this.logger.info('Fetching plan by ID:', { planId });
      
      const plan = await knex(this.tableName)
        .where('plan_id', planId)
        .first();
      
      if (!plan) {
        this.logger.warn('Plan not found:', { planId });
        return null;
      }
      
      return this.formatPlanData(plan);
    } catch (error) {
      this.logger.error('Error fetching plan by ID:', error);
      throw error;
    }
  }
  
  /**
   * Get a plan by name and billing frequency
   * @param {string} planName - The plan name
   * @param {string} billingFrequency - The billing frequency ('monthly' or 'yearly')
   * @returns {Promise<Object|null>} - The plan or null if not found
   */
  async getPlanByNameAndFrequency(planName, billingFrequency) {
    try {
      this.logger.info('Fetching plan by name and frequency:', { planName, billingFrequency });
      
      const plan = await knex(this.tableName)
        .where('plan_name', planName)
        .where('billing_frequency', billingFrequency)
        .first();
      
      if (!plan) {
        this.logger.warn('Plan not found:', { planName, billingFrequency });
        return null;
      }
      
      return this.formatPlanData(plan);
    } catch (error) {
      this.logger.error('Error fetching plan by name and frequency:', error);
      throw error;
    }
  }
  
  /**
   * Update a plan
   * @param {number} planId - The plan ID
   * @param {Object} planData - The updated plan data
   * @returns {Promise<Object|null>} - The updated plan or null if not found
   */
  async updatePlan(planId, planData) {
    try {
      this.logger.info('Updating plan:', { planId, planData });
      
      // Prevent updating the plan_id
      delete planData.plan_id;
      
      // Update the updated_at timestamp
      planData.updated_at = knex.fn.now();
      
      const [updatedPlan] = await knex(this.tableName)
        .where('plan_id', planId)
        .update(planData)
        .returning('*');
      
      if (!updatedPlan) {
        this.logger.warn('Plan not found for update:', { planId });
        return null;
      }
      
      this.logger.info('Plan updated successfully:', { planId });
      return this.formatPlanData(updatedPlan);
    } catch (error) {
      this.logger.error('Error updating plan:', error);
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
      this.logger.info('Creating new plan:', planData);
      
      // Set timestamps
      planData.created_at = knex.fn.now();
      planData.updated_at = knex.fn.now();
      
      // Make sure active is set
      if (planData.active === undefined) {
        planData.active = true;
      }
      
      const [newPlan] = await knex(this.tableName)
        .insert(planData)
        .returning('*');
      
      this.logger.info('Plan created successfully:', { planId: newPlan.plan_id });
      return this.formatPlanData(newPlan);
    } catch (error) {
      this.logger.error('Error creating plan:', error);
      throw error;
    }
  }
  
  /**
   * Format plan data by parsing JSON fields
   * @param {Object} plan - The plan data from the database
   * @returns {Object} - The formatted plan data
   */
  formatPlanData(plan) {
    if (!plan) return null;
    
    const formattedPlan = {
      ...plan
    };
    
    // Parse JSON fields
    if (plan.marketing_description) {
      try {
        formattedPlan.marketing_description = JSON.parse(plan.marketing_description);
      } catch (error) {
        this.logger.warn('Error parsing marketing_description JSON:', { planId: plan.plan_id, error: error.message });
      }
    }
    
    if (plan.allowed_content_types) {
      try {
        formattedPlan.allowed_content_types = JSON.parse(plan.allowed_content_types);
      } catch (error) {
        this.logger.warn('Error parsing allowed_content_types JSON:', { planId: plan.plan_id, error: error.message });
      }
    }
    
    if (plan.recreation_content_types) {
      try {
        formattedPlan.recreation_content_types = JSON.parse(plan.recreation_content_types);
      } catch (error) {
        this.logger.warn('Error parsing recreation_content_types JSON:', { planId: plan.plan_id, error: error.message });
      }
    }
    
    // Format dates
    formattedPlan.created_at = plan.created_at ? new Date(plan.created_at).toISOString() : null;
    formattedPlan.updated_at = plan.updated_at ? new Date(plan.updated_at).toISOString() : null;
    
    return formattedPlan;
  }
}

module.exports = new PlansDataAccess(); 