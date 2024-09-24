const LLMService = require('./llm-service');

class LLMServiceInterface {
  constructor() {
    this.service = new LLMService();
  }

  async initialize() {
    // Add any initialization logic here if needed
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
}

module.exports = new LLMServiceInterface();