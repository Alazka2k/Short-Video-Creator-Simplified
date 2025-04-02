const knex = require('knex')(require('../../../../knexfile')[process.env.NODE_ENV]);
const path = require('path');
const fs = require('fs').promises;
const logger = require('../../../shared/utils/logger');
const config = require('../../../shared/utils/config');

class ImageDataAccess {
  constructor() {
    this.storageBasePath = path.join(config.output.directory, 'image');
  }

  async createImageOutput(jobId, sceneId, imageData) {
    try {
      // Validate jobId
      if (!jobId || typeof jobId !== 'string' || !this.isValidUUID(jobId)) {
        throw new Error(`Invalid jobId: ${jobId}`);
      }

      // Create relative and full paths
      const dateFolder = new Date().toISOString().split('T')[0];
      const relativePath = path.join(dateFolder, jobId, `scene_${sceneId}`);
      const fullPath = path.join(this.storageBasePath, relativePath);

      // Ensure directory exists
      await fs.mkdir(fullPath, { recursive: true });

      // Define file name and path
      const fileName = `image_scene_${sceneId}.png`;
      const filePath = path.join(fullPath, fileName);

      // Copy the temporary file to its final location
      await fs.copyFile(imageData.tempFilePath, filePath);

      // Create database record
      const [imageRecord] = await knex('image_outputs')
        .insert({
          job_id: jobId,
          scene_id: sceneId,
          original_url: imageData.originalUrl,
          image_url: imageData.imageUrl,
          file_name: fileName,
          storage_key: imageData.storageKey,   // Add S3 storage key
          public_url: imageData.publicUrl,     // Add S3 public URL
          metadata: JSON.stringify(imageData.metadata)
        })
        .returning('*');

      /*logger.info('Created image output record:', {
        imageId: imageRecord.image_id,
        storageKey: imageData.storageKey
      });*/

      return imageRecord;

    } catch (error) {
      logger.error('Error creating image output:', error);
      throw error;
    }
  }

  async getImagesByJobId(jobId) {
    try {
      if (!this.isValidUUID(jobId)) {
        throw new Error(`Invalid jobId: ${jobId}`);
      }

      const images = await knex('image_outputs')
        .where('job_id', jobId)
        .orderBy('created_at');

      return images.map(image => ({
        ...image,
        metadata: JSON.parse(image.metadata)
      }));
    } catch (error) {
      logger.error('Error getting images by job ID:', error);
      throw error;
    }
  }

  async getImageBySceneId(sceneId) {
    try {
      const image = await knex('image_outputs')
        .where('scene_id', sceneId)
        .first();

      if (!image) {
        return null;
      }

      return {
        ...image,
        metadata: JSON.parse(image.metadata)
      };
    } catch (error) {
      logger.error('Error getting image by scene ID:', error);
      throw error;
    }
  }

  async updateImageMetadata(imageId, metadata) {
    try {
      // Get existing record
      const existingImage = await knex('image_outputs')
        .where('image_id', imageId)
        .first();

      if (!existingImage) {
        throw new Error(`Image not found with ID: ${imageId}`);
      }

      // Merge existing metadata with new metadata
      const existingMetadata = JSON.parse(existingImage.metadata);
      const updatedMetadata = {
        ...existingMetadata,
        ...metadata,
        updatedAt: new Date().toISOString()
      };

      // Update record
      const [updated] = await knex('image_outputs')
        .where('image_id', imageId)
        .update({
          metadata: JSON.stringify(updatedMetadata),
          updated_at: knex.fn.now()
        })
        .returning('*');

      return {
        ...updated,
        metadata: JSON.parse(updated.metadata)
      };
    } catch (error) {
      logger.error('Error updating image metadata:', error);
      throw error;
    }
  }

  async deleteImage(imageId) {
    try {
      // Get image record
      const image = await knex('image_outputs')
        .where('image_id', imageId)
        .first();

      if (!image) {
        throw new Error(`Image not found with ID: ${imageId}`);
      }

      // Delete physical file if metadata contains path
      if (image.metadata) {
        const metadata = JSON.parse(image.metadata);
        if (metadata.fullPath) {
          try {
            await fs.unlink(metadata.fullPath);
            logger.info(`Deleted physical file: ${metadata.fullPath}`);
          } catch (fileError) {
            logger.warn(`Could not delete physical file: ${metadata.fullPath}`, fileError);
          }
        }
      }

      // Delete database record
      await knex('image_outputs')
        .where('image_id', imageId)
        .del();

      logger.info(`Deleted image record with ID: ${imageId}`);
      return true;
    } catch (error) {
      logger.error('Error deleting image:', error);
      throw error;
    }
  }

  isValidUUID(uuid) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }
}

module.exports = new ImageDataAccess();