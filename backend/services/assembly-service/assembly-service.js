const { Movie, Scene } = require('json2video-sdk');
const assemblyDataAccess = require('./data/assemblyDataAccess');
const logger = require('../../shared/utils/logger');
const config = require('../../shared/utils/config');
const path = require('path');
const storageService = require('./data/storageService');

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

      // Get all scenes first
      const scenes = await assemblyDataAccess.getAllScenes(jobId);
      logger.info('Found scenes in database:', {
        jobId,
        sceneCount: scenes.length,
        scenes: scenes.map(s => ({
          sceneNumber: s.scene_number,
          sceneId: s.scene_id
        }))
      });

      // Initialize movie project
      const movie = new Movie();
      movie.setAPIKey(config.assembly.apiKey);
      movie.set("quality", "high");

      // Process each scene config in order
      for (const sceneConfig of sceneConfigs) {
        // Find the corresponding scene from database
        const dbScene = scenes.find(s => s.scene_id === sceneConfig.sceneNumber);
        
        if (!dbScene) {
          logger.error('Scene not found in database:', {
            jobId,
            requestedSceneNumber: sceneConfig.sceneNumber,
            availableScenes: scenes.map(s => s.scene_number)
          });
          throw new Error(`Scene ${sceneConfig.sceneNumber} not found in database`);
        }

        logger.info('Processing scene:', {
          jobId,
          sceneId: sceneConfig.sceneNumber,
          llmSceneId: dbScene.llm_scene_id,
          duration: sceneConfig.duration,
          transition: sceneConfig.transition
        });

        // Get assets using scene_id from database
        const assets = await assemblyDataAccess.getSceneAssets(jobId, sceneConfig.sceneNumber);
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
    
    // Get temporary URLs that are valid only for assembly duration
    const videoUrl = await storageService.getSignedUrl(assets.video.storage_key, 7200); // 2 hours
    const voiceUrl = await storageService.getSignedUrl(assets.voice.storage_key, 7200);
    
    logger.info('Creating scene with secure URLs:', {
      sceneNumber: sceneConfig.sceneNumber,
      duration: sceneConfig.duration
    });

    scene.addElement({
      type: "video",
      source: videoUrl,
      duration: sceneConfig.duration
    });

    scene.addElement({
      type: "audio",
      source: voiceUrl,
      volume: 1
    });

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