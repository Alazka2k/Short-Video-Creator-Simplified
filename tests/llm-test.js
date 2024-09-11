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
    const outputDir = path.join(__dirname, 'test_output', 'llm');

    logger.info('Input CSV Path:', inputCsvPath);
    logger.info('Parameters JSON Path:', parametersJsonPath);
    logger.info('Initial Prompt Path:', initialPromptPath);
    logger.info('Output Directory:', outputDir);

    // Load and modify parameters
    const parameters = await PromptUtils.loadParameters(parametersJsonPath);
    parameters.sceneAmount = "2"; // Override scene amount for test
    await fs.writeFile(parametersJsonPath, JSON.stringify(parameters, null, 2));

    const prompts = await PromptUtils.readCsvFile(inputCsvPath);
    
    // Ensure output directory exists
    await fs.mkdir(outputDir, { recursive: true });

    for (const [index, promptToTest] of prompts.entries()) {
      logger.info(`Generating content for prompt ${index + 1}:`, promptToTest);
      const content = await generateContent(initialPromptPath, parametersJsonPath, promptToTest);

      logger.info(`Generated content structure for prompt ${index + 1}:`, JSON.stringify(content, null, 2));

      // Basic validation of the generated content
      if (content && content.scenes) {
        logger.info(`Content generated successfully for prompt ${index + 1}`);
        logger.info('Title:', content.title);
        logger.info('Number of scenes:', content.scenes.length);
      } else {
        logger.warn(`Generated content for prompt ${index + 1} does not match expected structure`);
      }

      // Save the output to a JSON file
      const outputPath = path.join(outputDir, `output_test_${index + 1}.json`);
      await fs.writeFile(outputPath, JSON.stringify(content, null, 2));
      logger.info(`Output for prompt ${index + 1} saved to ${outputPath}`);
    }

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