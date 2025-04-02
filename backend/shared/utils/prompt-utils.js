const fs = require('fs').promises;
const path = require('path');
const { parse } = require('csv-parse/sync');
const logger = require('./logger');

class PromptUtils {
  static async loadInitialPrompt(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      logger.info(`Initial prompt loaded from ${filePath}`);
      return content;
    } catch (error) {
      logger.error(`Error loading initial prompt from ${filePath}:`, error);
      throw error;
    }
  }

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
    const flattenedParams = this.flattenObject(params);
    let modifiedPrompt = prompt;

    // Parameter mappings with their prefixes and commands
    const paramMappings = {
      // Image parameters
      'llmGen.image.artistStyle': { prefix: 'in the style of', command: null },
      'llmGen.image.shotStyle': { prefix: null, command: null },
      'llmGen.image.aspectRatio': { prefix: null, command: '--ar' },
      'llmGen.image.style': { prefix: null, command: '--style' },
      'llmGen.image.sValue': { prefix: null, command: '--s' },
      
      // Script parameters
      'llmGen.script.scriptTone': { prefix: '-', command: null },
      'llmGen.script.vocabulary': { prefix: '-', command: null },
      'llmGen.script.pacingStructure': { prefix: '-', command: null },
      'llmGen.script.characterPerspective': { prefix: '-', command: null },

      // Optional general parameters
      'llmGen.general.generalDescription': { prefix: '-', command: null }
    };

    // Process each parameter
    for (const [key, value] of Object.entries(flattenedParams)) {
      const placeholder = `{{ ${key} }}`;
      
      // If this is a mapped parameter (optional)
      if (paramMappings[key]) {
        if (!value || value === '') {
          // Remove the placeholder and its associated prefix/command
          modifiedPrompt = this.removeParameter(
            modifiedPrompt, 
            placeholder, 
            paramMappings[key]
          );
          logger.info(`Removed parameter ${key} and its prefix/command from prompt`);
        } else {
          // Replace the placeholder with the value
          modifiedPrompt = modifiedPrompt.replace(
            new RegExp(placeholder, 'g'), 
            String(value)
          );
          //logger.info(`Replaced placeholder ${placeholder} with value: ${value}`);
        }
      } else {
        // Handle required parameters normally
        if (modifiedPrompt.includes(placeholder)) {
          modifiedPrompt = modifiedPrompt.replace(
            new RegExp(placeholder, 'g'), 
            String(value)
          );
          //logger.info(`Replaced placeholder ${placeholder} with value: ${value}`);
        } else {
          logger.debug(`Placeholder ${placeholder} not found in the prompt.`);
        }
      }
    }

    // Clean up any remaining mapped parameters
    for (const [key, mapping] of Object.entries(paramMappings)) {
      const placeholder = `{{ ${key} }}`;
      if (modifiedPrompt.includes(placeholder)) {
        modifiedPrompt = this.removeParameter(
          modifiedPrompt, 
          placeholder, 
          mapping
        );
        //logger.info(`Cleaned up unused parameter ${key} from prompt`);
      }
    }

    // Clean up empty lines and multiple spaces
    modifiedPrompt = modifiedPrompt
      .split('\n')
      .filter(line => line.trim() !== '')
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/  +/g, ' ');

    return modifiedPrompt;
  }

  static removeParameter(prompt, placeholder, mapping) {
    let modifiedPrompt = prompt;

    // Remove the placeholder and its prefix if exists
    if (mapping.prefix) {
      // Handle bullet point style prefixes
      if (mapping.prefix === '-') {
        const bulletPattern = new RegExp(`^\\s*${mapping.prefix}\\s*${placeholder}\\s*$\\n?`, 'gm');
        modifiedPrompt = modifiedPrompt.replace(bulletPattern, '');
      } else {
        const prefixPattern = new RegExp(`${mapping.prefix}\\s*${placeholder}[,.]?\\s*`, 'g');
        modifiedPrompt = modifiedPrompt.replace(prefixPattern, '');
      }
    } else {
      modifiedPrompt = modifiedPrompt.replace(new RegExp(`${placeholder}[,.]?\\s*`, 'g'), '');
    }

    // Remove the command if exists, but only if it's a standalone command
    if (mapping.command) {
      const commandPattern = new RegExp(`\\s*${mapping.command}\\s+[^;\\n]+`, 'g');
      modifiedPrompt = modifiedPrompt.replace(commandPattern, '');
    }

    return modifiedPrompt;
  }

  static flattenObject(obj, prefix = '') {
    return Object.keys(obj).reduce((acc, k) => {
      const pre = prefix.length ? `${prefix}.` : '';
      if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
        Object.assign(acc, this.flattenObject(obj[k], `${pre}${k}`));
      } else {
        acc[`${pre}${k}`] = obj[k];
      }
      return acc;
    }, {});
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

  static async saveOutputToJson(output, outputPath) {
    try {
      await fs.writeFile(outputPath, JSON.stringify(output, null, 2));
      logger.info(`Output saved to ${outputPath}`);
    } catch (error) {
      logger.error(`Error saving output to ${outputPath}:`, error);
      throw error;
    }
  }
}

module.exports = PromptUtils;