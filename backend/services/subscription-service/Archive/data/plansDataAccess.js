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
   * Safely parse a JSON string
   * Tries multiple approaches to handle different formats
   */
  safeParseJson(value, fieldName, planId) {
    // Return empty array for null values
    if (!value) {
      return [];
    }
    
    // If it's already an array or object, return it
    if (Array.isArray(value) || typeof value === 'object') {
      return value;
    }
    
    // First try standard JSON parse
    try {
      return JSON.parse(value);
    } catch (error) {
      // First error message, but we'll try other approaches
    }
    
    // If it looks like a comma-separated string, convert to array
    if (typeof value === 'string' && value.includes(',')) {
      try {
        const items = value.split(',').map(item => item.trim());
        return items;
      } catch (error) {
        // Still failed, log and continue
      }
    }
    
    // Final fallback - if it's a string, wrap it in an array
    if (typeof value === 'string') {
      try {
        // Check if it's a stringified array that just needs one more parse
        if (value.startsWith('[') && value.endsWith(']')) {
          const cleanValue = value.replace(/\\"/g, '"'); // Fix escaped quotes
          return JSON.parse(cleanValue);
        } else {
          return [value]; // Single string item as array
        }
      } catch (error) {
        this.logger.warn(`Error parsing ${fieldName} after multiple attempts:`, { 
          planId, 
          value,
          error: error.message 
        });
        return []; // Return empty array as final fallback
      }
    }
    
    this.logger.warn(`Could not parse ${fieldName}:`, { planId, value });
    return []; // Return empty array as final fallback
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
    
    // Parse JSON fields using the safe parser
    if (plan.marketing_description) {
      try {
        formattedPlan.marketing_description = JSON.parse(plan.marketing_description);
      } catch (error) {
        this.logger.warn('Error parsing marketing_description JSON:', { planId: plan.plan_id, error: error.message });
        // Keep original value if parsing fails
      }
    }
    
    // Parse content type fields with robust handling
    formattedPlan.allowed_content_types = this.safeParseJson(
      plan.allowed_content_types, 
      'allowed_content_types',
      plan.plan_id
    );
    
    formattedPlan.recreation_content_types = this.safeParseJson(
      plan.recreation_content_types,
      'recreation_content_types',
      plan.plan_id
    );
    
    // Format dates
    formattedPlan.created_at = plan.created_at ? new Date(plan.created_at).toISOString() : null;
    formattedPlan.updated_at = plan.updated_at ? new Date(plan.updated_at).toISOString() : null;
    
    return formattedPlan;
  }
}

module.exports = new PlansDataAccess(); 