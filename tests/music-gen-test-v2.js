const path = require('path');
const fs = require('fs').promises;
const MusicGenService = require('../backend/services/music-service2/music-gen-service');
const { getAudioDuration } = require('../backend/shared/utils/audio-utils');
const config = require('../backend/shared/utils/config');
const logger = require('../backend/shared/utils/logger');

async function runMusicGenTest() {
  try {
    logger.info('Starting Stable Audio Open 1.0 music generation test');

    const testOutputDir = path.join(__dirname, 'test_output', 'music-v2');
    await fs.mkdir(testOutputDir, { recursive: true });

    const musicService = new MusicGenService();

    const musicData = {
      title: 'Test Music',
      tags: ['test', 'music', 'generation'],
      instrumental: true,
      prompt: "128 BPM tech house drum loop"
    };

    const result = await musicService.generateMusic(musicData, true);

    // Verify the generated file
    const stats = await fs.stat(result.filePath);
    if (stats.size > 0) {
      logger.info(`Music file generated successfully: ${result.filePath}`);
      logger.info(`File size: ${stats.size} bytes`);

      // Verify WAV header
      const fileHandle = await fs.open(result.filePath, 'r');
      const buffer = Buffer.alloc(44);
      await fileHandle.read(buffer, 0, 44, 0);
      await fileHandle.close();

      if (buffer.toString('hex', 0, 4) === '52494646') {
        logger.info('File verified as valid WAV');
      } else {
        logger.warn('Warning: File may not be a valid WAV (incorrect header)');
      }

      // Check audio duration
      const musicDuration = await getAudioDuration(result.filePath);
      logger.info(`Music duration: ${musicDuration.toFixed(2)} seconds`);

      // Save metadata
      const metadataPath = path.join(testOutputDir, 'metadata.json');
      await fs.writeFile(metadataPath, JSON.stringify({
        fileName: result.fileName,
        fileSize: stats.size,
        duration: musicDuration,
        title: musicData.title,
        tags: musicData.tags,
        instrumental: musicData.instrumental
      }, null, 2));

      logger.info('Music generation test completed successfully');
    } else {
      logger.warn(`Generated music file is empty: ${result.filePath}`);
      throw new Error('Generated music file is empty');
    }
  } catch (error) {
    logger.error('Error in music generation test:', {
      message: error.message,
      name: error.name,
      stack: error.stack
    });
    throw error;
  }
}

runMusicGenTest()
  .catch(error => {
    console.error('Music generation test failed:', error);
    process.exit(1);
  });