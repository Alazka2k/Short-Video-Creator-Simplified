const config = require('../utils/config');
const logger = require('../utils/logger');
const { parseCSV } = require('../services/csv-parser');
const { loadParameters, loadInitialPrompt } = require('../utils/input-loader');
const { generateContent } = require('../services/llm-service');
const voiceGenService = require('../services/voice-gen-service');
const imageGenService = require('../services/image-gen-service');
const musicGenService = require('../services/music-gen-service');
const videoGenService = require('../services/video-gen-service');
const { getTotalAudioDuration } = require('../utils/audio-utils');
const path = require('path');
const fs = require('fs').promises;

async function runContentPipeline() {
  try {
    logger.info('Starting content pipeline');
    
    const parameters = await loadParameters();
    const initialPrompt = await loadInitialPrompt();
    const inputData = await parseCSV();
    logger.info(`Parsed ${inputData.length} rows from CSV`);

    // Initialize Immersity Video Service
    await videoGenService.init();

    for (const [index, row] of inputData.entries()) {
      logger.info(`Processing row: ${JSON.stringify(row)}`);
      
      const content = await generateContent(initialPrompt, parameters, row.Prompt);
      logger.info(`Generated content for prompt: ${row.Prompt}`);
      
      const outputDir = await createOutputDirectory(row.Prompt);
      
      // Generate voice, image, and video for each scene
      await generateAssetsForScenes(content, outputDir, parameters.voiceGen);

      // Calculate total duration of voice audio files
      const totalVoiceDuration = await getTotalAudioDuration(outputDir);
      logger.info(`Total duration of voice audio: ${totalVoiceDuration} seconds`);

      // Generate background music for the entire video
      await generateBackgroundMusic(content, outputDir, totalVoiceDuration);

      // Generate project metadata
      await generateProjectMetadata(content, outputDir, totalVoiceDuration);

      // Log the generated content for verification
      logger.info(`Generated content for ${row.Prompt}:`, JSON.stringify(content, null, 2));
    }

    logger.info('Content pipeline completed successfully');
  } catch (error) {
    logger.error('Error in content pipeline:', error);
  }
}

async function generateAssetsForScenes(content, outputDir, voiceGenParams) {
  for (const [sceneIndex, scene] of content.scenes.entries()) {
    const sceneNumber = sceneIndex + 1;
    const sceneDir = path.join(outputDir, `scene_${sceneNumber}`);
    await fs.mkdir(sceneDir, { recursive: true });
    
    // Generate and save audio
    const audioFileName = `audio.mp3`;
    const audioFilePath = path.join(sceneDir, audioFileName);
    await voiceGenService.generateVoice(
      scene.description,
      audioFilePath,
      voiceGenParams.defaultVoiceId
    );
    scene.audio_file = audioFileName;

    // Generate and save image
    const imageFileName = `image.png`;
    const imageFilePath = path.join(sceneDir, imageFileName);
    const imageResult = await imageGenService.generateImage(scene.visual_prompt);
    const upscaledResult = await imageGenService.upscaleImage(imageResult, 1);
    await downloadImage(upscaledResult.uri, imageFilePath);
    scene.image_file = imageFileName;

    // Generate and save video using Immersity AI
    const videoFileName = `video.mp4`;
    const videoFilePath = path.join(sceneDir, videoFileName);
    await videoGenService.generateVideo(
      imageFilePath,
      videoFilePath,
      { animationLength: config.parameters.videoGen.animationLength }
    );
    scene.video_file = videoFileName;

    // Save scene metadata
    await saveSceneMetadata(scene, sceneDir);
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

async function downloadImage(url, filePath) {
  const response = await fetch(url);
  const buffer = await response.buffer();
  await fs.writeFile(filePath, buffer);
  logger.info(`Image downloaded and saved to ${filePath}`);
}

async function generateBackgroundMusic(content, outputDir, duration) {
  const musicData = content.music;
  const makeInstrumental = config.parameters.musicGen.make_instrumental === "true";
  
  const generationResult = await musicGenService.generateMusic(musicData, {
    makeInstrumental: makeInstrumental,
    duration: duration
  });
  
  logger.info(`Music generation task initiated with ID: ${generationResult.id}`);
  
  const musicInfo = await musicGenService.waitForMusicGeneration(generationResult.id);
  
  const musicFileName = 'background_music.mp3';
  const musicFilePath = path.join(outputDir, musicFileName);
  await musicGenService.downloadMusic(musicInfo.audio_url, musicFilePath);
  logger.info(`Background music generated and saved to ${musicFilePath}`);
}

async function saveSceneMetadata(scene, sceneDir) {
  const metadata = {
    description: scene.description,
    visual_prompt: scene.visual_prompt,
    audio_file: scene.audio_file,
    image_file: scene.image_file,
    video_file: scene.video_file
  };
  const metadataPath = path.join(sceneDir, 'metadata.json');
  await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
  logger.info(`Scene metadata saved to ${metadataPath}`);
}

async function generateProjectMetadata(content, outputDir, totalVoiceDuration) {
  const projectMetadata = {
    prompt: content.prompt,
    title: content.title,
    description: content.description,
    hashtags: content.hashtags,
    total_voice_duration: totalVoiceDuration,
    background_music_file: 'background_music.mp3',
    scenes: content.scenes.map((scene, index) => ({
      number: index + 1,
      description: scene.description,
      audio_file: `scene_${index + 1}/${scene.audio_file}`,
      image_file: `scene_${index + 1}/${scene.image_file}`,
      video_file: `scene_${index + 1}/${scene.video_file}`
    }))
  };
  const projectMetadataPath = path.join(outputDir, 'project_metadata.json');
  await fs.writeFile(projectMetadataPath, JSON.stringify(projectMetadata, null, 2));
  logger.info(`Project metadata saved to ${projectMetadataPath}`);
}

module.exports = { runContentPipeline };