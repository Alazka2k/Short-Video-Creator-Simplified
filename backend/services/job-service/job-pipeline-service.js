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
    this.baseOutputPath = path.join(config.output.directory, 'integration');
    logger.info('JobPipelineService initialized with JobDataAccess');
  }

  getJobOutputPath(jobId, date = new Date()) {
    const dateString = date.toISOString().split('T')[0];
    return path.join(this.baseOutputPath, dateString, jobId);
  }

  getSceneOutputPath(jobOutputDir, sceneIndex) {
    return path.join(jobOutputDir, `scene_${sceneIndex}`);
  }

  async ensureOutputDirectories(jobOutputDir, scenesCount) {
    try {
      // Create base job directory
      await fs.mkdir(jobOutputDir, { recursive: true });

      // Create scene directories
      for (let i = 1; i <= scenesCount; i++) {
        await fs.mkdir(this.getSceneOutputPath(jobOutputDir, i), { recursive: true });
      }
      logger.info(`Created output directories in ${jobOutputDir}`);
    } catch (error) {
      logger.error('Error creating output directories:', error);
      throw error;
    }
  }

  async generateContent(prompt, parameters = {}, visualizationType = 'animation') {
    const jobId = uuidv4();
    const jobOutputDir = this.getJobOutputPath(jobId);
    
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

      // Step 1: Generate LLM content - Pass jobId to LLM service
      logger.info('Starting LLM content generation...');
      const llmResult = await this.services.llm.process(
        parameters.llmGenParams,
        prompt,
        false,
        jobId  // Pass the jobId to LLM service
      );

      // Ensure we have scenes to process
      if (!llmResult?.content?.scenes?.length) {
        throw new Error('LLM service did not generate any scenes');
      }

      // Create output directories
      await this.ensureOutputDirectories(jobOutputDir, llmResult.content.scenes.length);

      // Process each scene
      const sceneResults = [];
      for (let i = 0; i < llmResult.content.scenes.length; i++) {
        const sceneId = i + 1;
        const scene = llmResult.content.scenes[i];
        const sceneDir = this.getSceneOutputPath(jobOutputDir, sceneId);

        try {
          logger.info(`Processing scene ${sceneId}...`, {
            jobId,
            sceneId,
            sceneDir
          });

          // Step 2: Generate voice for scene
          logger.info(`Generating voice for scene ${sceneId}`);
          const voiceResult = await this.services.voice.process(
            scene.description,
            sceneId,
            jobId,  // Use the same jobId
            parameters.voiceGenParams?.voiceId
          );
          await this.jobDataAccess.updateJobProgress(jobId, 'voice', 'completed', {
            sceneId,
            outputPath: voiceResult.filePath
          });

          // Step 3: Generate image for scene
          logger.info(`Generating image for scene ${sceneId}`);
          const imageResult = await this.services.image.process(
            scene.visual_prompt,
            sceneId,
            jobId
          );
          await this.jobDataAccess.updateJobProgress(jobId, 'image', 'completed', {
            sceneId,
            outputPath: imageResult.filePath
          });

          // Step 4: Generate either animation or video
          logger.info(`Generating ${visualizationType} for scene ${sceneId}`);
          let visualResult;
          
          if (visualizationType === 'animation') {
            visualResult = await this.services.animation.process(
              imageResult.filePath,
              scene.video_prompt,
              sceneId,
              jobId,
              {
                animationLength: parameters.animationGenParams?.animationLength || 5,
                animationPrompt: scene.video_prompt
              }
            );
            await this.jobDataAccess.updateJobProgress(jobId, 'animation', 'completed', {
              sceneId,
              outputPath: visualResult.filePath
            });
          } else {
            visualResult = await this.services.video.process(
              imageResult.filePath,
              scene.video_prompt,
              scene.camera_movement,
              parameters.videoGenParams?.aspectRatio || '9:16',
              sceneId,
              jobId
            );
            await this.jobDataAccess.updateJobProgress(jobId, 'video', 'completed', {
              sceneId,
              outputPath: visualResult.filePath
            });
          }

          // Save scene results and metadata
          const sceneResult = {
            sceneId,
            voice: voiceResult,
            image: imageResult,
            [visualizationType]: visualResult
          };
          sceneResults.push(sceneResult);

          await fs.writeFile(
            path.join(sceneDir, 'metadata.json'),
            JSON.stringify({
              sceneId,
              description: scene.description,
              voice: {
                filePath: voiceResult?.filePath || null,
                fileName: voiceResult?.filePath ? path.basename(voiceResult.filePath) : null
              },
              image: {
                filePath: imageResult?.filePath || null,
                fileName: imageResult?.filePath ? path.basename(imageResult.filePath) : null,
                metadata: imageResult?.metadata || {}
              },
              [visualizationType]: {
                filePath: visualResult?.filePath || null,
                fileName: visualResult?.filePath ? path.basename(visualResult.filePath) : null,
                metadata: visualResult?.metadata || {}
              }
            }, null, 2)
          );

        } catch (sceneError) {
          logger.error(`Error processing scene ${sceneId}:`, sceneError);
          await this.jobDataAccess.updateJobProgress(jobId, 'scene', 'failed', {
            sceneId,
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
      const projectMetadata = {
        jobId,
        prompt,
        status: 'completed',
        parameters,
        visualizationType,
        llmResult: llmResult.content,
        scenes: sceneResults,
        // music: musicResult
      };

      await fs.writeFile(
        path.join(jobOutputDir, 'project_metadata.json'),
        JSON.stringify(projectMetadata, null, 2)
      );

      // Update job status to completed
      await this.jobDataAccess.updateJob(jobId, {
        status: 'completed',
        metadata: JSON.stringify({
          ...projectMetadata,
          endTime: new Date().toISOString()
        })
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
        const errorData = {
          status: 'failed',
          metadata: JSON.stringify({
            error: error.message,
            errorStack: error.stack,
            endTime: new Date().toISOString()
          })
        };
        await this.jobDataAccess.updateJob(jobId, errorData);
      } catch (updateError) {
        logger.error('Error updating job status:', updateError);
      }
      
      throw error;
    }
  }

  async getJobStatus(jobId) {
    try {
      const job = await this.jobDataAccess.getJob(jobId);
      if (!job) {
        throw new Error(`Job not found: ${jobId}`);
      }
      return job;
    } catch (error) {
      logger.error(`Error getting job status for ${jobId}:`, error);
      throw error;
    }
  }

  async getAllJobs(filters = {}) {
    try {
      return await this.jobDataAccess.getAllJobs(filters);
    } catch (error) {
      logger.error('Error getting all jobs:', error);
      throw error;
    }
  }

  async deleteJob(jobId) {
    try {
      return await this.jobDataAccess.deleteJob(jobId);
    } catch (error) {
      logger.error(`Error deleting job ${jobId}:`, error);
      throw error;
    }
  }

  async getJobsStats() {
    try {
      return await this.jobDataAccess.getJobsStats();
    } catch (error) {
      logger.error('Error getting jobs stats:', error);
      throw error;
    }
  }
}

module.exports = JobPipelineService;