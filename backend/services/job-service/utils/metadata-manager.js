const fs = require('fs').promises;
const path = require('path');
const logger = require('../../../shared/utils/logger');

class MetadataManager {
  static async saveProjectMetadata(outputDir, metadata) {
    try {
      await fs.writeFile(
        path.join(outputDir, 'project_metadata.json'),
        JSON.stringify(metadata, null, 2)
      );
    } catch (error) {
      logger.error('Error saving project metadata:', error);
      throw error;
    }
  }

  static async saveSceneMetadata(sceneDir, metadata) {
    try {
      const metadataPath = path.join(sceneDir, 'metadata.json');
      await fs.mkdir(path.dirname(metadataPath), { recursive: true });
      
      const sceneMetadata = {
        sceneId: metadata.sceneId,
        description: metadata.scene.description,
        voice: metadata.voiceResult ? {
          filePath: metadata.voiceResult.filePath,
          fileName: path.basename(metadata.voiceResult.filePath),
          storageKey: metadata.voiceResult.storageKey,
          publicUrl: metadata.voiceResult.publicUrl,
          metadata: metadata.voiceResult.metadata
        } : null,
        image: metadata.imageResult ? {
          filePath: metadata.imageResult.filePath,
          fileName: path.basename(metadata.imageResult.filePath),
          storageKey: metadata.imageResult.storageKey,
          publicUrl: metadata.imageResult.publicUrl,
          metadata: metadata.imageResult.metadata

        } : null
      };

      if (metadata.visualResult) {
        sceneMetadata[metadata.visualizationType] = {
          filePath: metadata.visualResult.filePath,
          fileName: metadata.visualResult.filePath ? path.basename(metadata.visualResult.filePath) : null,
          storageKey: metadata.visualResult.storageKey,
          publicUrl: metadata.visualResult.publicUrl,
          metadata: metadata.visualResult.metadata
        };
      }

      await fs.writeFile(metadataPath, JSON.stringify(sceneMetadata, null, 2));
      logger.info('Scene metadata saved successfully');
    } catch (error) {
      logger.error('Error saving scene metadata:', error);
      throw error;
    }
  }
}

module.exports = MetadataManager; 