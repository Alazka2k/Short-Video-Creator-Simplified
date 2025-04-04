/**
 * Token Calculator Utility
 * 
 * This module provides methods for calculating token costs for different services
 * based on the pricing configuration. It helps ensure consistent token deduction
 * across the application.
 */

const logger = require('../../../shared/utils/logger');
const config = require('../../../shared/utils/config');

class TokenCalculator {
  constructor() {
    // Default token costs per service, can be overridden by config
    this.defaultTokenCosts = {
      llm: 5,           // Fixed per job
      image: 10,         // Per scene
      voice: 5,          // Per scene
      animation: 30,     // Per scene
      video: 50,         // Per scene
      music: 20,         // Complete job
      assembly: 20       // Complete job
    };
    
    // Initialize with default costs
    this.tokenCosts = { ...this.defaultTokenCosts };
    
    // Load custom costs from config if available
    this.initialize();
  }

  /**
   * Initialize the token costs from configuration
   */
  initialize() {
    try {
      // Try to load token costs from config
      if (config.subscription && config.subscription.tokenCosts) {
        this.tokenCosts = {
          ...this.defaultTokenCosts,
          ...config.subscription.tokenCosts
        };
        logger.info('Token costs loaded from configuration');
      }
      
      //logger.info('Token costs initialized:', this.tokenCosts);
    } catch (error) {
      logger.error('Error initializing token costs:', error);
      // Fall back to default costs
      this.tokenCosts = { ...this.defaultTokenCosts };
    }
  }

  /**
   * Calculate token cost for a service
   * @param {string} service - The service name (llm, image, voice, etc.)
   * @param {number} count - The number of items (e.g., number of scenes)
   * @returns {number} - The calculated token cost
   */
  calculateCost(service, count = 1) {
    if (!this.tokenCosts[service]) {
      logger.warn(`Unknown service: ${service}, defaulting to 0 tokens`);
      return 0;
    }
    
    // Some services have fixed costs per job, others scale with count
    const isFixedCost = ['llm', 'music', 'assembly'].includes(service);
    const cost = isFixedCost ? this.tokenCosts[service] : this.tokenCosts[service] * count;
    
    logger.debug(`Token cost for ${service} (count: ${count}): ${cost} tokens`);
    return cost;
  }

  /**
   * Calculate total token cost for a job with multiple services
   * @param {Object} jobData - Data about the job and its components
   * @returns {Object} - Breakdown of token costs by service and total
   */
  calculateJobCost(jobData) {
    try {
      const { sceneCount = 0, services = {} } = jobData;
      const breakdown = {};
      let total = 0;
      
      // Calculate LLM cost (always included)
      breakdown.llm = this.calculateCost('llm');
      total += breakdown.llm;
      
      // Calculate per-scene costs
      for (const service of ['image', 'voice', 'animation', 'video']) {
        if (services[service]) {
          breakdown[service] = this.calculateCost(service, sceneCount);
          total += breakdown[service];
        }
      }
      
      // Calculate fixed job-level costs
      for (const service of ['music', 'assembly']) {
        if (services[service]) {
          breakdown[service] = this.calculateCost(service);
          total += breakdown[service];
        }
      }
      
      logger.info(`Job token cost calculation: ${total} tokens`, { breakdown });
      
      return {
        total,
        breakdown,
        sceneCount
      };
    } catch (error) {
      logger.error('Error calculating job token cost:', error);
      throw error;
    }
  }

  /**
   * Get the token cost for a specific service
   * @param {string} service - The service name
   * @returns {number} - The token cost for the service
   */
  getServiceCost(service) {
    return this.tokenCosts[service] || 0;
  }

  /**
   * Get all token costs
   * @returns {Object} - All token costs by service
   */
  getAllCosts() {
    return { ...this.tokenCosts };
  }

  /**
   * Update token costs (admin function)
   * @param {Object} newCosts - New token costs
   * @returns {Object} - Updated token costs
   */
  updateCosts(newCosts) {
    try {
      this.tokenCosts = {
        ...this.tokenCosts,
        ...newCosts
      };
      
      logger.info('Token costs updated:', this.tokenCosts);
      return this.tokenCosts;
    } catch (error) {
      logger.error('Error updating token costs:', error);
      throw error;
    }
  }

  /**
   * Reset token costs to defaults
   * @returns {Object} - Default token costs
   */
  resetToDefaults() {
    this.tokenCosts = { ...this.defaultTokenCosts };
    logger.info('Token costs reset to defaults');
    return this.tokenCosts;
  }
}

module.exports = new TokenCalculator(); 