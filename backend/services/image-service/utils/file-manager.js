const path = require('path');
const fs = require('fs').promises;
const config = require('../../../shared/utils/config');
const logger = require('../../../shared/utils/logger');

class FileManager {
  getOutputPaths(sceneIndex, jobId, isTest = false) {
    if (isTest) {
      return this.getTestPaths(sceneIndex);
    }
    return this.getProductionPaths(sceneIndex, jobId);
  }

  getTestPaths(sceneIndex) {
    const testOutputDir = path.join(__dirname, '..', '..', '..', '..', 'tests', 'test_output', 'image');
    const testFolderPath = path.join(testOutputDir, `output_test_${sceneIndex}`);
    return {
      imageFilePath: path.join(testFolderPath, `image_scene_${sceneIndex}.png`),
      metadataPath: path.join(testFolderPath, 'metadata.json')
    };
  }

  getProductionPaths(sceneIndex, jobId) {
    const dateString = new Date().toISOString().split('T')[0];
    const folderPath = path.join(config.output.directory, 'image', dateString, jobId, `scene_${sceneIndex}`);
    return {
      imageFilePath: path.join(folderPath, `image_scene_${sceneIndex}.png`),
      metadataPath: path.join(folderPath, 'metadata.json')
    };
  }

  async saveMetadata(metadataPath, sceneIndex, metadata) {
    try {
      await fs.mkdir(path.dirname(metadataPath), { recursive: true });
      const metadataContent = {
        [`scene_${sceneIndex}`]: metadata
      };
      await fs.writeFile(metadataPath, JSON.stringify(metadataContent, null, 2));
      logger.info(`Metadata saved to ${metadataPath}`);
    } catch (error) {
      logger.error('Error saving metadata:', error);
      throw error;
    }
  }
}

module.exports = FileManager; 