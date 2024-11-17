const path = require('path');
const fs = require('fs').promises;
const llmServiceInterface = require('../backend/services/llm-service');
const logger = require('../backend/shared/utils/logger');
const config = require('../backend/shared/utils/config');

async function formatLLMOutput(result) {
  // Check if result has the nested video_script structure
  if (result.video_script) {
    const {
      prompt,
      title,
      description,
      hashtags,
      scenes,
      music
    } = result.video_script;

    // Return the flattened structure
    return {
      prompt,
      title,
      description,
      hashtags,
      scenes,
      music
    };
  }

  // If already in the correct format, return as is
  return result;
}

async function saveFormattedOutput(output, outputPath) {
  try {
    await fs.writeFile(outputPath, JSON.stringify(output, null, 2));
    logger.info(`Output saved to ${outputPath}`);
  } catch (error) {
    logger.error('Error saving output:', error);
    throw error;
  }
}

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
      const sceneNumber = index + 1; // Convert to 1-based indexing
      logger.info(`Generating content for prompt ${sceneNumber}:`, promptToTest);

      try {
        // Generate content
        const result = await llmServiceInterface.process(llmGenParams, promptToTest, true);

        if (!result) {
          throw new Error('LLM service returned no result');
        }

        // Format the output
        const formattedOutput = await formatLLMOutput(result);

        logger.info(`Generated content structure for prompt ${sceneNumber}:`, JSON.stringify(formattedOutput, null, 2));

        // Save the formatted output
        const outputFileName = `output_test_${sceneNumber}.json`;
        const outputPath = path.join(outputDir, outputFileName);
        await saveFormattedOutput(formattedOutput, outputPath);
        
        logger.info(`Output for prompt ${sceneNumber} saved to ${outputPath}`);

        // Validate the output structure
        try {
          const savedContent = JSON.parse(await fs.readFile(outputPath, 'utf8'));
          const requiredFields = ['prompt', 'title', 'description', 'hashtags', 'scenes', 'music'];
          
          const missingFields = requiredFields.filter(field => !savedContent[field]);
          if (missingFields.length > 0) {
            logger.warn(`Output for prompt ${sceneNumber} is missing fields: ${missingFields.join(', ')}`);
          }
          
          if (!Array.isArray(savedContent.scenes)) {
            logger.warn(`Output for prompt ${sceneNumber} has invalid scenes structure`);
          }
        } catch (validationError) {
          logger.error(`Error validating output for prompt ${sceneNumber}:`, validationError);
        }

      } catch (error) {
        logger.error(`Error processing prompt ${sceneNumber}:`, error);
        continue; // Continue with next prompt even if one fails
      }
    }

    logger.info('LLM test run completed successfully');

    // Cleanup
    await llmServiceInterface.cleanup();
  } catch (error) {
    logger.error('Error in LLM test run:', error);
    throw error;
  }
}

module.exports = runLLMTest;

if (require.main === module) {
  runLLMTest().catch(error => {
    console.error('LLM test failed:', error);
    process.exit(1);
  });
}