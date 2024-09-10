const path = require('path');
const fs = require('fs').promises;
const { generateContent } = require('../src/services/llm-service');
const logger = require('../src/utils/logger');
const PromptUtils = require('../src/utils/prompt-utils');

async function runLLMTest() {
  try {
    logger.info('Starting LLM test run');

    const inputCsvPath = path.join(__dirname, '..', 'data', 'input', 'input.csv');
    const parametersJsonPath = path.join(__dirname, '..', 'data', 'input', 'parameters.json');
    const initialPromptPath = path.join(__dirname, '..', 'data', 'input', 'initial_prompt.txt');
    const outputPath = path.join(__dirname, 'test_output', 'llm', 'output_test.json');

    logger.info('Input CSV Path:', inputCsvPath);
    logger.info('Parameters JSON Path:', parametersJsonPath);
    logger.info('Initial Prompt Path:', initialPromptPath);
    logger.info('Output Path:', outputPath);

    // Load and modify parameters
    const parameters = JSON.parse(await fs.readFile(parametersJsonPath, 'utf8'));
    parameters.sceneAmount = "3"; // Override scene amount for test
    await fs.writeFile(parametersJsonPath, JSON.stringify(parameters, null, 2));

    const prompts = await PromptUtils.readCsvFile(inputCsvPath);
    
    // Only test the first prompt
    const promptToTest = prompts[0];

    logger.info('Generating content for prompt:', promptToTest);
    const content = await generateContent(initialPromptPath, parametersJsonPath, promptToTest);

    logger.info('Generated content structure:', JSON.stringify(content, null, 2));

    // Basic validation of the generated content
    if (content && content.scenes) {
      logger.info('Content generated successfully');
      logger.info('Title:', content.title);
      logger.info('Number of scenes:', content.scenes.length);
    } else {
      logger.warn('Generated content does not match expected structure');
    }

    // Save the output to a JSON file
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, JSON.stringify(content, null, 2));
    logger.info(`Output saved to ${outputPath}`);

    logger.info('LLM test run completed successfully');
  } catch (error) {
    logger.error('Error in LLM test run:', error);
    throw error;
  }
}

runLLMTest().catch(error => {
  console.error('LLM test failed:', error);
  process.exit(1);
});