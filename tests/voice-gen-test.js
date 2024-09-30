const path = require('path');
const fs = require('fs').promises;
const { VoiceServiceInterface } = require('../backend/services/voice-service');
const config = require('../backend/shared/utils/config');
const logger = require('../backend/shared/utils/logger');

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
        const llmOutputPath = path.join(llmOutputDir, llmOutputFile);
        const llmOutput = JSON.parse(await fs.readFile(llmOutputPath, 'utf8'));

        logger.info(`Processing LLM output: ${llmOutputFile}`);

        const promptOutputDir = path.join(voiceOutputDir, path.basename(llmOutputFile, '.json'));
        await fs.mkdir(promptOutputDir, { recursive: true });

        for (const [index, scene] of llmOutput.scenes.entries()) {
          try {
            // Use config.parameters.voiceGen.defaultVoiceId if available, otherwise use a default value
            const voiceId = config.parameters?.voiceGen?.defaultVoiceId || '21m00Tcm4TlvDq8ikWAM';
            
            logger.info(`Generating voice for scene ${index + 1} with voice ID: ${voiceId}`);
            
            const result = await voiceService.process(
              scene.description,
              promptOutputDir,
              index,
              voiceId,
              true  // isTest parameter
            );

            // Check if the file exists and has content
            const stats = await fs.stat(result.outputPath);
            if (stats.size > 0) {
              logger.info(`Voice file generated successfully: ${result.outputPath}`);
              logger.info(`File size: ${stats.size} bytes`);

              // Read the first few bytes of the file to verify it's a valid MP3
              const fileHandle = await fs.open(result.outputPath, 'r');
              const buffer = Buffer.alloc(4);
              await fileHandle.read(buffer, 0, 4, 0);
              await fileHandle.close();

              if (buffer.toString('hex').startsWith('fff3') || buffer.toString('hex').startsWith('fff2')) {
                logger.info('File appears to be a valid MP3');
              } else {
                logger.warn('File does not start with a valid MP3 header');
              }
            } else {
              logger.warn(`Generated voice file is empty: ${result.outputPath}`);
            }
          } catch (error) {
            logger.error(`Error generating voice for scene ${index + 1}:`, error);
          }
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

    logger.info('Voice generation test completed');
  } catch (error) {
    logger.error('Error in voice generation test:', error);
    throw error;
  }
}

runVoiceGenTest().catch(error => {
  console.error('Voice generation test failed:', error);
  process.exit(1);
});