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
    const initialPromptPath = path.join(__dirname, '..', 'data', 'input', 'initial_prompt.txt');
    const outputDir = path.join(__dirname, 'test_output', 'llm');

    logger.info('Input CSV Path:', inputCsvPath);
    logger.info('Parameters JSON Path:', parametersJsonPath);
    logger.info('Initial Prompt Path:', initialPromptPath);
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
      
      // Generate a dummy jobId for testing purposes
      const dummyJobId = `test_job_${index + 1}`;

      // Use a modified version of the process method that doesn't interact with the database
      const content = await llmServiceInterface.generateContent(
        initialPromptPath,
        llmGenParams,
        promptToTest,
        dummyJobId
      );

      logger.info(`Generated content structure for prompt ${index + 1}:`, JSON.stringify(content, null, 2));

      // Save the output to a JSON file
      const outputFileName = `output_test_${index + 1}.json`;
      const outputPath = path.join(outputDir, outputFileName);
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