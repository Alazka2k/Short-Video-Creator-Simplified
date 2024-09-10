const path = require('path');
const fs = require('fs').promises;
const { generateContent } = require('../src/services/llm-service');
const voiceGenService = require('../src/services/voice-gen-service');
const config = require('../src/utils/config');
const logger = require('../src/utils/logger');
const PromptUtils = require('../src/utils/prompt-utils');

async function runIntegrationTest() {
  try {
    logger.info('Starting integration test');

    // Load test data
    const inputCsvPath = path.join(__dirname, '..', 'data', 'input', 'input.csv');
    const parametersJsonPath = path.join(__dirname, '..', 'data', 'input', 'parameters.json');
    const initialPromptPath = path.join(__dirname, '..', 'data', 'input', 'initial_prompt.txt');

    logger.info('Input CSV Path:', inputCsvPath);
    logger.info('Parameters JSON Path:', parametersJsonPath);
    logger.info('Initial Prompt Path:', initialPromptPath);

    const prompts = await PromptUtils.readCsvFile(inputCsvPath);
    const parameters = await PromptUtils.loadParameters(parametersJsonPath);
    
    // Test with the first prompt
    const testPrompt = prompts[0];
    logger.info('Testing with prompt:', testPrompt);

    // Generate content
    const content = await generateContent(initialPromptPath, parametersJsonPath, testPrompt);
    logger.info('Generated content structure:', JSON.stringify(content, null, 2));

    // Generate voice for each scene
    const scenes = [content.opening_scene, ...content.scenes, content.closing_scene];
    for (const [index, scene] of scenes.entries()) {
      const fileName = `test_scene_${index + 1}.mp3`;
      try {
        const filePath = await voiceGenService.generateVoice(
          scene.description, 
          fileName, 
          parameters.voiceGen.defaultVoiceId
        );

        // Check if the file exists and has content
        const stats = await fs.stat(filePath);
        if (stats.size > 0) {
          logger.info(`Voice file generated successfully: ${filePath}`);
        } else {
          logger.warn(`Generated voice file is empty: ${filePath}`);
        }
      } catch (error) {
        logger.error(`Error generating voice for scene ${index + 1}:`, error);
      }
    }

    logger.info('Integration test completed successfully');
  } catch (error) {
    logger.error('Error in integration test:', error);
    throw error;
  }
}

runIntegrationTest().catch(error => {
  console.error('Integration test failed:', error);
  process.exit(1);
});