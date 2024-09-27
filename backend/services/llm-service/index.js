const LLMService = require('./llm-service');
const createServer = require('./server');
const logger = require('../../shared/utils/logger');
const config = require('../../shared/utils/config');

class LLMServiceInterface {
  constructor() {
    this.service = new LLMService();
  }

  async initialize() {
    // Add any initialization logic here if needed
  }

  async loadPromptsFromCsv(csvPath) {
    return await this.service.loadPromptsFromCsv(csvPath);
  }

  async process(initialPromptFile, parametersFile, inputPrompt) {
    const initialPromptPath = config.llm.basePath.initialPrompt;
    const parametersPath = config.llm.basePath.parameters;
    return await this.service.generateContent(initialPromptPath, parametersPath, initialPromptFile, parametersFile, inputPrompt);
  }

  async generateDocContent(prompt) {
    return await this.service.generateDocContent(prompt);
  }

  async saveOutput(output, fileName, isTest = false) {
    return await this.service.saveOutputToJson(output, fileName, isTest);
  }

  async cleanup() {
    // Add any cleanup logic here if needed
  }

  async processAllPrompts(csvPath, initialPromptFile, parametersFile) {
    const prompts = await this.loadPromptsFromCsv(csvPath);
    const results = [];

    for (const prompt of prompts) {
      const result = await this.process(initialPromptFile, parametersFile, prompt);
      results.push(result);
    }

    return results;
  }

  startServer() {
    const PORT = process.env.LLM_SERVICE_PORT || 3001;
    const app = createServer(this);
    
    // Add request logging
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

// Start the server if this file is run directly
if (require.main === module) {
  llmServiceInterface.startServer();
}

module.exports = llmServiceInterface;