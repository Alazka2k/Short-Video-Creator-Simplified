const { Movie, Scene } = require('json2video-sdk');
const assemblyDataAccess = require('./data/assemblyDataAccess');
const logger = require('../../shared/utils/logger');
const config = require('../../shared/utils/config');
const path = require('path');

class AssemblyService {
  constructor() {
    if (!config.assembly || !config.assembly.apiKey) {
      throw new Error('Assembly API key not found in configuration');
    }
    
    this.mediaBaseUrl = process.env.MEDIA_BASE_URL || config.services.gateway?.url || 'http://localhost:3000/media';
    
    logger.info(`Assembly Provider: ${config.assembly.provider}`);
    logger.info(`Assembly API Key: ${config.assembly.apiKey ? 'Loaded' : 'Missing'}`);
  }

  async init() {
    logger.info('Initializing Assembly Service');
    try {
      if (config.assembly.provider.toLowerCase() !== 'json2video') {
        throw new Error('Invalid assembly provider configuration');
      }
      logger.info('Assembly Service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Assembly Service:', error);
      throw error;
    }
  }

  async createVideoProject(jobId, sceneConfigs) {
    try {
      logger.info(`Creating video project for job: ${jobId}`);

      // Validate all required assets exist
      const validation = await assemblyDataAccess.validateAssemblyAssets(jobId);
      if (!validation.isValid) {
        throw new Error('Missing required assets for video assembly');
      }

      // Initialize movie project
      const movie = new Movie();
      movie.setAPIKey(config.assembly.apiKey);
      movie.set("quality", "high");

      // Get and process all scenes in order
      const scenes = await assemblyDataAccess.getAllScenes(jobId);
      
      for (const sceneData of scenes) {
        const sceneConfig = sceneConfigs.find(config => config.sceneNumber === sceneData.scene_number);
        if (!sceneConfig) {
          throw new Error(`Missing configuration for scene ${sceneData.scene_number}`);
        }

        const assets = await assemblyDataAccess.getSceneAssets(jobId, sceneData.scene_id);
        const scene = await this.createScene(assets, sceneConfig);
        movie.addScene(scene);
      }

      // Add background music if available
      const musicAsset = await assemblyDataAccess.getMusicAsset(jobId);
      if (musicAsset) {
        movie.set("soundtrack", {
          source: this.getMediaUrl(musicAsset.music_file_url),
          volume: 0.3
        });
      }

      // Set output configuration
      movie.set("format", "mp4");
      movie.set("resolution", "1080p");
      movie.set("aspect-ratio", "9:16");
      movie.set("fps", 30);

      // Start rendering
      const render = await movie.render();
      logger.info(`Render started for job ${jobId}, project ID: ${render.movie.id}`);

      // Create assembly record
      const assemblyOutput = await assemblyDataAccess.createAssemblyOutput(jobId, {
        status: 'processing',
        projectId: render.movie.id,
        assemblyConfig: movie.getConfig(),
        metadata: { 
          scenes: scenes.length,
          startedAt: new Date().toISOString()
        }
      });

      // Start progress monitoring
      this.monitorRenderProgress(movie, jobId, render.movie.id);

      return assemblyOutput;
    } catch (error) {
      logger.error('Error in createVideoProject:', error);
      throw error;
    }
  }

  async createScene(assets, sceneConfig) {
    const scene = new Scene();
    
    // Add video layer
    scene.addElement({
      type: "video",
      source: this.getMediaUrl(assets.video.video_file_url),
      duration: sceneConfig.duration,
      position: "center"
    });

    // Add voice layer
    scene.addElement({
      type: "audio",
      source: this.getMediaUrl(assets.voice.voice_file_url),
      volume: 1
    });

    // Add transition if specified
    if (sceneConfig.transition) {
      scene.set("transition", sceneConfig.transition);
    }

    return scene;
  }

  async monitorRenderProgress(movie, jobId, projectId) {
    try {
      await movie
        .waitToFinish((status) => {
          logger.info(`Render progress for job ${jobId}: ${status.movie.status} - ${status.movie.message}`);
        })
        .then(async (status) => {
          logger.info(`Render completed for job ${jobId}: ${status.movie.url}`);
          const assembly = await assemblyDataAccess.getAssemblyByJobId(jobId);
          await assemblyDataAccess.updateVideoUrl(assembly.assembly_id, status.movie.url);
        })
        .catch(async (error) => {
          logger.error(`Render failed for job ${jobId}:`, error);
          const assembly = await assemblyDataAccess.getAssemblyByJobId(jobId);
          await assemblyDataAccess.updateAssemblyStatus(assembly.assembly_id, 'failed', {
            error: error.message,
            failedAt: new Date().toISOString()
          });
        });
    } catch (error) {
      logger.error(`Error monitoring render progress for job ${jobId}:`, error);
    }
  }

  async getProjectStatus(jobId) {
    try {
      const assembly = await assemblyDataAccess.getAssemblyByJobId(jobId);
      if (!assembly) {
        throw new Error(`No assembly found for job ID: ${jobId}`);
      }

      const movie = new Movie();
      movie.setAPIKey(config.assembly.apiKey);
      const status = await movie.getStatus(assembly.project_id);
      return status;
    } catch (error) {
      logger.error('Error checking project status:', error);
      throw error;
    }
  }

  getMediaUrl(relativePath) {
    if (!relativePath) {
      throw new Error('Invalid relative path');
    }
    // Ensure the path uses forward slashes
    const normalizedPath = relativePath.replace(/\\/g, '/');
    return `${this.mediaBaseUrl}${normalizedPath}`;
  }

  async close() {
    logger.info('Closing Assembly Service');
  }
}

module.exports = AssemblyService;