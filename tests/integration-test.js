const path = require('path');
const fs = require('fs').promises;
const { ImageServiceInterface } = require('../backend/services/image-service');
const llmService = require('../backend/services/llm-service');
const { VoiceServiceInterface } = require('../backend/services/voice-service');
const { MusicServiceInterface } = require('../backend/services/music-service');
const { AnimationServiceInterface } = require('../backend/services/animation-service');
const { VideoServiceInterface } = require('../backend/services/video-service');
const logger = require('../backend/shared/utils/logger');
const config = require('../backend/shared/utils/config');
const { getTotalAudioDuration } = require('../backend/shared/utils/audio-utils');

function formatLLMOutput(result) {
  logger.info('Formatting LLM output structure');
  
  if (!result) {
    throw new Error('LLM result is null or undefined');
  }

  if (result.video_script) {
    logger.info('Found nested video_script structure, extracting...');
    return result.video_script;
  }

  if (result.prompt && result.scenes) {
    logger.info('Found flat structure with prompt and scenes');
    return result;
  }

  logger.error('Invalid LLM output structure:', JSON.stringify(result, null, 2));
  throw new Error('Invalid LLM output structure');
}

async function initializeServices() {
  logger.info('Initializing services...');
  
  try {
    // Create service instances
    const imageService = new ImageServiceInterface();
    const voiceService = new VoiceServiceInterface();
    const musicService = new MusicServiceInterface();
    const animationService = new AnimationServiceInterface();
    const videoService = new VideoServiceInterface();

    // Initialize services
    logger.info('Initializing Image Service...');
    await imageService.initialize();
    
    logger.info('Initializing Voice Service...');
    await voiceService.initialize();

    logger.info('Initializing Music Service...');
    await musicService.initialize();
    
    logger.info('Initializing Animation Service...');
    await animationService.initialize();
    
    logger.info('Initializing Video Service...');
    await videoService.initialize();

    logger.info('All services initialized successfully');

    return {
      imageService,
      voiceService,
      musicService,
      animationService,
      videoService
    };
  } catch (error) {
    logger.error('Error initializing services:', error);
    throw error;
  }
}

async function cleanupServices(services) {
  logger.info('Cleaning up services...');
  
  try {
    if (services.imageService) {
      logger.info('Cleaning up Image Service...');
      await services.imageService.cleanup();
    }

    if (services.voiceService) {
      logger.info('Cleaning up Voice Service...');
      await services.voiceService.cleanup();
    }

    if (services.musicService) {
      logger.info('Cleaning up Music Service...');
      await services.musicService.cleanup();
    }
    
    if (services.animationService) {
      logger.info('Cleaning up Animation Service...');
      await services.animationService.cleanup();
    }
    
    if (services.videoService) {
      logger.info('Cleaning up Video Service...');
      await services.videoService.cleanup();
    }
    
    logger.info('All services cleaned up successfully');
  } catch (error) {
    logger.error('Error during service cleanup:', error);
  }
}

async function processScene(scene, sceneNumber, sceneDir, services) {
  logger.info(`Processing scene ${sceneNumber}`);
  
  try {
    // Generate voice
    logger.info(`Generating voice for scene ${sceneNumber}`);
    const voiceFileName = `voice_scene_${sceneNumber}.mp3`;
    const voiceFilePath = path.join(sceneDir, voiceFileName);
    const voiceResult = await services.voiceService.process(
      scene.description,
      sceneNumber,
      config.parameters?.voiceGen?.defaultVoiceId,
      true // isTest
    );

    // Generate image
    logger.info(`Generating image for scene ${sceneNumber}`);
    const imageFileName = `image_scene_${sceneNumber}.png`;
    const imageFilePath = path.join(sceneDir, imageFileName);
    const imageResult = await services.imageService.process(
      scene.visual_prompt,
      sceneNumber,
      true // isTest
    );

    // Generate animation
    logger.info(`Generating animation for scene ${sceneNumber}`);
    const animationFileName = `animation_scene_${sceneNumber}.mp4`;
    const animationFilePath = path.join(sceneDir, animationFileName);
    const animationResult = await services.animationService.process(
      imageResult.filePath,
      path.basename(sceneDir),
      sceneNumber,
      {
        animationLength: config.parameters?.animationGen?.animationLength || 5,
        animationPrompt: scene.video_prompt
      },
      true // isTest
    );

    // Generate video
    logger.info(`Generating video for scene ${sceneNumber}`);
    const videoFileName = `video_scene_${sceneNumber}.mp4`;
    const videoFilePath = path.join(sceneDir, videoFileName);
    const videoResult = await services.videoService.process(
      imageResult.filePath,
      scene.video_prompt,
      scene.camera_movement,
      config.parameters?.llmGen?.aspectRatio || '9:16',
      sceneNumber,
      path.basename(sceneDir),
      true // isTest
    );

    // Prepare and save scene metadata
    const sceneMetadata = {
      scene_number: sceneNumber,
      description: scene.description,
      visual_prompt: scene.visual_prompt,
      video_prompt: scene.video_prompt,
      camera_movement: scene.camera_movement,
      files: {
        voice: voiceFileName,
        image: imageFileName,
        animation: animationFileName,
        video: videoFileName
      },
      image_urls: {
        original: imageResult.originalUrl,
        selected: imageResult.imageUrl
      }
    };

    const metadataPath = path.join(sceneDir, 'metadata.json');
    await fs.writeFile(metadataPath, JSON.stringify(sceneMetadata, null, 2));
    logger.info(`Metadata saved for scene ${sceneNumber}`);

    return sceneMetadata;
  } catch (error) {
    logger.error(`Error processing scene ${sceneNumber}:`, error);
    throw error;
  }
}

async function processMusicGeneration(content, outputDir, testNumber, services) {
  try {
    const musicFileName = `background_music_${testNumber}.mp3`;
    const musicFilePath = path.join(outputDir, musicFileName);

    logger.info(`Generating background music for test ${testNumber}`);
    
    const makeInstrumental = config.parameters?.musicGen?.make_instrumental === "true";
    const result = await services.musicService.generateMusic(
      {
        ...content.music,
        instrumental: makeInstrumental
      },
      true // isTest
    );

    await fs.rename(result.filePath, musicFilePath);
    const musicDuration = await getTotalAudioDuration(musicFilePath);
    
    logger.info(`Background music generated: ${musicFilePath}`);
    logger.info(`Music duration: ${musicDuration} seconds`);

    return { fileName: musicFileName, duration: musicDuration };
  } catch (error) {
    logger.error('Error generating background music:', error);
    throw error;
  }
}

async function runIntegrationTest() {
  let services;
  try {
    logger.info('Starting integration test');

    // Set up paths
    const testOutputDir = path.join(__dirname, 'test_output', 'integration');
    const inputCsvPath = path.join(__dirname, '..', 'data', 'input', 'input.csv');
    const parametersJsonPath = path.join(__dirname, '..', 'data', 'input', 'parameters.json');

    // Initialize services
    services = await initializeServices();

    // Load test data
    const prompts = await llmService.loadPromptsFromCsv(inputCsvPath);
    const llmGenParams = JSON.parse(await fs.readFile(parametersJsonPath, 'utf8')).llmGen;

    logger.info(`Found ${prompts.length} prompts to process`);

    for (let index = 0; index < prompts.length; index++) {
      const testNumber = index + 1;
      const prompt = prompts[index];
      
      logger.info(`Processing test ${testNumber} with prompt: ${prompt}`);

      // Create test directory
      const testDir = path.join(testOutputDir, `output_test_${testNumber}`);
      await fs.mkdir(testDir, { recursive: true });

      try {
        // Generate and format LLM content
        const llmResult = await llmService.process(llmGenParams, prompt, true);
        const content = formatLLMOutput(llmResult);

        // Save LLM output
        const llmOutputPath = path.join(testDir, 'llm_output.json');
        await fs.writeFile(llmOutputPath, JSON.stringify(content, null, 2));

        // Process each scene
        const sceneMetadata = [];
        for (let sceneIndex = 0; sceneIndex < content.scenes.length; sceneIndex++) {
          const sceneNumber = sceneIndex + 1;
          const sceneDir = path.join(testDir, `scene_${sceneNumber}`);
          await fs.mkdir(sceneDir, { recursive: true });

          const metadata = await processScene(
            content.scenes[sceneIndex],
            sceneNumber,
            sceneDir,
            services
          );
          sceneMetadata.push(metadata);
        }

        // Generate background music
        const musicResult = await processMusicGeneration(content, testDir, testNumber, services);

        // Calculate total voice duration
        const totalVoiceDuration = await getTotalAudioDuration(testDir);

        // Save project metadata
        const projectMetadata = {
          test_number: testNumber,
          prompt: content.prompt,
          title: content.title,
          description: content.description,
          hashtags: content.hashtags,
          durations: {
            total_voice: totalVoiceDuration,
            background_music: musicResult.duration
          },
          files: {
            background_music: musicResult.fileName,
            llm_output: 'llm_output.json'
          },
          scenes: sceneMetadata
        };

        const projectMetadataPath = path.join(testDir, 'project_metadata.json');
        await fs.writeFile(projectMetadataPath, JSON.stringify(projectMetadata, null, 2));
        logger.info(`Project metadata saved for test ${testNumber}`);

      } catch (error) {
        logger.error(`Error processing test ${testNumber}:`, error);
        logger.error('Error details:', error.stack);
        continue; // Continue with next test even if one fails
      }
    }

    logger.info('Integration test completed successfully');
  } catch (error) {
    logger.error('Error in integration test:', error);
    throw error;
  } finally {
    if (services) {
      await cleanupServices(services);
    }
  }
}

module.exports = runIntegrationTest;

if (require.main === module) {
  runIntegrationTest().catch(error => {
    console.error('Integration test failed:', error);
    process.exit(1);
  });
}