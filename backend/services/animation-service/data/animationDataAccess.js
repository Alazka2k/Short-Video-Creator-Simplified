const knex = require('knex')(require('../../../../knexfile')[process.env.NODE_ENV]);
const logger = require('../../../shared/utils/logger');
const path = require('path');
const fs = require('fs').promises;
const config = require('../../../shared/utils/config');

class AnimationDataAccess {
  constructor() {
    this.storageBasePath = path.join(config.output.directory, 'animation');
  }

  async createAnimationOutput(jobId, sceneId, animationData) {
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

      // Copy the temporary file to its final location
      const filePath = path.join(fullPath, animationData.fileName);
      try {
        await fs.copyFile(animationData.tempFilePath, filePath);
        logger.info(`Copied animation file to: ${filePath}`);
      } catch (copyError) {
        logger.error('Error copying animation file:', copyError);
        throw new Error(`Failed to copy animation file: ${copyError.message}`);
      }

      // Prepare metadata
      const fullMetadata = {
        ...animationData.metadata,
        relativePath,
        fullPath: filePath,
        fileName: animationData.fileName,
        createdAt: new Date().toISOString()
      };

      try {
        // Create database record with storage information
        const [animationRecord] = await knex('animation_outputs')
          .insert({
            job_id: jobId,
            scene_id: sceneId,
            original_pattern: animationData.originalPattern,
            file_path: filePath,
            storage_key: animationData.storageKey,
            public_url: animationData.publicUrl,
            metadata: JSON.stringify(fullMetadata),
            created_at: knex.fn.now()
          })
          .returning('*');

        logger.info(`Created animation output record: ${animationRecord.animation_id}`);

        // Convert snake_case to camelCase in returned object
        return {
          animationId: animationRecord.animation_id,
          jobId: animationRecord.job_id,
          sceneId: animationRecord.scene_id,
          originalPattern: animationRecord.original_pattern,
          filePath: animationRecord.file_path,
          storageKey: animationRecord.storage_key,
          publicUrl: animationRecord.public_url,
          metadata: typeof animationRecord.metadata === 'string' 
            ? JSON.parse(animationRecord.metadata)
            : animationRecord.metadata,
          createdAt: animationRecord.created_at
        };
      } catch (dbError) {
        logger.error('Database error creating animation record:', dbError);
        // Clean up the copied file if database insertion fails
        try {
          await fs.unlink(filePath);
          logger.info(`Cleaned up file after database error: ${filePath}`);
        } catch (unlinkError) {
          logger.warn(`Failed to clean up file after database error: ${filePath}`, unlinkError);
        }
        throw dbError;
      }

    } catch (error) {
      const errorInfo = {
        message: error.message,
        code: error.code,
        stack: error.stack
      };
      logger.error('Error creating animation output:', errorInfo);
      throw error;
    }
  }

  async getAnimationsByJobId(jobId) {
    try {
      if (!this.isValidUUID(jobId)) {
        throw new Error(`Invalid jobId: ${jobId}`);
      }

      const animations = await knex('animation_outputs')
        .where('job_id', jobId)
        .orderBy('created_at');

      return animations.map(animation => ({
        ...animation,
        storageKey: animation.storage_key,
        publicUrl: animation.public_url,
        metadata: typeof animation.metadata === 'string' 
          ? JSON.parse(animation.metadata)
          : animation.metadata
      }));
    } catch (error) {
      logger.error('Error getting animations by job ID:', error);
      throw error;
    }
  }

  async getAnimationBySceneId(sceneId) {
    try {
      const animation = await knex('animation_outputs')
        .where('scene_id', sceneId)
        .first();

      if (!animation) {
        return null;
      }

      return {
        ...animation,
        storageKey: animation.storage_key,
        publicUrl: animation.public_url,
        metadata: typeof animation.metadata === 'string' 
          ? JSON.parse(animation.metadata)
          : animation.metadata
      };
    } catch (error) {
      logger.error('Error getting animation by scene ID:', error);
      throw error;
    }
  }

  async updateAnimationMetadata(animationId, metadata) {
    try {
      // Get existing record
      const existingAnimation = await knex('animation_outputs')
        .where('animation_id', animationId)
        .first();

      if (!existingAnimation) {
        throw new Error(`Animation not found with ID: ${animationId}`);
      }

      // Parse existing metadata if it's a string
      const existingMetadata = typeof existingAnimation.metadata === 'string'
        ? JSON.parse(existingAnimation.metadata)
        : existingAnimation.metadata;

      // Merge existing metadata with new metadata
      const updatedMetadata = {
        ...existingMetadata,
        ...metadata,
        updatedAt: new Date().toISOString()
      };

      // Update record
      const [updated] = await knex('animation_outputs')
        .where('animation_id', animationId)
        .update({
          metadata: JSON.stringify(updatedMetadata)
        })
        .returning('*');

      return {
        ...updated,
        metadata: typeof updated.metadata === 'string'
          ? JSON.parse(updated.metadata)
          : updated.metadata
      };
    } catch (error) {
      logger.error('Error updating animation metadata:', error);
      throw error;
    }
  }

  async deleteAnimation(animationId) {
    try {
      // Get animation record
      const animation = await knex('animation_outputs')
        .where('animation_id', animationId)
        .first();

      if (!animation) {
        throw new Error(`Animation not found with ID: ${animationId}`);
      }

      // Delete physical file if metadata contains path
      if (animation.metadata) {
        const metadata = typeof animation.metadata === 'string'
          ? JSON.parse(animation.metadata)
          : animation.metadata;

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
      await knex('animation_outputs')
        .where('animation_id', animationId)
        .del();

      logger.info(`Deleted animation record with ID: ${animationId}`);
      return true;
    } catch (error) {
      logger.error('Error deleting animation:', error);
      throw error;
    }
  }

  async updateStorageInfo(animationId, storageInfo) {
    try {
      const [updated] = await knex('animation_outputs')
        .where('animation_id', animationId)
        .update({
          storage_key: storageInfo.key,
          public_url: storageInfo.url
        })
        .returning('*');

      return {
        ...updated,
        storageKey: updated.storage_key,
        publicUrl: updated.public_url,
        metadata: typeof updated.metadata === 'string'
          ? JSON.parse(updated.metadata)
          : updated.metadata
      };
    } catch (error) {
      logger.error('Error updating storage info:', error);
      throw error;
    }
  }

  isValidUUID(uuid) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }
}

module.exports = new AnimationDataAccess();