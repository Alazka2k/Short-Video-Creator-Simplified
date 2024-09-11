const fs = require('fs').promises;
const path = require('path');
const { parse } = require('csv-parse/sync');
const logger = require('./logger');

class PromptUtils {
  static async loadParameters(filePath) {
    try {
      const rawData = await fs.readFile(filePath, 'utf8');
      const params = JSON.parse(rawData);
      logger.info(`Parameters loaded from ${filePath}`);
      return params;
    } catch (error) {
      logger.error(`Error loading parameters from ${filePath}:`, error);
      throw error;
    }
  }

  static replacePlaceholders(prompt, params) {
    logger.info('Replacing placeholders in prompt');
    for (const [key, value] of Object.entries(params)) {
      const placeholder = `{{ ${key} }}`;
      if (prompt.includes(placeholder)) {
        prompt = prompt.replace(new RegExp(placeholder, 'g'), String(value));
        logger.info(`Replaced placeholder ${placeholder} with value: ${value}`);
      } else {
        logger.warn(`Placeholder ${placeholder} not found in the prompt.`);
      }
    }
    return prompt;
  }

  static async generateDynamicPrompt(promptFilePath, params) {
    try {
      logger.info(`Generating dynamic prompt from ${promptFilePath}`);
      const initialPrompt = await fs.readFile(promptFilePath, 'utf8');
      logger.info('Initial prompt loaded');
      const dynamicPrompt = this.replacePlaceholders(initialPrompt, params);
      logger.info('Dynamic prompt generated');
      return dynamicPrompt;
    } catch (error) {
      logger.error(`Error generating dynamic prompt from ${promptFilePath}:`, error);
      throw error;
    }
  }

  static async readCsvFile(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const records = parse(content, {
        columns: true,
        skip_empty_lines: true
      });
      const prompts = records.map(record => record.Prompt.trim());
      logger.info(`Read ${prompts.length} prompts from ${filePath}`);
      return prompts;
    } catch (error) {
      logger.error(`Error reading CSV file ${filePath}:`, error);
      throw error;
    }
  }

  static async saveOutputToJson(output, outputDir, fileName) {
    try {
      const outputPath = path.join(outputDir, fileName);
      await fs.writeFile(outputPath, JSON.stringify(output, null, 2));
      logger.info(`Output saved to ${outputPath}`);
    } catch (error) {
      logger.error(`Error saving output to ${fileName}:`, error);
      throw error;
    }
  }
}

module.exports = PromptUtils;