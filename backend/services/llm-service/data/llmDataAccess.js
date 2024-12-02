const knex = require('knex')(require('../../../../knexfile')[process.env.NODE_ENV]);
const logger = require('../../../shared/utils/logger');
const llmFileHandler = require('../../../shared/utils/llmFileHandler');
const { v4: uuidv4 } = require('uuid');

class LLMDataAccess {
    async createJob(jobId, prompt, status = 'pending', serviceSequence = [], metadata = {}) {
      try {
        const [job] = await knex('jobs').insert({
          job_id: jobId,
          prompt: prompt,
          status: status,
          service_sequence: JSON.stringify(serviceSequence),
          metadata: JSON.stringify(metadata)
        }).returning('*');
        
        // Create initial output file
        await llmFileHandler.saveOutputFile(jobId, {
          prompt,
          status,
          metadata,
          parameters: {}  // Will be updated when input is created
        });
        
        logger.info('Job created:', {
          table: 'jobs',
          jobId: job.job_id,
          status: job.status,
          prompt: prompt.substring(0, 50) + '...'
        });
        
        return job.job_id;
      } catch (error) {
        logger.error('Error creating job:', error);
        throw error;
      }
    }
  
    async updateJobStatus(jobId, status) {
      try {
        await knex('jobs').where('job_id', jobId).update({ status });
        await llmFileHandler.updateJobStatus(jobId, status);
        
        logger.info('Job status updated:', {
          table: 'jobs',
          jobId,
          newStatus: status
        });
      } catch (error) {
        logger.error('Error updating job status:', error);
        throw error;
      }
    }
  
    async createInput(jobId, parameters) {
      try {
        const [job] = await knex('jobs').where('job_id', jobId).select('prompt');
        
        if (!job) {
          throw new Error(`Job with id ${jobId} not found`);
        }

        const [llmInput] = await knex('llm_inputs').insert({
          job_id: jobId,
          prompt: job.prompt,
          parameters: JSON.stringify(parameters)
        }).returning('*');
        
        // Update file with input parameters
        const existingData = await llmFileHandler.readOutputFile(jobId);
        await llmFileHandler.saveOutputFile(jobId, {
          ...existingData,
          parameters
        });
        
        logger.info('LLM input created:', {
          table: 'llm_inputs',
          jobId,
          llmInputId: llmInput.llm_input_id,
          prompt: job.prompt.substring(0, 50) + '...'
        });
        
        return llmInput.llm_input_id;
      } catch (error) {
        logger.error('Error creating LLM input:', error);
        throw error;
      }
    }

    async createOutput(jobId, llmInputId, title, description, hashtags, musicTitle, musicLyrics, musicTags) {
        try {
            const [llmOutput] = await knex('llm_outputs').insert({
                job_id: jobId,  // Use only the jobId from the job service
                llm_input_id: llmInputId,
                title,
                description,
                hashtags,
                music_title: musicTitle,
                music_lyrics: musicLyrics,
                music_tags: musicTags
            }).returning('*');

            // Update output file with generated content
            await llmFileHandler.saveOutputFile(jobId, {
                ...(await llmFileHandler.readOutputFile(jobId)),
                title,
                description,
                hashtags,
                music_title: musicTitle,
                music_lyrics: musicLyrics,
                music_tags: musicTags
            });

            logger.info('LLM output created:', {
                table: 'llm_outputs',
                jobId,
                llmInputId,
                title
            });

            return llmOutput.llm_output_id;
        } catch (error) {
            logger.error('Error creating LLM output:', error);
            throw error;
        }
    }

    async createScene(jobId, llmOutputId, sceneId, description, visualPrompt, videoPrompt, cameraMovement, visualMetadata = {}) {
        try {
            const metadata = typeof visualMetadata === 'string' 
                ? JSON.parse(visualMetadata) 
                : visualMetadata;

            const [scene] = await knex('llm_scenes').insert({
                job_id: jobId,  // Use only the jobId from the job service
                llm_output_id: llmOutputId,
                scene_id: sceneId,
                description,
                visual_prompt: visualPrompt,
                video_prompt: videoPrompt,
                camera_movement: cameraMovement,
                visual_metadata: JSON.stringify(metadata)
            }).returning('*');
            
            // Update output file with scene data
            await llmFileHandler.updateSceneData(jobId, {
                scene_id: scene.llm_scene_id,
                scene_number: sceneId,
                description,
                visual_prompt: visualPrompt,
                video_prompt: videoPrompt,
                camera_movement: cameraMovement,
                visual_metadata: metadata
            });

            logger.info('LLM scene created:', {
                table: 'llm_scenes',
                jobId,
                llmOutputId,
                sceneId,
                visualMetadata: metadata
            });

            return scene.llm_scene_id;
        } catch (error) {
            logger.error('Error creating LLM scene:', error);
            throw error;
        }
    }

    async getScenesForJob(jobId) {
        try {
            const scenes = await knex('llm_scenes')
                .where('job_id', jobId)
                .orderBy('scene_number')
                .select('*');

            // Parse the visual_metadata for each scene
            const parsedScenes = scenes.map(scene => ({
                ...scene,
                visual_metadata: scene.visual_metadata ? JSON.parse(scene.visual_metadata) : {}
            }));

            logger.info(`Retrieved ${scenes.length} scenes for job ${jobId}`);
            return parsedScenes;
        } catch (error) {
            logger.error('Error retrieving scenes:', error);
            throw error;
        }
    }

    async getInputById(inputId) {
        try {
            const input = await knex('llm_inputs')
                .where('llm_input_id', inputId)
                .first();

            if (!input) {
                throw new Error(`LLM input with id ${inputId} not found`);
            }

            return input;
        } catch (error) {
            logger.error('Error retrieving LLM input:', error);
            throw error;
        }
    }
}

module.exports = new LLMDataAccess();