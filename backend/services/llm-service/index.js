const LLMService = require('./llm-service');

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

  async process(initialPromptPath, parametersPath, inputPrompt) {
    return await this.service.generateContent(initialPromptPath, parametersPath, inputPrompt);
  }

  async saveOutput(output, fileName, isTest = false) {
    return await this.service.saveOutputToJson(output, fileName, isTest);
  }

  async cleanup() {
    // Add any cleanup logic here if needed
  }

  // This method can be used to process all prompts from a CSV file
  async processAllPrompts(csvPath, initialPromptPath, parametersPath) {
    const prompts = await this.loadPromptsFromCsv(csvPath);
    const results = [];

    for (const prompt of prompts) {
      const result = await this.process(initialPromptPath, parametersPath, prompt);
      results.push(result);
    }

    return results;
  }
}

module.exports = new LLMServiceInterface();