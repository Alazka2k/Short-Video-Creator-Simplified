const LLMService = require('./llm-service');
const createServer = require('./server');
const logger = require('../../shared/utils/logger');
const config = require('../../shared/utils/config');
const path = require('path');
const fs = require('fs').promises;

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
    return await this.service.loadPromptsFromCsv(csvPath);
  }

  async generateDocContent(prompt) {
    logger.info('Generating doc content', { prompt });
    return await this.service.generateDocContent(prompt);
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
    const prompts = await this.loadPromptsFromCsv(csvPath);
    const results = [];

    for (const prompt of prompts) {
      const result = await this.process(llmGenParams, prompt);
      results.push(result);
    }

    return results;
  }

  startServer() {
    const PORT = process.env.LLM_SERVICE_PORT || 3001;
    const app = createServer(this);
    
    app.use((req, res, next) => {
      logger.info(`Received ${req.method} request on ${req.path}`);
      next();
    });

    app.listen(PORT, () => {
      logger.info(`LLM Service running on port ${PORT}`);
    });
  }
}

const llmServiceInterface = new LLMServiceInterface();

// Initialize and start the server
if (require.main === module) {
  llmServiceInterface.initialize().then(() => {
    llmServiceInterface.startServer();
  }).catch(error => {
    logger.error('Failed to initialize LLM Service:', error);
    process.exit(1);
  });
}

module.exports = llmServiceInterface;