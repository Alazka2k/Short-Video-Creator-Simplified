const path = require('path');
const fs = require('fs').promises;
const config = require('../../../shared/utils/config');
const logger = require('../../../shared/utils/logger');

class FileManager {
  constructor() {
    // Ensure base output directory exists
    this.baseOutputDir = path.resolve(process.cwd(), 'data', 'output');
    this.ensureDirectoryExists(this.baseOutputDir);
  }

  async ensureDirectoryExists(dirPath) {
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
      logger.error('Error creating directory:', { dirPath, error });
      throw error;
    }
  }

  getOutputPaths(sceneIndex, jobId, isTest = false) {
    if (isTest) {
      return this.getTestPaths(sceneIndex);
    }
    return this.getProductionPaths(sceneIndex, jobId);
  }

  getTestPaths(sceneIndex) {
    const testOutputDir = path.join(process.cwd(), 'tests', 'test_output', 'image');
    const testFolderPath = path.join(testOutputDir, `output_test_${sceneIndex}`);
    return {
      imageFilePath: path.join(testFolderPath, `image_scene_${sceneIndex}.png`),
      metadataPath: path.join(testFolderPath, 'metadata.json')
    };
  }

  getProductionPaths(sceneIndex, jobId) {
    if (!sceneIndex || !jobId) {
      throw new Error('Scene index and job ID are required for production paths');
    }

    const dateString = new Date().toISOString().split('T')[0];
    const folderPath = path.join(this.baseOutputDir, 'image', dateString, jobId, `scene_${sceneIndex}`);
    
    return {
      imageFilePath: path.join(folderPath, `image_scene_${sceneIndex}.png`),
      metadataPath: path.join(folderPath, 'metadata.json')
    };
  }

  async saveMetadata(metadataPath, sceneIndex, metadata) {
    try {
      await this.ensureDirectoryExists(path.dirname(metadataPath));
      const metadataContent = {
        [`scene_${sceneIndex}`]: metadata
      };
      await fs.writeFile(metadataPath, JSON.stringify(metadataContent, null, 2));
      //logger.info(`Metadata saved to ${metadataPath}`);
    } catch (error) {
      logger.error('Error saving metadata:', error);
      throw error;
    }
  }
}

module.exports = FileManager; 