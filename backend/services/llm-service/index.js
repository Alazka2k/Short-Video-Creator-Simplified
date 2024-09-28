const LLMService = require('./llm-service');
const createServer = require('./server');
const logger = require('../../shared/utils/logger');
const config = require('../../shared/utils/config');

class LLMServiceInterface {
  constructor() {
    logger.info('Initializing LLMServiceInterface');
    this.service = new LLMService();
    logger.info('LLMService instance created');
  }

  async initialize() {
    logger.info('LLMServiceInterface initializing');
    // Add any initialization logic here if needed
    logger.info('LLMServiceInterface initialized');
  }

  async loadPromptsFromCsv(csvPath) {
    logger.info(`Loading prompts from CSV: ${csvPath}`);
    return await this.service.loadPromptsFromCsv(csvPath);
  }

  async process(initialPromptFile, parametersFile, inputPrompt) {
    logger.info('Processing LLM request', { initialPromptFile, parametersFile, inputPrompt });
    logger.debug('Current LLM config:', JSON.stringify(config.llm, null, 2));

    const initialPromptPath = config.llm.basePath;
    const parametersPath = config.llm.basePath;

    logger.info('Paths for processing:', { initialPromptPath, parametersPath });

    return await this.service.generateContent(initialPromptPath, parametersPath, initialPromptFile, parametersFile, inputPrompt);
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
    logger.info('Cleaning up LLMServiceInterface');
    // Add any cleanup logic here if needed
  }

  async processAllPrompts(csvPath, initialPromptFile, parametersFile) {
    logger.info('Processing all prompts', { csvPath, initialPromptFile, parametersFile });
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