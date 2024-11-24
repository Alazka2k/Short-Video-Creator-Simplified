// backend/services/job-service/job-pipeline-service.js

const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const logger = require('../../shared/utils/logger');
const jobDataAccess = require('./data/jobDataAccess');
const config = require('../../shared/utils/config');

class JobPipelineService {
  constructor(services) {
    this.services = services;
    this.jobDataAccess = jobDataAccess;
    logger.info('JobPipelineService initialized with JobDataAccess');
  }

  async generateContent(prompt, parameters = {}, visualizationType = 'animation') {
    const jobId = uuidv4();
    
    try {
      logger.info(`Starting content generation job ${jobId} for prompt: ${prompt}`);
      
      // Create initial job record
      await this.jobDataAccess.createJob({
        jobId,
        prompt,
        status: 'in_progress',
        parameters,
        visualizationType,
        startTime: new Date().toISOString()
      });

      logger.info(`Created job record with ID: ${jobId}`);
      logger.info('Starting LLM content generation...');

      // Step 1: Generate LLM content
      const llmResult = await this.services.llm.process(
        parameters.llmGenParams,
        prompt,
        false
      );

      // Create base output directory
      const currentDate = new Date().toISOString().split('T')[0];
      const jobOutputDir = path.join(config.output.directory, currentDate, jobId);
      await fs.mkdir(jobOutputDir, { recursive: true });

      // Process each scene
      const sceneResults = [];
      for (let i = 0; i < llmResult.content.scenes.length; i++) {
        const sceneIndex = i + 1;
        const scene = llmResult.content.scenes[i];
        const sceneDir = path.join(jobOutputDir, `scene_${sceneIndex}`);
        await fs.mkdir(sceneDir, { recursive: true });

        try {
          logger.info(`Processing scene ${sceneIndex}...`);

          // Step 2: Generate voice for scene
          logger.info(`Generating voice for scene ${sceneIndex}`);
          const voiceResult = await this.services.voice.process(
            scene.description,
            sceneIndex,
            jobId,
            parameters.voiceGenParams?.voiceId
          );
          await this.jobDataAccess.updateJobProgress(jobId, 'voice', 'completed', {
            sceneIndex,
            outputPath: voiceResult.filePath
          });

          // Step 3: Generate image for scene
          logger.info(`Generating image for scene ${sceneIndex}`);
          const imageResult = await this.services.image.process(
            scene.visual_prompt,
            sceneIndex,
            jobId
          );
          await this.jobDataAccess.updateJobProgress(jobId, 'image', 'completed', {
            sceneIndex,
            outputPath: imageResult.filePath
          });

          // Step 4: Generate either animation or video
          logger.info(`Generating ${visualizationType} for scene ${sceneIndex}`);
          let visualResult;
          
          if (visualizationType === 'animation') {
            visualResult = await this.services.animation.process(
              imageResult.filePath,
              scene.video_prompt,
              sceneIndex,
              jobId,
              {
                animationLength: parameters.animationGenParams?.animationLength || 5,
                animationPrompt: scene.video_prompt
              }
            );
            await this.jobDataAccess.updateJobProgress(jobId, 'animation', 'completed', {
              sceneIndex,
              outputPath: visualResult.filePath
            });
          } else {
            visualResult = await this.services.video.process(
              imageResult.filePath,
              scene.video_prompt,
              scene.camera_movement,
              parameters.videoGenParams?.aspectRatio || '9:16',
              sceneIndex,
              jobId
            );
            await this.jobDataAccess.updateJobProgress(jobId, 'video', 'completed', {
              sceneIndex,
              outputPath: visualResult.filePath
            });
          }

          // Save scene results
          sceneResults.push({
            sceneIndex,
            voice: voiceResult,
            image: imageResult,
            [visualizationType]: visualResult
          });

          // Save scene metadata
          await fs.writeFile(
            path.join(sceneDir, 'metadata.json'),
            JSON.stringify({
              sceneIndex,
              description: scene.description,
              voice: {
                filePath: voiceResult.filePath,
                fileName: path.basename(voiceResult.filePath)
              },
              image: {
                filePath: imageResult.filePath,
                fileName: path.basename(imageResult.filePath),
                metadata: imageResult.metadata
              },
              [visualizationType]: {
                filePath: visualResult.filePath,
                fileName: path.basename(visualResult.filePath),
                metadata: visualResult.metadata
              }
            }, null, 2)
          );

        } catch (sceneError) {
          logger.error(`Error processing scene ${sceneIndex}:`, sceneError);
          await this.jobDataAccess.updateJobProgress(jobId, 'scene', 'failed', {
            sceneIndex,
            error: sceneError.message
          });
          throw sceneError;
        }
      }

      // Step 5: Generate background music (commented out for now)
      /*
      logger.info('Generating background music');
      const musicResult = await this.services.music.process(
        jobId,
        {
          title: llmResult.content.music.title,
          lyrics: llmResult.content.music.lyrics,
          tags: llmResult.content.music.tags,
          instrumental: parameters.musicGenParams?.instrumental || true
        }
      );
      await this.jobDataAccess.updateJobProgress(jobId, 'music', 'completed', {
        outputPath: musicResult.filePath
      });
      */

      // Save project metadata
      await fs.writeFile(
        path.join(jobOutputDir, 'project_metadata.json'),
        JSON.stringify({
          jobId,
          prompt,
          status: 'completed',
          parameters,
          visualizationType,
          llmResult: llmResult.content,
          scenes: sceneResults,
          // music: musicResult
        }, null, 2)
      );

      // Update job status to completed
      await this.jobDataAccess.updateJob(jobId, {
        status: 'completed',
        endTime: new Date().toISOString()
      });

      logger.info(`Job ${jobId} completed successfully`);
      return {
        jobId,
        status: 'completed',
        outputDir: jobOutputDir,
        content: {
          llm: llmResult.content,
          scenes: sceneResults
        }
      };

    } catch (error) {
      logger.error(`Error in job ${jobId}:`, error);
      
      try {
        await this.jobDataAccess.updateJob(jobId, {
          status: 'failed',
          error: error.message,
          endTime: new Date().toISOString()
        });
      } catch (updateError) {
        logger.error('Error updating job status:', updateError);
      }
      
      throw error;
    }
  }

  async getJobStatus(jobId) {
    return await this.jobDataAccess.getJob(jobId);
  }

  async getAllJobs(filters = {}) {
    return await this.jobDataAccess.getAllJobs(filters);
  }

  async deleteJob(jobId) {
    return await this.jobDataAccess.deleteJob(jobId);
  }

  async getJobsStats() {
    return await this.jobDataAccess.getJobsStats();
  }
}

module.exports = JobPipelineService;