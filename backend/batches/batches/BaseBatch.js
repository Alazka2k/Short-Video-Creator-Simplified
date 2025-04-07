/**
 * Base Batch Class
 * 
 * This is the base class for all batch jobs in the system.
 * It provides common functionality and interface that all batch jobs must implement.
 */

const logger = require('../../shared/utils/logger');

class BaseBatch {
  constructor() {
    if (this.constructor === BaseBatch) {
      throw new Error('BaseBatch class cannot be instantiated directly');
    }

    if (!this.id) {
      throw new Error('Batch job must have an id');
    }

    if (!this.name) {
      throw new Error('Batch job must have a name');
    }

    if (!this.description) {
      throw new Error('Batch job must have a description');
    }

    if (!this.parameters) {
      this.parameters = {};
    }
  }

  async execute(params = {}, onProgress) {
    throw new Error('execute() method must be implemented by subclass');
  }

  validateParams(params) {
    const requiredParams = Object.entries(this.parameters)
      .filter(([_, config]) => config.required)
      .map(([name]) => name);

    const missingParams = requiredParams.filter(param => !(param in params));
    if (missingParams.length > 0) {
      throw new Error(`Missing required parameters: ${missingParams.join(', ')}`);
    }

    for (const [name, value] of Object.entries(params)) {
      const config = this.parameters[name];
      if (!config) {
        throw new Error(`Unknown parameter: ${name}`);
      }

      if (config.type && typeof value !== config.type) {
        throw new Error(`Parameter ${name} must be of type ${config.type}`);
      }

      if (config.validate && !config.validate(value)) {
        throw new Error(`Invalid value for parameter ${name}`);
      }
    }
  }

  log(level, message, metadata = {}) {
    logger.log(level, `[${this.name}] ${message}`, metadata);
  }

  updateProgress(onProgress, progress) {
    if (onProgress) {
      onProgress(progress);
    }
  }
}

module.exports = BaseBatch; 