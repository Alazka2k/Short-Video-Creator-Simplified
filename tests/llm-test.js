const path = require('path');
const fs = require('fs').promises;
const { generateContent } = require('../src/services/llm-service');
const logger = require('../src/utils/logger');
const PromptUtils = require('../src/utils/prompt-utils');
const config = require('../src/utils/config');

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

    // Load parameters
    const parameters = await PromptUtils.loadParameters(parametersJsonPath);
    logger.info('Loaded parameters:', JSON.stringify(parameters, null, 2));

    // Read prompts from CSV
    const prompts = await PromptUtils.readCsvFile(inputCsvPath);
    
    // Ensure output directory exists
    await fs.mkdir(outputDir, { recursive: true });

    for (const [index, promptToTest] of prompts.entries()) {
      logger.info(`Generating content for prompt ${index + 1}:`, promptToTest);
      const content = await generateContent(initialPromptPath, parametersJsonPath, promptToTest);

      logger.info(`Generated content structure for prompt ${index + 1}:`, JSON.stringify(content, null, 2));

      // Basic validation of the generated content
      if (content && content.scenes && content.music) {
        logger.info(`Content generated successfully for prompt ${index + 1}`);
        logger.info('Title:', content.title);
        logger.info('Number of scenes:', content.scenes.length);
        logger.info('Music title:', content.music.title);

        // Additional checks
        if (content.scenes.length !== parseInt(parameters.llmGen.sceneAmount)) {
          logger.warn(`Number of generated scenes (${content.scenes.length}) doesn't match the specified scene amount (${parameters.llmGen.sceneAmount})`);
        }

        // Check if each scene has a description and visual_prompt
        content.scenes.forEach((scene, sceneIndex) => {
          if (!scene.description || !scene.visual_prompt) {
            logger.warn(`Scene ${sceneIndex + 1} is missing description or visual_prompt`);
          }
        });

        // Check if music has all required fields
        if (!content.music.title || !content.music.lyrics || !content.music.style) {
          logger.warn('Music is missing one or more required fields (title, lyrics, style)');
        }
      } else {
        logger.warn(`Generated content for prompt ${index + 1} does not match expected structure`);
      }

      // Save the output to a JSON file
      const outputPath = path.join(outputDir, `output_test_${index + 1}.json`);
      await PromptUtils.saveOutputToJson(content, outputDir, `output_test_${index + 1}.json`);
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