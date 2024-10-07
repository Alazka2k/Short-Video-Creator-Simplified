const path = require('path');
const fs = require('fs').promises;
const llmServiceInterface = require('../backend/services/llm-service');
const logger = require('../backend/shared/utils/logger');
const config = require('../backend/shared/utils/config');

async function runLLMTest() {
  try {
    logger.info('Starting LLM test run');

    const inputCsvPath = config.input.csvPath;
    const parametersJsonPath = path.join(__dirname, '..', 'data', 'input', 'parameters.json');
    const outputDir = path.join(__dirname, 'test_output', 'llm');

    logger.info('Input CSV Path:', inputCsvPath);
    logger.info('Parameters JSON Path:', parametersJsonPath);
    logger.info('Output Directory:', outputDir);

    // Ensure output directory exists
    await fs.mkdir(outputDir, { recursive: true });

    // Initialize the LLMServiceInterface
    await llmServiceInterface.initialize();

    // Load prompts from CSV
    const prompts = await llmServiceInterface.loadPromptsFromCsv(inputCsvPath);

    // Load LLM generation parameters
    const llmGenParams = JSON.parse(await fs.readFile(parametersJsonPath, 'utf8')).llmGen;

    for (const [index, promptToTest] of prompts.entries()) {
      logger.info(`Generating content for prompt ${index + 1}:`, promptToTest);

      // Use the process method from LLMServiceInterface with isTest set to true
      const result = await llmServiceInterface.process(llmGenParams, promptToTest, true);

      logger.info(`Generated content structure for prompt ${index + 1}:`, JSON.stringify(result, null, 2));

      // Save the output to a JSON file
      const outputFileName = `output_test_${index + 1}.json`;
      const outputPath = path.join(outputDir, outputFileName);
      await llmServiceInterface.saveOutput(result, outputFileName, true);
      logger.info(`Output for prompt ${index + 1} saved to ${outputPath}`);
    }

    logger.info('LLM test run completed successfully');

    // Cleanup
    await llmServiceInterface.cleanup();
  } catch (error) {
    logger.error('Error in LLM test run:', error);
    throw error;
  }
}

runLLMTest().catch(error => {
  console.error('LLM test failed:', error);
  process.exit(1);
});