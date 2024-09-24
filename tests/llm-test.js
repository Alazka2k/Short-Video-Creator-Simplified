const path = require('path');
const fs = require('fs').promises;
const LLMService = require('../backend/services/llm-service');
const logger = require('../backend/shared/utils/logger');
const config = require('../backend/shared/utils/config');

async function runLLMTest() {
  try {
    logger.info('Starting LLM test run');

    const llmService = new LLMService();

    const inputCsvPath = config.input.csvPath;
    const parametersJsonPath = config.parameters.jsonPath;
    const initialPromptPath = config.initialPrompt.txtPath;
    const outputDir = path.join(__dirname, 'test_output', 'llm');

    logger.info('Input CSV Path:', inputCsvPath);
    logger.info('Parameters JSON Path:', parametersJsonPath);
    logger.info('Initial Prompt Path:', initialPromptPath);
    logger.info('Output Directory:', outputDir);

    // Ensure output directory exists
    await fs.mkdir(outputDir, { recursive: true });

    // Read prompts from CSV
    const promptsContent = await fs.readFile(inputCsvPath, 'utf8');
    const prompts = promptsContent.split('\n').filter(line => line.trim() !== '').slice(1);

    for (const [index, promptToTest] of prompts.entries()) {
      logger.info(`Generating content for prompt ${index + 1}:`, promptToTest);
      const content = await llmService.generateContent(initialPromptPath, parametersJsonPath, promptToTest);

      logger.info(`Generated content structure for prompt ${index + 1}:`, JSON.stringify(content, null, 2));

      // Save the output to a JSON file
      const outputFileName = `output_test_${index + 1}.json`;
      const savedPath = await llmService.saveOutputToJson(content, outputFileName, true);
      logger.info(`Output for prompt ${index + 1} saved to ${savedPath}`);
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