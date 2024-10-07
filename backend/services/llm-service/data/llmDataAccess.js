// File: backend/services/llm-service/data/llmDataAccess.js

const knex = require('knex')(require('../../../../knexfile')[process.env.NODE_ENV]);
const logger = require('../../../shared/utils/logger');

class LLMDataAccess {
    async createJob() {
        try {
          const [job] = await knex('jobs').insert({
            status: 'pending',
            service_sequence: JSON.stringify(['llm']),
            metadata: JSON.stringify({})
          }).returning('*');
          return job.job_id;
        } catch (error) {
          logger.error('Error creating job:', error);
          throw error;
        }
      }
    
      async createInput(jobId, prompt, parameters) {
        try {
          const [llmInput] = await knex('llm_inputs').insert({
            job_id: jobId,
            prompt: prompt,
            parameters: JSON.stringify(parameters)
          }).returning('*');
          return llmInput.llm_input_id;
        } catch (error) {
          logger.error('Error creating LLM input:', error);
          throw error;
        }
      }
    
      async createOutput(jobId, llmInputId, prompt, title, description, hashtags, musicTitle, musicLyrics, musicTags) {
        try {
          const [llmOutput] = await knex('llm_outputs').insert({
            job_id: jobId,
            llm_input_id: llmInputId,
            prompt: prompt,
            title: title,
            description: description,
            hashtags: hashtags,
            music_title: musicTitle,
            music_lyrics: musicLyrics,
            music_tags: musicTags
          }).returning('*');
          return llmOutput.llm_output_id;
        } catch (error) {
          logger.error('Error creating LLM output:', error);
          throw error;
        }
      }

  async createScene(llmOutputId, sceneNumber, description, visualPrompt, videoPrompt, cameraMovement) {
    try {
      return await knex('llm_scenes').insert({
        llm_output_id: llmOutputId,
        scene_number: sceneNumber,
        description: description,
        visual_prompt: visualPrompt,
        video_prompt: videoPrompt,
        camera_movement: cameraMovement
      }).returning('scene_id');
    } catch (error) {
      logger.error('Error creating LLM scene:', error);
      throw error;
    }
  }
}

module.exports = new LLMDataAccess();