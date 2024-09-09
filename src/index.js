const path = require('path');
const { generateContent } = require('./services/llm-service');
const logger = require('./utils/logger');
const PromptUtils = require('./utils/prompt-utils');

async function runTest() {
  try {
    logger.info('Starting test run');

    const inputCsvPath = path.join(__dirname, '..', 'data', 'input', 'input.csv');
    const parametersJsonPath = path.join(__dirname, '..', 'data', 'input', 'parameters.json');
    const initialPromptPath = path.join(__dirname, '..', 'data', 'input', 'initial_prompt.txt');

    logger.info('Input CSV Path:', inputCsvPath);
    logger.info('Parameters JSON Path:', parametersJsonPath);
    logger.info('Initial Prompt Path:', initialPromptPath);

    const prompts = await PromptUtils.readCsvFile(inputCsvPath);
    
    for (const prompt of prompts) {
      logger.info('Generating content for prompt:', prompt);
      const content = await generateContent(initialPromptPath, parametersJsonPath, prompt);
      logger.info('Generated content structure:', JSON.stringify(content, null, 2));
    }

    logger.info('Test run completed successfully');
  } catch (error) {
    logger.error('Error in test run:', error);
  }
}

runTest();