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
      
      // Get and validate service configuration
      const skipImage = parameters.serviceConfig?.skipImage ?? false;
      const skipVisualization = (skipImage || (parameters.serviceConfig?.skipVisualization ?? false));

      // Validate visualization type if visualization is not skipped
      if (!skipVisualization) {
        if (!visualizationType) {
          throw new Error('visualizationType is required when visualization is not skipped');
        }
        if (!['video', 'animation'].includes(visualizationType)) {
          throw new Error('visualizationType must be either "video" or "animation"');
        }
      }

      const serviceConfig = {
        skipVoice: parameters.serviceConfig?.skipVoice ?? false,
        skipMusic: parameters.serviceConfig?.skipMusic ?? false,
        skipImage,
        skipVisualization
      };

      // Create initial job record
      await this.jobDataAccess.createJob({
        jobId,
        prompt,
        status: 'in_progress',
        parameters: {
          ...parameters,
          serviceConfig  // Store the validated config
        },
        visualizationType: skipVisualization ? null : visualizationType,
        startTime: new Date().toISOString()
      });
      logger.info(`Created job record with ID: ${jobId}`);

      // Step 1: Generate LLM content
      logger.info('Starting LLM content generation...');
      const llmResult = await this.services.llm.process(
        parameters.llmGenParams,
        prompt,
        false,
        jobId
      );

      if (!llmResult?.content?.scenes?.length) {
        throw new Error('LLM service did not generate any scenes');
      }

      // Create output directories
      await this.ensureOutputDirectories(jobOutputDir, llmResult.content.scenes.length);

      // Start music generation early if not skipped
      let musicResult = null;
      if (!serviceConfig.skipMusic) {
        try {
          const musicPromise = this.services.music.process(
            jobId,
            {
              title: llmResult.content.music.title,
              prompt: llmResult.content.music.prompt,
              style: llmResult.content.music.style,
              lyrics: llmResult.content.music.lyrics,
              instrumental: parameters.musicGenParams?.instrumental ?? true
            }
          );

          // Set a timeout for music generation
          const musicTimeout = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Music generation timed out')), 300000); // 5 minutes
          });

          // Race between music generation and timeout
          musicResult = await Promise.race([musicPromise, musicTimeout])
            .catch(error => {
              logger.error('Error in music generation:', error);
              return null; // Return null on error to continue job
            });

          if (musicResult) {
            await this.jobDataAccess.updateJobProgress(jobId, 'music', 'completed', {
              filePath: musicResult.filePath,
              storage_key: musicResult.storage_key,
              public_url: musicResult.public_url,
              metadata: musicResult.metadata
            });
          } else {
            await this.jobDataAccess.updateJobProgress(jobId, 'music', 'failed', {
              error: 'Music generation failed or timed out'
            });
          }
        } catch (error) {
          logger.error('Error in music generation:', error);
          await this.jobDataAccess.updateJobProgress(jobId, 'music', 'failed', {
            error: error.message
          });
        }
      }

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

          // Generate voice and image in parallel
          const [voiceResult, imageResult] = await Promise.all([
            !serviceConfig.skipVoice ? this.services.voice.process(
              scene.description,
              sceneId,
              jobId,
              parameters.voiceGenParams?.voiceId
            ) : Promise.resolve(null),
            !serviceConfig.skipImage ? this.services.image.process(
              scene.visual_prompt,
              sceneId,
              jobId
            ) : Promise.resolve(null)
          ]);

          // Update progress for completed services
          if (voiceResult) {
            await this.jobDataAccess.updateJobProgress(jobId, 'voice', 'completed', {
              sceneId,
              filePath: voiceResult.filePath,
              storage_key: voiceResult.storage_key,
              public_url: voiceResult.public_url
            });
          }

          if (imageResult) {
            await this.jobDataAccess.updateJobProgress(jobId, 'image', 'completed', {
              sceneId,
              filePath: imageResult.filePath,
              storage_key: imageResult.storage_key,
              public_url: imageResult.public_url
            });
          }

          // Generate visual content (animation or video) if not skipped
          let visualResult = null;
          if (!serviceConfig.skipVisualization) {
            if (visualizationType === 'animation') {
              visualResult = await this.services.animation.process(
                imageResult.public_url,
                scene.video_prompt,
                sceneId,
                jobId,
                parameters.animationGenParams
              );
              await this.jobDataAccess.updateJobProgress(jobId, 'animation', 'completed', {
                sceneId,
                filePath: visualResult.filePath,
                storage_key: visualResult.storage_key,
                public_url: visualResult.public_url
              });
            } else {
              visualResult = await this.services.video.process(
                imageResult.public_url,
                scene.video_prompt,
                scene.camera_movement,
                parameters.videoGenParams?.aspectRatio || '16:9',
                sceneId,
                jobId
              );
              await this.jobDataAccess.updateJobProgress(jobId, 'video', 'completed', {
                sceneId,
                filePath: visualResult.filePath,
                storage_key: visualResult.storage_key,
                public_url: visualResult.public_url
              });
            }
          }

          // Save scene results
          const sceneResult = {
            sceneId,
            voice: voiceResult,
            image: imageResult,
            [visualizationType]: visualResult
          };
          sceneResults.push(sceneResult);

          // Save scene metadata
          await fs.writeFile(
            path.join(sceneDir, 'metadata.json'),
            JSON.stringify({
              sceneId,
              description: scene.description,
              voice: voiceResult ? {
                filePath: voiceResult.filePath,
                fileName: path.basename(voiceResult.filePath),
                storage_key: voiceResult.storage_key,
                public_url: voiceResult.public_url,
                metadata: voiceResult.metadata
              } : null,
              image: imageResult ? {
                filePath: imageResult.filePath,
                fileName: path.basename(imageResult.filePath),
                storage_key: imageResult.storage_key,
                public_url: imageResult.public_url,
                metadata: imageResult.metadata
              } : null,
              [visualizationType]: {
                filePath: visualResult.filePath,
                fileName: path.basename(visualResult.filePath),
                storage_key: visualResult.storage_key,
                public_url: visualResult.public_url,
                metadata: visualResult.metadata
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

      // Save project metadata
      const projectMetadata = {
        jobId,
        prompt,
        status: 'completed',
        parameters,
        visualizationType,
        llmResult: llmResult.content,
        scenes: sceneResults,
        music: musicResult ? {
          filePath: musicResult.filePath,
          fileName: musicResult.fileName,
          storage_key: musicResult.storage_key,
          public_url: musicResult.public_url,
          metadata: musicResult.metadata
        } : null
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
          scenes: sceneResults,
          music: musicResult
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

