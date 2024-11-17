const path = require('path');
const fs = require('fs').promises;
const { VoiceServiceInterface } = require('../backend/services/voice-service');
const config = require('../backend/shared/utils/config');
const logger = require('../backend/shared/utils/logger');

async function validateLLMOutput(llmOutput) {
  if (!llmOutput || typeof llmOutput !== 'object') {
    throw new Error('Invalid LLM output: not an object');
  }

  // Handle both direct structure and nested content structure
  const scenes = llmOutput.scenes || (llmOutput.content && llmOutput.content.video_script && llmOutput.content.video_script.scenes);

  if (!scenes || !Array.isArray(scenes)) {
    throw new Error('Invalid LLM output: no scenes array found');
  }

  return scenes;
}

async function runVoiceGenTest() {
  try {
    logger.info('Starting voice generation test with LLM output');
    logger.info('Voice generation configuration:', JSON.stringify(config.voiceGen, null, 2));
    logger.info('Voice generation parameters:', JSON.stringify(config.parameters?.voiceGen, null, 2));

    const voiceService = new VoiceServiceInterface();
    await voiceService.initialize();

    const llmOutputDir = path.join(__dirname, 'test_output', 'llm');
    const voiceOutputDir = path.join(__dirname, 'test_output', 'voice');

    // Ensure voice output directory exists
    await fs.mkdir(voiceOutputDir, { recursive: true });

    // Get all LLM output files
    const llmOutputFiles = await fs.readdir(llmOutputDir);

    for (const llmOutputFile of llmOutputFiles) {
      if (llmOutputFile.startsWith('output_test_') && llmOutputFile.endsWith('.json')) {
        try {
          const llmOutputPath = path.join(llmOutputDir, llmOutputFile);
          const llmOutputContent = await fs.readFile(llmOutputPath, 'utf8');
          const llmOutput = JSON.parse(llmOutputContent);

          logger.info(`Processing LLM output: ${llmOutputFile}`);

          // Validate and get scenes array
          const scenes = await validateLLMOutput(llmOutput);
          logger.info(`Found ${scenes.length} scenes to process`);

          const promptOutputDir = path.join(voiceOutputDir, path.basename(llmOutputFile, '.json'));
          await fs.mkdir(promptOutputDir, { recursive: true });

          for (let index = 0; index < scenes.length; index++) {
            try {
              const sceneNumber = index + 1; // Convert to 1-based indexing
              const scene = scenes[index];
              const voiceId = config.parameters?.voiceGen?.defaultVoiceId || '21m00Tcm4TlvDq8ikWAM';
              
              logger.info(`Generating voice for scene ${sceneNumber} with voice ID: ${voiceId}`);
              
              const result = await voiceService.process(
                scene.description,
                sceneNumber,  // Use 1-based scene number
                voiceId,
                true  // isTest parameter
              );

              // Move the generated file to the correct output directory with 1-based scene number
              const finalOutputPath = path.join(promptOutputDir, `voice_scene_${sceneNumber}.mp3`);
              
              // Ensure the directory exists
              await fs.mkdir(path.dirname(finalOutputPath), { recursive: true });
              
              // Move the file
              await fs.rename(result.filePath, finalOutputPath);

              // Verify the generated file
              const stats = await fs.stat(finalOutputPath);
              if (stats.size > 0) {
                logger.info(`Voice file generated successfully: ${finalOutputPath}`);
                logger.info(`File size: ${stats.size} bytes`);

                // Verify MP3 header
                const fileHandle = await fs.open(finalOutputPath, 'r');
                const buffer = Buffer.alloc(4);
                await fileHandle.read(buffer, 0, 4, 0);
                await fileHandle.close();

                if (buffer.toString('hex').startsWith('fff3') || buffer.toString('hex').startsWith('fff2')) {
                  logger.info('File verified as valid MP3');
                } else {
                  logger.warn('Warning: File may not be a valid MP3 (incorrect header)');
                }

                // Update metadata with 1-based scene number
                const metadataPath = path.join(promptOutputDir, 'metadata.json');
                await updateMetadata(metadataPath, sceneNumber, {
                  voiceFile: path.basename(finalOutputPath),
                  voiceId: voiceId
                });

              } else {
                logger.warn(`Generated voice file is empty: ${finalOutputPath}`);
              }
            } catch (error) {
              logger.error(`Error generating voice for scene ${index + 1}:`, error);
            }
          }
        } catch (error) {
          logger.error(`Error processing LLM output file ${llmOutputFile}:`, error);
        }
      }
    }

    // Test listVoices functionality
    try {
      const voices = await voiceService.listVoices();
      logger.info(`Available voices: ${voices.length}`);
    } catch (error) {
      logger.error('Error listing voices:', error);
    }

    logger.info('Voice generation test completed successfully');
  } catch (error) {
    logger.error('Error in voice generation test:', error);
    throw error;
  }
}

async function updateMetadata(metadataPath, sceneNumber, data) {
  let metadata = {};
  try {
    try {
      const existingData = await fs.readFile(metadataPath, 'utf8');
      metadata = JSON.parse(existingData);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        logger.error('Error reading metadata:', error);
      }
    }

    metadata[`scene_${sceneNumber}`] = data;
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
    logger.info(`Metadata updated for scene ${sceneNumber}`);
  } catch (error) {
    logger.error(`Error updating metadata for scene ${sceneNumber}:`, error);
  }
}

module.exports = runVoiceGenTest;

if (require.main === module) {
  runVoiceGenTest().catch(error => {
    console.error('Voice generation test failed:', error);
    process.exit(1);
  });
}