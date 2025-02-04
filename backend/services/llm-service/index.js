const LLMService = require('./llm-service');
const createServer = require('./server');
const logger = require('../../shared/utils/logger');
const config = require('../../shared/utils/config');
const path = require('path');
const fs = require('fs').promises;
require('dotenv').config();

class LLMServiceInterface {
  constructor() {
    this.llmService = null;
  }

  async initialize() {
    logger.info('Initializing LLM Service Interface');
    this.llmService = new LLMService();
    logger.info('LLM Service Interface initialized');
  }

  async process(llmGenParams, inputPrompt, isTest = false, providedJobId = null) {
    try {
      if (!this.llmService) {
        throw new Error('LLM Service not initialized');
      }

      // In standalone mode (no providedJobId), generate content normally
      // In pipeline mode (with providedJobId), use the provided jobId
      const result = await this.llmService.generateContent(
        inputPrompt,
        llmGenParams,
        isTest,
        providedJobId
      );

      return result;
    } catch (error) {
      logger.error('Error in LLM Service Interface:', error);
      throw error;
    }
  }

  async loadPromptsFromCsv(csvPath) {
    logger.info(`Loading prompts from CSV: ${csvPath}`);
    return await this.llmService.loadPromptsFromCsv(csvPath);
  }

  async generateDocContent(prompt) {
    logger.info('Generating doc content', { prompt });
    if (!this.llmService) {
      throw new Error('LLM Service not initialized');
    }
    return await this.llmService.generateDocContent(prompt);
  }

  async saveOutput(output, fileName, isTest = false) {
    logger.info('Saving output', { fileName, isTest });
    return await this.service.saveOutputToJson(output, fileName, isTest);
  }

  async cleanup() {
    logger.info('Cleaning up LLM Service Interface');
    // Add any cleanup logic if needed
  }

  async processAllPrompts(csvPath, llmGenParams) {
    logger.info('Processing all prompts', { csvPath, llmGenParams });
    if (!this.llmService) {
      throw new Error('LLM Service not initialized');
    }
    const prompts = await this.llmService.loadPromptsFromCsv(csvPath);
    const results = [];

    for (const prompt of prompts) {
      const result = await this.process(llmGenParams, prompt);
      results.push(result);
    }

    return results;
  }

  startServer() {
    const env = process.env.NODE_ENV || 'development';
    const envPrefix = env.toUpperCase();
    
    // Get port from environment variables based on environment
    const port = process.env.PORT || 3001;

    const app = createServer(this);
    
    app.use((req, res, next) => {
      logger.info(`Received ${req.method} request on ${req.path}`, {
        environment: env,
        serviceUrl: process.env[`${envPrefix}_LLM_SERVICE_URL`]
      });
      next();
    });

    app.listen(port, () => {
      logger.info(`LLM Service running in ${env} environment`, {
        port,
        serviceUrl: process.env[`${envPrefix}_LLM_SERVICE_URL`]
      });
    });
  }
}

// Create and export a singleton instance
const llmServiceInterface = new LLMServiceInterface();

// Initialize and start the server if this is the main module
if (require.main === module) {
  llmServiceInterface.initialize()
    .then(() => {
      llmServiceInterface.startServer();
    })
    .catch(error => {
      logger.error('Failed to initialize LLM Service:', error);
      process.exit(1);
    });
}

module.exports = llmServiceInterface;