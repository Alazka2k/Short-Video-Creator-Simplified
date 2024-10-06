const LLMService = require('./llm-service');
const createServer = require('./server');
const logger = require('../../shared/utils/logger');
const config = require('../../shared/utils/config');
const path = require('path');
const fs = require('fs').promises;

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

  async generateContent(initialPromptPath, llmGenParams, inputPrompt, jobId) {
    logger.info('Generating content', { initialPromptPath, llmGenParams, inputPrompt, jobId });
    
    try {
      // Check if the file exists before proceeding
      await fs.access(initialPromptPath);
    } catch (error) {
      logger.error(`Initial prompt file not found: ${initialPromptPath}`);
      throw new Error(`Initial prompt file not found: ${initialPromptPath}`);
    }

    const content = await this.service.generateContent(initialPromptPath, llmGenParams, inputPrompt, jobId);
    
    // Create output directory
    const currentDate = new Date();
    const dateString = currentDate.toISOString().split('T')[0];
    const timeString = currentDate.toTimeString().split(' ')[0].replace(/:/g, '-');
    const outputDir = path.join(config.output.directory, 'llm', `${dateString}_${timeString}`, 'prompt_1');
    await fs.mkdir(outputDir, { recursive: true });

    // Save content to JSON file
    const outputPath = path.join(outputDir, 'llm_output.json');
    await fs.writeFile(outputPath, JSON.stringify(content, null, 2));
    
    logger.info(`LLM output saved to ${outputPath}`);

    return {
      content: content,
      outputPath: outputPath
    };
  }

  async process(initialPromptFile, llmGenParams, inputPrompt, jobId) {
    logger.info('Processing LLM request', { initialPromptFile, llmGenParams, inputPrompt, jobId });
    logger.debug('Current LLM config:', JSON.stringify(config.llm, null, 2));

    const initialPromptPath = path.join(config.llm.basePath, initialPromptFile);
    logger.info('Constructed initial prompt path:', initialPromptPath);

    try {
      // Check if the file exists before proceeding
      await fs.access(initialPromptPath);
      logger.info('Initial prompt file found');
    } catch (error) {
      logger.error(`Initial prompt file not found: ${initialPromptPath}`);
      throw new Error(`Initial prompt file not found: ${initialPromptPath}`);
    }

    return await this.generateContent(initialPromptPath, llmGenParams, inputPrompt, jobId);
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

  async processAllPrompts(csvPath, initialPromptFile, llmGenParams) {
    logger.info('Processing all prompts', { csvPath, initialPromptFile, llmGenParams });
    const prompts = await this.loadPromptsFromCsv(csvPath);
    const results = [];

    for (const prompt of prompts) {
      const result = await this.process(initialPromptFile, llmGenParams, prompt);
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