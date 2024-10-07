const knex = require('knex')(require('../../../../knexfile')[process.env.NODE_ENV]);
const logger = require('../../../shared/utils/logger');

class LLMDataAccess {
    async createJob(jobId, status = 'pending', serviceSequence = [], metadata = {}) {
        try {
            const [job] = await knex('jobs').insert({
                job_id: jobId,
                status: status,
                service_sequence: JSON.stringify(serviceSequence),
                metadata: JSON.stringify(metadata)
            }).returning('*');
            return job.job_id;
        } catch (error) {
            logger.error('Error creating job:', error);
            throw new Error(`Failed to create job: ${error.message}`);
        }
    }

    async createInput(jobId, prompt, parameters) {
        try {
          const [llmInput] = await knex('llm_inputs').insert({
            job_id: jobId,
            prompt: prompt,
            parameters: JSON.stringify(parameters)
          }).returning('*');
          
          logger.info('LLM input created in database:', {
            table: 'llm_inputs',
            jobId: jobId,
            llmInputId: llmInput.llm_input_id,
            prompt: prompt.substring(0, 50) + '...', // Log only the first 50 characters of the prompt
            parameters: JSON.stringify(parameters)
          });
          
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

            logger.info('LLM output created in database:', {
                table: 'llm_outputs',
                jobId: jobId,
                llm_input_id: llmInputId,
                prompt: prompt.substring(0, 50) + '...', // Log only the first 50 characters of the prompt
                title: title,
                description: description,
                hashtags: hashtags,
                music_title: musicTitle,
                music_lyrics: musicLyrics,
                music_tags: musicTags
              });

            return llmOutput.llm_output_id;
        } catch (error) {
            logger.error('Error creating LLM output:', error);
            throw new Error(`Failed to create LLM output: ${error.message}`);
        }
    }

    async createScene(llmOutputId, sceneNumber, description, visualPrompt, videoPrompt, cameraMovement) {
        try {
            const [scene] = await knex('llm_scenes').insert({
                llm_output_id: llmOutputId,
                scene_number: sceneNumber,
                description: description,
                visual_prompt: visualPrompt,
                video_prompt: videoPrompt,
                camera_movement: cameraMovement
            }).returning('*');
            
            logger.info('LLM scene created in database:', {
                table: 'llm_scenes',
                llm_output_id: llmOutputId,
                scene_number: sceneNumber,
                description: description,
                visual_prompt: visualPrompt,
                video_prompt: videoPrompt,
                camera_movement: cameraMovement
              });

            return scene.scene_id;
        } catch (error) {
            logger.error('Error creating LLM scene:', error);
            throw new Error(`Failed to create LLM scene: ${error.message}`);
        }
    }
}

module.exports = new LLMDataAccess();