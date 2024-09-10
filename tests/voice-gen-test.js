const path = require('path');
const fs = require('fs').promises;
const voiceGenService = require('../src/services/voice-gen-service');
const config = require('../src/utils/config');
const logger = require('../src/utils/logger');

async function runVoiceGenTest() {
  try {
    logger.info('Starting voice generation test with LLM output');

    const llmOutputPath = path.join(__dirname, 'test_output', 'llm', 'output_test.json');
    const voiceOutputDir = path.join(__dirname, 'test_output', 'voice');

    // Read LLM output
    const llmOutput = JSON.parse(await fs.readFile(llmOutputPath, 'utf8'));

    // Ensure voice output directory exists
    await fs.mkdir(voiceOutputDir, { recursive: true });

    for (const [index, scene] of llmOutput.scenes.entries()) {
      const fileName = `scene_${index + 1}.mp3`;
      const outputPath = path.join(voiceOutputDir, fileName);

      try {
        await voiceGenService.generateVoice(
          scene.description,
          outputPath,
          llmOutput.prompt,
          index + 1,
          config.parameters.voiceGen.defaultVoiceId,
          true // isTest flag
        );

        // Check if the file exists and has content
        const stats = await fs.stat(outputPath);
        if (stats.size > 0) {
          logger.info(`Voice file generated successfully: ${outputPath}`);
          logger.info(`File size: ${stats.size} bytes`);

          // Read the first few bytes of the file to verify it's a valid MP3
          const fileHandle = await fs.open(outputPath, 'r');
          const buffer = Buffer.alloc(4);
          await fileHandle.read(buffer, 0, 4, 0);
          await fileHandle.close();

          if (buffer.toString('hex').startsWith('fff3') || buffer.toString('hex').startsWith('fff2')) {
            logger.info('File appears to be a valid MP3');
          } else {
            logger.warn('File does not start with a valid MP3 header');
          }
        } else {
          logger.warn(`Generated voice file is empty: ${outputPath}`);
        }
      } catch (error) {
        logger.error(`Error generating voice for scene ${index + 1}:`, error);
      }
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