const config = require('../utils/config');
const logger = require('../utils/logger');
const { parseCSV } = require('../services/csv-parser');
const { loadParameters, loadInitialPrompt } = require('../utils/input-loader');
const { generateContent } = require('../services/llm-service');
const voiceGenService = require('../services/voice-gen-service');
// We'll add image generation import here later

async function runContentPipeline() {
  try {
    logger.info('Starting content pipeline');
    
    const parameters = await loadParameters();
    const initialPrompt = await loadInitialPrompt();
    const inputData = await parseCSV();
    logger.info(`Parsed ${inputData.length} rows from CSV`);

    for (const [index, row] of inputData.entries()) {
      logger.info(`Processing row: ${JSON.stringify(row)}`);
      
      const content = await generateContent(initialPrompt, parameters, row.Prompt);
      logger.info(`Generated content for prompt: ${row.Prompt}`);
      
      // Generate voice for each scene
      await generateVoiceForScenes(content, index, parameters.voiceGen);

      // TODO: Generate images for each scene
      // await generateImagesForScenes(content, index, parameters.imageGen);

      // Log the generated content for verification
      logger.info(`Generated content for ${row.Prompt}:`, JSON.stringify(content, null, 2));
    }

    logger.info('Content pipeline completed successfully');
  } catch (error) {
    logger.error('Error in content pipeline:', error);
  }
}

async function generateVoiceForScenes(content, videoIndex, voiceGenParams) {
  const scenes = [content.opening_scene, ...content.scenes, content.closing_scene];
  for (const [sceneIndex, scene] of scenes.entries()) {
    const fileName = `video${videoIndex + 1}_scene${sceneIndex + 1}.mp3`;
    await voiceGenService.generateVoice(
      scene.description, 
      fileName, 
      voiceGenParams.defaultVoiceId
    );
  }
}

// We'll implement this function later
// async function generateImagesForScenes(content, videoIndex, imageGenParams) {
//   // Implementation for image generation
// }

module.exports = { runContentPipeline };