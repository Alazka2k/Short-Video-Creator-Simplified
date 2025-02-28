// backend/services/video-service/data/videoDataAccess.js

const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');
const knex = require('knex')(require('../../../../knexfile')[process.env.NODE_ENV || 'development']);
const logger = require('../../../shared/utils/logger');
const config = require('../../../shared/utils/config');

class VideoDataAccess {
  constructor() {
    this.tableName = 'video_outputs';
    this.baseOutputDir = path.join(config.output.directory, 'video');
  }

  getOutputPaths(jobId, sceneIndex, fileName) {
    // Get current date for folder structure
    const currentDate = new Date();
    const dateString = currentDate.toISOString().split('T')[0];
    
    // Construct paths
    const outputDir = path.join(
      this.baseOutputDir,
      dateString,
      jobId,
      `scene_${sceneIndex}`
    );
    
    return {
      outputDir,
      videoPath: path.join(outputDir, fileName),
      metadataPath: path.join(outputDir, 'metadata.json')
    };
  }

  async ensureDirectoryExists(directory) {
    try {
      await fs.mkdir(directory, { recursive: true });
      logger.info(`Directory ensured: ${directory}`);
    } catch (error) {
      logger.error(`Error creating directory ${directory}:`, error);
      throw error;
    }
  }

  async moveVideoFile(tempPath, finalPath) {
    try {
      // Ensure the destination directory exists
      await this.ensureDirectoryExists(path.dirname(finalPath));
      
      // Move the file
      await fs.rename(tempPath, finalPath);
      logger.info(`Video file moved to: ${finalPath}`);
      
      // Verify the file was moved successfully
      const stats = await fs.stat(finalPath);
      if (stats.size === 0) {
        throw new Error('Moved video file is empty');
      }
      
      return true;
    } catch (error) {
      logger.error('Error moving video file:', error);
      throw error;
    }
  }

  async saveMetadata(metadataPath, sceneIndex, metadata) {
    try {
      // Ensure the directory exists
      await this.ensureDirectoryExists(path.dirname(metadataPath));
      
      // Prepare metadata object
      const metadataObj = {
        [`scene_${sceneIndex}`]: {
          ...metadata,
          savedAt: new Date().toISOString()
        }
      };
      
      // Write metadata file
      await fs.writeFile(
        metadataPath,
        JSON.stringify(metadataObj, null, 2)
      );
      
      logger.info(`Metadata saved to: ${metadataPath}`);
      return true;
    } catch (error) {
      logger.error('Error saving metadata:', error);
      throw error;
    }
  }

  async createVideoOutput(jobId, sceneId, videoData) {
    const trx = await knex.transaction();
    
    try {
      logger.info(`Creating video output record for job ${jobId}, scene ${sceneId}`);
      logger.debug('Video data:', JSON.stringify(videoData, null, 2));

      // Get paths for the video output
      const { outputDir, videoPath, metadataPath } = this.getOutputPaths(
        jobId,
        sceneId,
        videoData.fileName
      );

      // Move video file if it exists
      if (videoData.tempFilePath) {
        await this.moveVideoFile(videoData.tempFilePath, videoPath);
      }

      // Prepare database record with required fields
      const record = {
        job_id: jobId,
        scene_id: sceneId,
        file_path: videoPath,
        storage_key: videoData.storage_key,
        public_url: videoData.public_url,
        created_at: new Date(),
      };

      // Add optional fields based on model type (add more information for ray-1.5)
      if (videoData.videoPrompt) {
        record.video_prompt = videoData.videoPrompt;
      }
      if (videoData.cameraMovement) {
        record.camera_movement = videoData.cameraMovement;
      }
      if (videoData.aspectRatio) {
        record.aspect_ratio = videoData.aspectRatio;
      }

      // Add metadata
      record.metadata = JSON.stringify({
        fileName: videoData.fileName,
        generatedAt: new Date().toISOString(),
        fileSize: fsSync.statSync(videoPath).size,
        model: config.videoGen.model,
        resolution: config.videoGen.resolution,
        ...videoData.metadata
      });

      // Insert record into database
      const [videoOutput] = await trx(this.tableName)
        .insert(record)
        .returning('*');

      // Save metadata file
      const metadataObj = {
        videoId: videoOutput.video_id,
        fileName: videoData.fileName,
        filePath: videoPath,
        storageKey: videoData.storage_key,
        publicUrl: videoData.public_url,
        model: config.videoGen.model,
        ...videoData.metadata
      };

      // Add optional metadata fields based on model type
      if (videoData.videoPrompt) {
        metadataObj.videoPrompt = videoData.videoPrompt;
      }
      if (videoData.cameraMovement) {
        metadataObj.cameraMovement = videoData.cameraMovement;
      }
      if (videoData.aspectRatio) {
        metadataObj.aspectRatio = videoData.aspectRatio;
      }

      await this.saveMetadata(metadataPath, sceneId, metadataObj);

      await trx.commit();
      logger.info(`Video output record created with ID: ${videoOutput.video_id}`);

      // Return camelCase version for API response
      return {
        ...videoOutput,
        videoId: videoOutput.video_id,
        jobId: videoOutput.job_id,
        sceneId: videoOutput.scene_id,
        filePath: videoOutput.file_path,
        storageKey: videoOutput.storage_key,
        publicUrl: videoOutput.public_url,
        videoPrompt: videoOutput.video_prompt,
        cameraMovement: videoOutput.camera_movement,
        aspectRatio: videoOutput.aspect_ratio,
        createdAt: videoOutput.created_at,
        metadata: typeof videoOutput.metadata === 'string' 
          ? JSON.parse(videoOutput.metadata)
          : videoOutput.metadata
      };

    } catch (error) {
      await trx.rollback();
      logger.error('Error creating video output record:', error);
      throw error;
    }
  }

  async getVideosByJobId(jobId) {
    try {
      logger.info(`Retrieving all videos for job ${jobId}`);
      
      const videos = await knex(this.tableName)
        .where({ job_id: jobId })
        .orderBy(['scene_id', 'created_at']);

      logger.info(`Retrieved ${videos.length} videos for job ${jobId}`);
      return videos;

    } catch (error) {
      logger.error(`Error retrieving videos for job ${jobId}:`, error);
      throw error;
    }
  }

  async getVideoBySceneId(sceneId) {
    try {
      const video = await knex(this.tableName)
        .where('scene_id', sceneId)
        .first();

      if (!video) {
        return null;
      }

      // Return camelCase version for API response
      return {
        ...video,
        videoId: video.video_id,
        jobId: video.job_id,
        sceneId: video.scene_id,
        filePath: video.file_path,
        storageKey: video.storage_key,
        publicUrl: video.public_url,
        videoPrompt: video.video_prompt,
        cameraMovement: video.camera_movement,
        aspectRatio: video.aspect_ratio,
        createdAt: video.created_at,
        metadata: typeof video.metadata === 'string' 
          ? JSON.parse(video.metadata)
          : video.metadata
      };
    } catch (error) {
      logger.error('Error getting video by scene ID:', error);
      throw error;
    }
  }

  async updateVideoMetadata(videoId, metadata) {
    const trx = await knex.transaction();
    
    try {
      logger.info(`Updating metadata for video ${videoId}`);

      // Get existing video record
      const video = await trx(this.tableName)
        .where({ video_id: videoId })
        .first();

      if (!video) {
        throw new Error(`Video with ID ${videoId} not found`);
      }

      // Update database record
      const [updated] = await trx(this.tableName)
        .where({ video_id: videoId })
        .update({
          metadata: JSON.stringify({
            ...JSON.parse(video.metadata),
            ...metadata,
            updatedAt: new Date().toISOString()
          })
        })
        .returning('*');

      // If video file exists, update the metadata file
      if (video.video_file_url) {
        const metadataPath = path.join(
          path.dirname(video.video_file_url),
          'metadata.json'
        );

        try {
          const existingMetadata = JSON.parse(
            await fs.readFile(metadataPath, 'utf8')
          );
          
          const sceneKey = Object.keys(existingMetadata)[0];
          
          await this.saveMetadata(
            metadataPath,
            parseInt(sceneKey.split('_')[1]),
            {
              ...existingMetadata[sceneKey],
              ...metadata,
              updatedAt: new Date().toISOString()
            }
          );
        } catch (metadataError) {
          logger.warn(`Could not update metadata file: ${metadataError.message}`);
        }
      }

      await trx.commit();
      logger.info(`Video ${videoId} metadata updated successfully`);
      return updated;

    } catch (error) {
      await trx.rollback();
      logger.error(`Error updating metadata for video ${videoId}:`, error);
      throw error;
    }
  }

  async deleteVideo(videoId) {
    const trx = await knex.transaction();
    
    try {
      logger.info(`Deleting video ${videoId}`);

      // Get video record
      const video = await trx(this.tableName)
        .where({ video_id: videoId })
        .first();

      if (!video) {
        throw new Error(`Video with ID ${videoId} not found`);
      }

      // Delete video file if it exists
      if (video.video_file_url) {
        try {
          await fs.unlink(video.video_file_url);
          logger.info(`Deleted video file: ${video.video_file_url}`);

          // Try to delete metadata file
          const metadataPath = path.join(
            path.dirname(video.video_file_url),
            'metadata.json'
          );
          await fs.unlink(metadataPath);
          logger.info(`Deleted metadata file: ${metadataPath}`);

          // Try to remove empty directories
          const dirPath = path.dirname(video.video_file_url);
          await this.removeEmptyDirectories(dirPath);

        } catch (fileError) {
          logger.warn(`Error deleting video files: ${fileError.message}`);
        }
      }

      // Delete database record
      await trx(this.tableName)
        .where({ video_id: videoId })
        .del();

      await trx.commit();
      logger.info(`Video ${videoId} deleted successfully`);
      return true;

    } catch (error) {
      await trx.rollback();
      logger.error(`Error deleting video ${videoId}:`, error);
      throw error;
    }
  }

  async removeEmptyDirectories(dirPath) {
    try {
      const baseDir = this.baseOutputDir;
      let currentDir = dirPath;

      while (currentDir.startsWith(baseDir) && currentDir !== baseDir) {
        const files = await fs.readdir(currentDir);
        if (files.length === 0) {
          await fs.rmdir(currentDir);
          logger.info(`Removed empty directory: ${currentDir}`);
          currentDir = path.dirname(currentDir);
        } else {
          break;
        }
      }
    } catch (error) {
      logger.warn(`Error removing empty directories: ${error.message}`);
    }
  }

  async validateVideoFile(videoPath) {
    try {
      const stats = await fs.stat(videoPath);
      if (stats.size === 0) {
        throw new Error('Video file is empty');
      }
      return true;
    } catch (error) {
      logger.error(`Error validating video file ${videoPath}:`, error);
      throw error;
    }
  }
}

module.exports = new VideoDataAccess();