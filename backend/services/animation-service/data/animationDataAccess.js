// backend/services/animation-service/data/animationDataAccess.js

const { pool } = require('../../../shared/config/database');
const logger = require('../../../shared/utils/logger');

class AnimationDataAccess {
  async createAnimationOutput(jobId, sceneId, animationData) {
    try {
      logger.info(`Creating animation output record for job ${jobId}, scene ${sceneId}`);
      
      const query = `
        INSERT INTO animation_outputs 
        (job_id, scene_id, original_pattern, animation_file_url, metadata)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;

      const values = [
        jobId,
        sceneId,
        animationData.originalPattern,
        animationData.tempFilePath,
        JSON.stringify({
          fileName: animationData.fileName,
          duration: animationData.duration,
          generatedAt: new Date().toISOString()
        })
      ];

      const result = await pool.query(query, values);
      logger.info(`Animation output record created successfully: ${result.rows[0].animation_id}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating animation output record:', error);
      throw error;
    }
  }

  async getAnimationsByJobId(jobId) {
    try {
      const query = 'SELECT * FROM animation_outputs WHERE job_id = $1 ORDER BY scene_id';
      const result = await pool.query(query, [jobId]);
      return result.rows;
    } catch (error) {
      logger.error(`Error getting animations for job ${jobId}:`, error);
      throw error;
    }
  }

  async getAnimationBySceneId(sceneId) {
    try {
      const query = 'SELECT * FROM animation_outputs WHERE scene_id = $1';
      const result = await pool.query(query, [sceneId]);
      return result.rows[0];
    } catch (error) {
      logger.error(`Error getting animation for scene ${sceneId}:`, error);
      throw error;
    }
  }

  async updateAnimationMetadata(animationId, metadata) {
    try {
      const query = `
        UPDATE animation_outputs 
        SET metadata = $1
        WHERE animation_id = $2
        RETURNING *
      `;
      const result = await pool.query(query, [JSON.stringify(metadata), animationId]);
      return result.rows[0];
    } catch (error) {
      logger.error(`Error updating animation metadata for ID ${animationId}:`, error);
      throw error;
    }
  }

  async deleteAnimation(animationId) {
    try {
      const query = 'DELETE FROM animation_outputs WHERE animation_id = $1';
      await pool.query(query, [animationId]);
      return true;
    } catch (error) {
      logger.error(`Error deleting animation ${animationId}:`, error);
      throw error;
    }
  }
}

module.exports = new AnimationDataAccess();