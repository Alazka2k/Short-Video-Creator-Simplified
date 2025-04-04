/**
 * Plan Controller
 * 
 * This controller handles HTTP requests for plan-related endpoints:
 * - GET /plans - List all plans
 * - GET /plans/:planId - Get plan by ID
 * - POST /plans/add - Create a new plan (admin only)
 */

const logger = require('../../../shared/utils/logger');

class PlanController {
  constructor(planService) {
    this.planService = planService;
    logger.info('PlanController initialized');
  }

  /**
   * Get all plans or plans filtered by billing frequency
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getPlans(req, res) {
    try {
      const { billingFrequency, includeInactive, sortBy, sortOrder, status } = req.query;
      let plans;
      
      logger.info('Getting plans with filters:', { 
        billingFrequency, 
        includeInactive: includeInactive === 'true',
        sortBy,
        sortOrder,
        status
      });
      
      // Validate status parameter if provided
      if (status && !['active', 'inactive'].includes(status)) {
        return res.status(400).json({ 
          error: 'Bad Request', 
          message: 'Status parameter must be either "active" or "inactive"' 
        });
      }
      
      if (billingFrequency) {
        plans = await this.planService.getPlansByFrequency(
          billingFrequency, 
          includeInactive === 'true',
          sortBy || 'monthly_price',
          sortOrder || 'asc',
          status
        );
      } else {
        plans = await this.planService.getAllPlans(
          includeInactive === 'true',
          sortBy || 'monthly_price',
          sortOrder || 'asc',
          status
        );
      }
      
      res.json(plans);
    } catch (error) {
      logger.error('Error fetching plans:', error);
      res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  }

  /**
   * Get plan by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getPlanById(req, res) {
    try {
      const { planId } = req.params;
      const plan = await this.planService.getPlanById(planId);
      
      if (!plan) {
        return res.status(404).json({ error: 'Plan not found' });
      }
      
      res.json(plan);
    } catch (error) {
      logger.error('Error fetching plan:', error);
      res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  }

  /**
   * Create a new plan
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async createPlan(req, res) {
    try {
      const planData = req.body;
      
      // Validate required fields
      const requiredFields = [
        'tier_id',
        'monthly_price',
        'recreation_enabled',
        'allowed_content_types',
        'support_level',
        'annual_price',
        'billing_frequency',
        'price',
        'monthly_token_allocation',
        'plan_name'
      ];
      
      const missingFields = requiredFields.filter(field => !(field in planData));
      if (missingFields.length > 0) {
        return res.status(400).json({ 
          error: 'Bad Request', 
          message: `Missing required fields: ${missingFields.join(', ')}` 
        });
      }
      
      // Validate support_level
      if (!['community', 'email_24h'].includes(planData.support_level)) {
        return res.status(400).json({ 
          error: 'Bad Request', 
          message: 'support_level must be either "community" or "email_24h"' 
        });
      }
      
      // Validate billing_frequency
      if (!['monthly', 'yearly'].includes(planData.billing_frequency)) {
        return res.status(400).json({ 
          error: 'Bad Request', 
          message: 'billing_frequency must be either "monthly" or "yearly"' 
        });
      }
      
      // Validate video_quality if provided
      if (planData.video_quality && !['540p', '720p', '1080p'].includes(planData.video_quality)) {
        return res.status(400).json({ 
          error: 'Bad Request', 
          message: 'video_quality must be either "540p", "720p", or "1080p"' 
        });
      }
      
      // Set default values for optional fields
      planData.recreation_content_types = planData.recreation_content_types || [];
      planData.script_settings_enabled = planData.script_settings_enabled !== false;
      planData.has_watermark = planData.has_watermark || false;
      
      // Create the plan
      const plan = await this.planService.createPlan(planData);
      
      res.status(201).json({
        success: true,
        data: plan
      });
    } catch (error) {
      logger.error('Error creating plan:', error);
      res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  }
}

module.exports = PlanController;