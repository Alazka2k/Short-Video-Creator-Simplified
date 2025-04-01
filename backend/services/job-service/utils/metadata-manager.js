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
      
      // Create metadata object in the expected format
      const sceneMetadata = {
        sceneId: metadata.sceneId,
        // Use the text property as description
        description: metadata.text || (metadata.scene?.description) || '',
      };

      // Add voice result if it exists
      if (metadata.voice || metadata.voiceResult) {
        const voiceData = metadata.voice || metadata.voiceResult;
        if (voiceData) {
          // Check if this is a skipped result without a filePath
          if (voiceData.status === 'skipped') {
            sceneMetadata.voice = { status: 'skipped' };
          } else if (voiceData.filePath) {
            sceneMetadata.voice = {
              filePath: voiceData.filePath,
              fileName: path.basename(voiceData.filePath),
              storageKey: voiceData.storageKey,
              publicUrl: voiceData.publicUrl,
              status: voiceData.status || 'completed',
              metadata: voiceData.metadata
            };
          } else {
            // Handle case where voice result exists but has no filePath
            sceneMetadata.voice = {
              status: voiceData.status || 'failed',
              error: voiceData.error || 'Missing file path'
            };
          }
        }
      }

      // Add image result if it exists
      if (metadata.image || metadata.imageResult) {
        const imageData = metadata.image || metadata.imageResult;
        if (imageData) {
          // Check if this is a skipped result without a filePath
          if (imageData.status === 'skipped') {
            sceneMetadata.image = { status: 'skipped' };
          } else if (imageData.filePath) {
            sceneMetadata.image = {
              filePath: imageData.filePath,
              fileName: path.basename(imageData.filePath),
              storageKey: imageData.storageKey,
              publicUrl: imageData.publicUrl,
              status: imageData.status || 'completed',
              metadata: imageData.metadata
            };
          } else {
            // Handle case where image result exists but has no filePath
            sceneMetadata.image = {
              status: imageData.status || 'failed',
              error: imageData.error || 'Missing file path'
            };
          }
        }
      }

      // Add visualization data if it exists
      const visualTypes = ['video', 'animation'];
      for (const visualType of visualTypes) {
        if (metadata[visualType] || (metadata.visualResult && metadata.visualizationType === visualType)) {
          const visualData = metadata[visualType] || metadata.visualResult;
          if (visualData) {
            // Check if this is a skipped result without a filePath
            if (visualData.status === 'skipped') {
              sceneMetadata[visualType] = { status: 'skipped' };
            } else if (visualData.filePath) {
              sceneMetadata[visualType] = {
                filePath: visualData.filePath,
                fileName: path.basename(visualData.filePath),
                storageKey: visualData.storageKey,
                publicUrl: visualData.publicUrl,
                status: visualData.status || 'completed',
                metadata: visualData.metadata
              };
            } else {
              // Handle case where visualization result exists but has no filePath
              sceneMetadata[visualType] = {
                status: visualData.status || 'failed',
                error: visualData.error || 'Missing file path'
              };
            }
          }
        }
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