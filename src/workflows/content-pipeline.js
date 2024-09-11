const config = require('../utils/config');
const logger = require('../utils/logger');
const { parseCSV } = require('../services/csv-parser');
const { loadParameters, loadInitialPrompt } = require('../utils/input-loader');
const { generateContent } = require('../services/llm-service');
const voiceGenService = require('../services/voice-gen-service');
const imageGenService = require('../services/image-gen-service');
const path = require('path');
const fs = require('fs').promises;

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
      
      const outputDir = await createOutputDirectory(row.Prompt);
      
      // Generate voice and image for each scene
      await generateAssetsForScenes(content, outputDir, parameters.voiceGen);

      // Log the generated content for verification
      logger.info(`Generated content for ${row.Prompt}:`, JSON.stringify(content, null, 2));
    }

    logger.info('Content pipeline completed successfully');
  } catch (error) {
    logger.error('Error in content pipeline:', error);
  }
}

async function createOutputDirectory(prompt) {
  const date = new Date().toISOString().split('T')[0];
  const time = new Date().toISOString().split('T')[1].split(':').join('-').split('.')[0];
  const promptSlug = prompt.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 30);
  const outputDir = path.join(config.output.directory, `${date}_${time}`, promptSlug);
  await fs.mkdir(outputDir, { recursive: true });
  return outputDir;
}

async function generateAssetsForScenes(content, outputDir, voiceGenParams) {
  for (const [sceneIndex, scene] of content.scenes.entries()) {
    const sceneNumber = sceneIndex + 1;
    
    // Generate and save audio
    const audioFileName = `${sceneNumber}_audio.mp3`;
    const audioFilePath = path.join(outputDir, audioFileName);
    await voiceGenService.generateVoice(
      scene.description,
      audioFilePath,
      voiceGenParams.defaultVoiceId
    );
    scene.audio_file = audioFileName;

    // Generate and save image
    const imageFileName = `${sceneNumber}_image.png`;
    const imageFilePath = path.join(outputDir, imageFileName);
    const imageResult = await imageGenService.generateImage(scene.visual_prompt);
    const upscaledResult = await imageGenService.upscaleImage(imageResult, 1); // Upscale the first version
    await downloadImage(upscaledResult.uri, imageFilePath);
    scene.image_file = imageFileName;
  }
}

async function downloadImage(url, filePath) {
  const response = await fetch(url);
  const buffer = await response.buffer();
  await fs.writeFile(filePath, buffer);
  logger.info(`Image downloaded and saved to ${filePath}`);
}

module.exports = { runContentPipeline };