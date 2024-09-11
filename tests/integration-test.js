const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');
const puppeteer = require('puppeteer');
const { generateContent } = require('../src/services/llm-service');
const voiceGenService = require('../src/services/voice-gen-service');
const imageGenService = require('../src/services/image-gen-service');
const logger = require('../src/utils/logger');
const PromptUtils = require('../src/utils/prompt-utils');
const config = require('../src/utils/config');

function getRandomVariationUrl(originalUrl) {
  const urlParts = originalUrl.split('/');
  const filename = urlParts[urlParts.length - 1].split('?')[0];
  const match = filename.match(/.*_([a-f0-9-]+)\.png$/);
  if (!match) {
    throw new Error('Unable to extract identifier from URL');
  }
  const identifier = match[1];
  const randomVariation = Math.floor(Math.random() * 4); // 0, 1, 2, or 3
  return `https://cdn.midjourney.com/${identifier}/0_${randomVariation}.png`;
}

async function downloadImageWithPuppeteer(url, outputPath) {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    await page.goto(url, { waitUntil: 'networkidle2' });
    await page.waitForSelector('img');
    
    const viewSource = await page.goto(url);
    const buffer = await viewSource.buffer();
    fsSync.writeFileSync(outputPath, buffer);
    
    logger.info(`Image downloaded successfully to ${outputPath}`);
  } catch (error) {
    logger.error('Error downloading image:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

async function processPrompt(prompt, outputDir, initialPromptPath, parametersJsonPath) {
  logger.info(`Processing prompt: ${prompt}`);

  const content = await generateContent(initialPromptPath, parametersJsonPath, prompt);
  logger.info('Generated content structure:', JSON.stringify(content, null, 2));

  const llmOutputPath = path.join(outputDir, 'llm_output.json');
  await fs.writeFile(llmOutputPath, JSON.stringify(content, null, 2));
  logger.info(`LLM output saved to ${llmOutputPath}`);

  // Process only the first scene
  if (content.scenes.length > 0) {
    const scene = content.scenes[0];
    const sceneDir = path.join(outputDir, 'scene_1');
    await fs.mkdir(sceneDir, { recursive: true });

    // Generate voice
    const voiceFileName = 'voice.mp3';
    const voiceFilePath = path.join(sceneDir, voiceFileName);

    await voiceGenService.generateVoice(
      scene.description,
      voiceFilePath,
      content.prompt,
      1,
      config.parameters.voiceGen.defaultVoiceId
    );

    logger.info(`Voice generated for scene 1: ${voiceFilePath}`);

    // Generate image
    const imageFileName = 'image.png';
    const imageFilePath = path.join(sceneDir, imageFileName);

    const originalImageUrl = await imageGenService.generateImage(scene.visual_prompt);
    logger.info(`Original image URL for scene 1: ${originalImageUrl}`);

    const selectedVariationUrl = getRandomVariationUrl(originalImageUrl);
    logger.info(`Selected variation URL for scene 1: ${selectedVariationUrl}`);

    await downloadImageWithPuppeteer(selectedVariationUrl, imageFilePath);
    logger.info(`Image downloaded for scene 1: ${imageFilePath}`);

    // Save scene metadata
    const sceneMetadata = {
      description: scene.description,
      visual_prompt: scene.visual_prompt,
      voice_file: voiceFileName,
      image_file: imageFileName,
      original_image_url: originalImageUrl,
      selected_variation_url: selectedVariationUrl
    };
    const metadataPath = path.join(sceneDir, 'metadata.json');
    await fs.writeFile(metadataPath, JSON.stringify(sceneMetadata, null, 2));
    logger.info(`Metadata saved for scene 1: ${metadataPath}`);
  } else {
    logger.warn('No scenes generated for this prompt');
  }
}

async function runIntegrationTest() {
  try {
    logger.info('Starting integration test');

    const inputCsvPath = path.join(__dirname, '..', 'data', 'input', 'input.csv');
    const parametersJsonPath = path.join(__dirname, '..', 'data', 'input', 'parameters.json');
    const initialPromptPath = path.join(__dirname, '..', 'data', 'input', 'initial_prompt.txt');
    const baseOutputDir = path.join(__dirname, 'test_output', 'integration');

    await fs.mkdir(baseOutputDir, { recursive: true });

    const prompts = await PromptUtils.readCsvFile(inputCsvPath);
    const parameters = await PromptUtils.loadParameters(parametersJsonPath);

    await imageGenService.init();

    for (const [index, prompt] of prompts.entries()) {
      const promptOutputDir = path.join(baseOutputDir, `prompt_${index + 1}`);
      await fs.mkdir(promptOutputDir, { recursive: true });

      await processPrompt(prompt, promptOutputDir, initialPromptPath, parametersJsonPath);
    }

    logger.info('Integration test completed successfully');
  } catch (error) {
    logger.error('Error in integration test:', error);
    throw error;
  } finally {
    await imageGenService.close();
  }
}

runIntegrationTest().catch(error => {
  console.error('Integration test failed:', error);
  process.exit(1);
});