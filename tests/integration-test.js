const path = require('path');
const fs = require('fs').promises;
const llmService = require('../backend/services/llm-service');
const voiceGenService = require('../backend/services/voice-service');
const imageGenService = require('../backend/services/image-service');
const musicGenService = require('../backend/services/music-service');
const animationGenService = require('../backend/services/animation-service');
const videoGenService = require('../backend/services/video-service');
const logger = require('../backend/shared/utils/logger');
const config = require('../backend/shared/utils/config');
const { getTotalAudioDuration } = require('../backend/shared/utils/audio-utils');

async function processPrompt(prompt, outputDir, initialPromptPath, parametersJsonPath) {
  logger.info(`Processing prompt: ${prompt}`);

  const content = await llmService.process(initialPromptPath, parametersJsonPath, prompt);
  logger.info('Generated content structure:', JSON.stringify(content, null, 2));

  const llmOutputPath = path.join(outputDir, 'llm_output.json');
  await fs.writeFile(llmOutputPath, JSON.stringify(content, null, 2));
  logger.info(`LLM output saved to ${llmOutputPath}`);

  // Process all scenes
  for (const [index, scene] of content.scenes.entries()) {
    const sceneDir = path.join(outputDir, `scene_${index + 1}`);
    await fs.mkdir(sceneDir, { recursive: true });

    // Generate voice
    const voiceFileName = 'voice.mp3';
    const voiceFilePath = path.join(sceneDir, voiceFileName);
    await voiceGenService.process(scene.description, voiceFilePath, config.parameters.voiceGen.defaultVoiceId);
    logger.info(`Voice generated for scene ${index + 1}: ${voiceFilePath}`);

    // Generate image
    const imageFileName = 'image.png';
    const imageFilePath = path.join(sceneDir, imageFileName);
    const imageResult = await imageGenService.process(scene.visual_prompt, sceneDir, index);
    logger.info(`Image generated for scene ${index + 1}: ${imageResult.filePath}`);

    // Generate animation
    const animationFileName = 'animation.mp4';
    const animationFilePath = path.join(sceneDir, animationFileName);
    await animationGenService.process(imageResult.filePath, animationFilePath, {
      animationLength: config.parameters.animationGen.animationLength,
      animationPrompt: scene.video_prompt
    });
    logger.info(`Animation generated for scene ${index + 1}: ${animationFilePath}`);

    // Generate video
    const videoFileName = 'video.mp4';
    const videoFilePath = path.join(sceneDir, videoFileName);
    await videoGenService.generateVideo(
      imageResult.filePath,
      scene.video_prompt,
      scene.camera_movement,
      config.parameters.llmGen.aspectRatio,
      videoFilePath
    );
    logger.info(`Video generated for scene ${index + 1}: ${videoFilePath}`);

    // Save scene metadata
    const sceneMetadata = {
      description: scene.description,
      visual_prompt: scene.visual_prompt,
      video_prompt: scene.video_prompt,
      camera_movement: scene.camera_movement,
      voice_file: voiceFileName,
      image_file: imageFileName,
      animation_file: animationFileName,
      video_file: videoFileName,
      original_image_url: imageResult.originalUrl,
      selected_variation_url: imageResult.imageUrl
    };
    const metadataPath = path.join(sceneDir, 'metadata.json');
    await fs.writeFile(metadataPath, JSON.stringify(sceneMetadata, null, 2));
    logger.info(`Metadata saved for scene ${index + 1}: ${metadataPath}`);
  }

  // Generate background music
  const musicFileName = 'background_music.mp3';
  const musicFilePath = path.join(outputDir, musicFileName);

  const makeInstrumental = config.parameters.musicGen.make_instrumental === "true";
  const musicGenerationResult = await musicGenService.generateMusic(content.music, {
    makeInstrumental: makeInstrumental
  });

  logger.info('Music generation task initiated:', JSON.stringify(musicGenerationResult, null, 2));

  const musicInfo = await musicGenService.waitForMusicGeneration(musicGenerationResult.id);
  await musicGenService.downloadMusic(musicInfo.audio_url, musicFilePath);
  logger.info(`Background music generated and saved to ${musicFilePath}`);

  // Calculate total duration of voice audio files
  const totalVoiceDuration = await getTotalAudioDuration(outputDir);
  logger.info(`Total duration of voice audio: ${totalVoiceDuration} seconds`);

  // Save project metadata
  const projectMetadata = {
    prompt: content.prompt,
    title: content.title,
    description: content.description,
    hashtags: content.hashtags,
    total_voice_duration: totalVoiceDuration,
    background_music_file: musicFileName,
    scenes: content.scenes.map((scene, index) => ({
      number: index + 1,
      description: scene.description,
      voice_file: `scene_${index + 1}/voice.mp3`,
      image_file: `scene_${index + 1}/image.png`,
      animation_file: `scene_${index + 1}/animation.mp4`,
      video_file: `scene_${index + 1}/video.mp4`
    }))
  };
  const projectMetadataPath = path.join(outputDir, 'project_metadata.json');
  await fs.writeFile(projectMetadataPath, JSON.stringify(projectMetadata, null, 2));
  logger.info(`Project metadata saved to ${projectMetadataPath}`);
}

async function runIntegrationTest() {
  try {
    logger.info('Starting integration test');

    const inputCsvPath = path.join(__dirname, '..', 'data', 'input', 'input.csv');
    const parametersJsonPath = path.join(__dirname, '..', 'data', 'input', 'parameters.json');
    const initialPromptPath = path.join(__dirname, '..', 'data', 'input', 'initial_prompt.txt');
    const baseOutputDir = path.join(__dirname, 'test_output', 'integration');

    await fs.mkdir(baseOutputDir, { recursive: true });

    const prompts = await llmService.loadPromptsFromCsv(inputCsvPath);

    // Initialize services
    await imageGenService.initialize();
    await animationGenService.initialize();
    await videoGenService.initialize();

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
    // Cleanup services
    await imageGenService.cleanup();
    await animationGenService.cleanup();
    await videoGenService.cleanup();
  }
}

runIntegrationTest().catch(error => {
  console.error('Integration test failed:', error);
  process.exit(1);
});