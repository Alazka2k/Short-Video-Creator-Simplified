/**
 * Plan Controller
 * 
 * This controller handles HTTP requests for plan-related endpoints:
 * - GET /plans - List all plans
 * - GET /plans/:planId - Get plan by ID
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
      const { billingFrequency, includeInactive, sortBy, sortOrder } = req.query;
      let plans;
      
      logger.info('Getting plans with filters:', { 
        billingFrequency, 
        includeInactive: includeInactive === 'true',
        sortBy,
        sortOrder
      });
      
      if (billingFrequency) {
        plans = await this.planService.getPlansByFrequency(
          billingFrequency, 
          includeInactive === 'true',
          sortBy || 'monthly_price',
          sortOrder || 'asc'
        );
      } else {
        plans = await this.planService.getAllPlans(
          includeInactive === 'true',
          sortBy || 'monthly_price',
          sortOrder || 'asc'
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
}

module.exports = PlanController;