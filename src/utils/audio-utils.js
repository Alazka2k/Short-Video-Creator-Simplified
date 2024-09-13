const { exec } = require('child_process');
const util = require('util');
const ffprobe = require('ffprobe-static');
const path = require('path');
const fs = require('fs').promises;
const logger = require('./logger');

const execPromise = util.promisify(exec);

async function getAudioDuration(filePath) {
  try {
    // Check if file exists before trying to get its duration
    await fs.access(filePath);
    
    const { stdout } = await execPromise(`${ffprobe.path} -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`);
    const duration = parseFloat(stdout.trim());
    logger.info(`Audio duration for ${filePath}: ${duration} seconds`);
    return duration;
  } catch (error) {
    if (error.code === 'ENOENT') {
      logger.warn(`File not found: ${filePath}`);
      return 0;
    }
    logger.error(`Error getting audio duration for ${filePath}:`, error);
    return 0;
  }
}

async function getTotalAudioDuration(directory) {
  try {
    logger.info(`getTotalAudioDuration called with directory: ${directory}`);
    const files = await fs.readdir(directory);
    const audioFiles = files.filter(file => ['.mp3', '.wav'].includes(path.extname(file).toLowerCase()));
    
    let totalDuration = 0;
    for (const file of audioFiles) {
      const filePath = path.join(directory, file);
      const duration = await getAudioDuration(filePath);
      if (!isNaN(duration)) {
        totalDuration += duration;
      }
    }
    
    logger.info(`Total audio duration for directory ${directory}: ${totalDuration} seconds`);
    return totalDuration;
  } catch (error) {
    logger.error('Error calculating total audio duration:', error);
    throw error;
  }
}

module.exports = {
  getAudioDuration,
  getTotalAudioDuration
};