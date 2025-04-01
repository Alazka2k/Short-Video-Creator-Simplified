/**
 * Output Manager
 * 
 * Handles output directory and file path management:
 * - Generates consistent file paths for jobs and scenes
 * - Creates required output directories
 * - Manages metadata file persistence
 */

const fs = require('fs').promises;
const path = require('path');
const logger = require('../../../shared/utils/logger');
const config = require('../../../shared/utils/config');
const MetadataManager = require('./metadata-manager');

// Base output directory where all job output is stored
const OUTPUT_INTEGRATION_DIR = config.output.integrationDirectory;

/**
 * Gets the output path for a job
 * 
 * @param {string} jobId - The job ID
 * @param {Date} date - Optional date for folder structure (defaults to current date)
 * @returns {string} - The full path to the job output directory
 */
function getJobOutputPath(jobId, date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return path.join(OUTPUT_INTEGRATION_DIR, `${year}-${month}-${day}`, jobId);
}

/**
 * Gets the output path for a specific scene within a job
 * 
 * @param {string} jobOutputDir - The job output directory
 * @param {number} sceneId - The scene ID/number
 * @returns {string} - The full path to the scene output directory
 */
function getSceneOutputPath(jobOutputDir, sceneId) {
  return path.join(jobOutputDir, `scene_${sceneId}`);
}

/**
 * Creates all necessary output directories for a job
 * 
 * @param {string} jobId - The job ID
 * @param {number} scenesCount - Number of scenes to create directories for
 * @returns {Promise<void>} - Resolves when all directories are created
 */
async function createOutputDirectories(jobId, scenesCount) {
  const jobOutputDir = getJobOutputPath(jobId);
  
  try {
    // Create the job output directory
    await fs.mkdir(jobOutputDir, { recursive: true });
    logger.info(`Created job output directory for job ${jobId}`);
    
    // Create a directory for each scene
    if (scenesCount > 0) {
      const sceneDirectoryPromises = [];
      for (let i = 1; i <= scenesCount; i++) {
        const sceneDir = getSceneOutputPath(jobOutputDir, i);
        sceneDirectoryPromises.push(fs.mkdir(sceneDir, { recursive: true }));
      }
      
      // Wait for all scene directories to be created
      await Promise.all(sceneDirectoryPromises);
      logger.info(`Created ${scenesCount} scene directories for job ${jobId}`);
    } else {
      logger.warn(`No scenes to create directories for in job ${jobId}`);
    }
  } catch (error) {
    logger.error(`Error creating output directories for job ${jobId}:`, error);
    throw error;
  }
}

/**
 * Saves job metadata to a JSON file in the job directory
 * 
 * @param {string} jobOutputDir - The job output directory
 * @param {Object} metadata - The metadata object to save
 * @returns {Promise<void>} - Resolves when the file is saved
 */
async function saveJobMetadata(jobOutputDir, metadata) {
  const metadataPath = path.join(jobOutputDir, 'metadata.json');
  
  try {
    // Ensure the directory exists
    await fs.mkdir(jobOutputDir, { recursive: true });
    
    // Write the metadata file
    await fs.writeFile(
      metadataPath, 
      JSON.stringify(metadata, null, 2),
      'utf8'
    );
    
    logger.info(`Saved metadata for job to ${metadataPath}`);
  } catch (error) {
    logger.error(`Error saving metadata for job:`, error);
    throw error;
  }
}

/**
 * Reads job metadata from a JSON file in the job directory
 * 
 * @param {string} jobOutputDir - The job output directory
 * @returns {Promise<Object>} - Resolves with the metadata object
 */
async function readJobMetadata(jobOutputDir) {
  const metadataPath = path.join(jobOutputDir, 'metadata.json');
  
  try {
    const data = await fs.readFile(metadataPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    logger.error(`Error reading metadata for job:`, error);
    throw error;
  }
}

/**
 * OutputManager
 * 
 * Responsible for managing output directories and file paths, including:
 * - Generating file paths for jobs and scenes
 * - Creating output directories
 * - Managing metadata file persistence
 */
class OutputManager {
  constructor() {
    this.integrationOutputPath = path.join(config.output.integrationDirectory);
    
    // Bind standalone functions to the class instance for compatibility
    this.getJobOutputPath = getJobOutputPath;
    this.getSceneOutputPath = getSceneOutputPath;
    this.createOutputDirectories = createOutputDirectories;
    this.readJobMetadata = readJobMetadata;
  }
  
  /**
   * Save job metadata to disk
   * @param {string} jobOutputDir - Job output directory path
   * @param {Object} metadata - Job metadata to save
   */
  async saveJobMetadata(jobOutputDir, metadata) {
    try {
      await MetadataManager.saveProjectMetadata(jobOutputDir, metadata);
    } catch (error) {
      logger.error('Error saving job metadata:', error);
      throw error;
    }
  }
  
  /**
   * Save scene metadata to disk
   * @param {string} jobOutputDir - Job output directory path
   * @param {number} sceneId - Scene ID
   * @param {Object} metadata - Scene metadata to save
   */
  async saveSceneMetadata(jobOutputDir, sceneId, metadata) {
    try {
      const sceneDir = getSceneOutputPath(jobOutputDir, sceneId);
      await MetadataManager.saveSceneMetadata(sceneDir, metadata);
    } catch (error) {
      logger.error(`Error saving metadata for scene ${sceneId}:`, error);
      throw error;
    }
  }
}

// Export both the class instance and standalone functions
const outputManagerInstance = new OutputManager();
module.exports = outputManagerInstance; 