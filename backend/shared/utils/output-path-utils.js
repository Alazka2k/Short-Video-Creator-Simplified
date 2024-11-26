// shared/utils/output-path-utils.js

const path = require('path');
const fs = require('fs').promises;
const logger = require('./logger');
const config = require('./config');

class OutputPathUtils {
  constructor() {
    this.baseOutputPath = config.output.directory;
  }

  /**
   * Generates the appropriate output path based on run type and service
   * @param {Object} options
   * @param {string} options.jobId - The unique job identifier
   * @param {string} options.service - Service name (llm, voice, image, video, etc.)
   * @param {number} [options.sceneIndex] - Scene number (if applicable)
   * @param {boolean} [options.isIntegrationRun=false] - Whether this is part of an integration run
   * @param {Date} [options.date=new Date()] - Date for folder structure
   * @returns {Object} Paths object containing all relevant paths
   */
  getOutputPaths({
    jobId,
    service,
    sceneIndex = null,
    isIntegrationRun = false,
    date = new Date()
  }) {
    const dateString = date.toISOString().split('T')[0];
    
    // Base structure differs for integration vs standalone runs
    const basePath = isIntegrationRun
      ? path.join(this.baseOutputPath, 'integration', dateString, jobId)
      : path.join(this.baseOutputPath, service, dateString, jobId);

    // Scene path (if applicable)
    const scenePath = sceneIndex 
      ? path.join(basePath, `scene_${sceneIndex}`)
      : basePath;

    // Service-specific path for integration runs
    const servicePath = isIntegrationRun && sceneIndex
      ? path.join(scenePath, service)
      : scenePath;

    // Construct paths object
    const paths = {
      base: basePath,
      scene: scenePath,
      service: servicePath,
      dateString,
      // Relative paths from base output directory
      relative: {
        base: path.relative(this.baseOutputPath, basePath),
        scene: path.relative(this.baseOutputPath, scenePath),
        service: path.relative(this.baseOutputPath, servicePath)
      }
    };

    return paths;
  }

  /**
   * Creates the necessary directory structure for output
   * @param {Object} paths - Paths object from getOutputPaths
   */
  async ensureDirectories(paths) {
    try {
      await fs.mkdir(paths.service, { recursive: true });
      logger.info(`Created directory structure at ${paths.service}`);
    } catch (error) {
      logger.error(`Error creating directory structure: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generates the full file path for a service output
   * @param {Object} options
   * @param {Object} options.paths - Paths object from getOutputPaths
   * @param {string} options.fileName - Name of the file
   * @param {string} options.extension - File extension (without dot)
   * @returns {string} Full file path
   */
  getFilePath({ paths, fileName, extension }) {
    const fullFileName = `${fileName}.${extension}`;
    return path.join(paths.service, fullFileName);
  }

  /**
   * Gets metadata file path for a service output
   * @param {Object} paths - Paths object from getOutputPaths
   * @returns {string} Metadata file path
   */
  getMetadataPath(paths) {
    return path.join(paths.service, 'metadata.json');
  }
}

module.exports = new OutputPathUtils();