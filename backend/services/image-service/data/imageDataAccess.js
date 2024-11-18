const knex = require('knex')(require('../../../../knexfile')[process.env.NODE_ENV]);
const logger = require('../../../shared/utils/logger');
const path = require('path');
const fs = require('fs').promises;
const config = require('../../../shared/utils/config');

class ImageDataAccess {
  constructor() {
    this.storageBasePath = path.join(config.output.directory, 'image');
  }

  async createImageOutput(jobId, sceneId, imageData) {
    try {
      // Save physical file
      const dateFolder = new Date().toISOString().split('T')[0];
      const relativePath = path.join(dateFolder, jobId, `scene_${sceneId}`);
      const fullPath = path.join(this.storageBasePath, relativePath);

      // Ensure directory exists
      await fs.mkdir(fullPath, { recursive: true });

      // Save the image file
      const fileName = `image_scene_${sceneId}.png`;
      const filePath = path.join(fullPath, fileName);
      await fs.copyFile(imageData.tempFilePath, filePath);

      // Create database record
      if (typeof jobId !== 'string' || !isValidUUID(jobId)) {
        throw new Error(`Invalid jobId: ${jobId}`);
      }

      const [imageRecord] = await knex('image_outputs').insert({
        job_id: jobId,
        scene_id: sceneId,
        original_url: imageData.originalUrl,
        image_url: imageData.imageUrl,
        file_name: fileName,
        metadata: JSON.stringify({
          relativePath: relativePath,
          fullPath: filePath,
          ...imageData.metadata
        })
      }).returning('*');

      logger.info(`Created image output record: ${imageRecord.image_id}`);
      return imageRecord;
    } catch (error) {
      logger.error('Error creating image output:', error);
      throw error;
    }
  }

  async getImagesByJobId(jobId) {
    try {
      const images = await knex('image_outputs')
        .where('job_id', jobId)
        .orderBy('created_at');
      return images;
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
      return image;
    } catch (error) {
      logger.error('Error getting image by scene ID:', error);
      throw error;
    }
  }

  async updateImageMetadata(imageId, metadata) {
    try {
      const [updated] = await knex('image_outputs')
        .where('image_id', imageId)
        .update({
          metadata: JSON.stringify(metadata),
          updated_at: knex.fn.now()
        })
        .returning('*');
      return updated;
    } catch (error) {
      logger.error('Error updating image metadata:', error);
      throw error;
    }
  }

  async deleteImage(imageId) {
    try {
      const image = await knex('image_outputs')
        .where('image_id', imageId)
        .first();

      if (image && image.metadata) {
        const metadata = JSON.parse(image.metadata);
        if (metadata.fullPath) {
          await fs.unlink(metadata.fullPath);
        }
      }

      await knex('image_outputs')
        .where('image_id', imageId)
        .del();

      logger.info(`Deleted image with ID: ${imageId}`);
    } catch (error) {
      logger.error('Error deleting image:', error);
      throw error;
    }
  }
}

function isValidUUID(uuid) {
  // Regex to check if the string is a valid UUID
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

module.exports = new ImageDataAccess();