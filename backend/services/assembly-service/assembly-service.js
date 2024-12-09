const { Movie, Scene } = require('json2video-sdk');
const assemblyDataAccess = require('./data/assemblyDataAccess');
const logger = require('../../shared/utils/logger');
const config = require('../../shared/utils/config');
const path = require('path');
const storageService = require('../../shared/utils/storage');
const renderMonitor = require('./monitors/renderMonitor');
const fs = require('fs').promises;

class AssemblyService {
  constructor() {
    if (!config.assembly?.apiKey) {
      throw new Error('Assembly API key not found in configuration');
    }
    
    this.apiKey = config.assembly.apiKey;
    logger.info('Assembly Service initialized with API key');
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
      logger.info('Creating new Movie instance');
      const movie = new Movie();
      logger.info('Movie instance created:', {
        hasSetMethod: typeof movie.set === 'function',
        hasRenderMethod: typeof movie.render === 'function',
        methods: Object.getOwnPropertyNames(Object.getPrototypeOf(movie)),
        movieObject: JSON.stringify(movie, null, 2)
      });
      
      // Set API key
      try {
        if (!this.apiKey) {
          throw new Error('API key is not configured');
        }
        
        movie.setAPIKey(this.apiKey);
        logger.info('Movie project initialized with API key');
      } catch (error) {
        logger.error('Failed to set API key:', error);
        throw new Error(`Failed to initialize movie project: ${error.message}`);
      }

      // Set quality and output configuration first
      try {
        // Set only properties that are listed in the Movie instance
        const configSteps = [
          { key: 'quality', value: 'high' },
          { key: 'width', value: 1080 },
          { key: 'height', value: 1920 },
          { key: 'fps', value: 30 },
          { key: 'resolution', value: '1080p' },
          { key: 'exports', value: [{ 
            format: 'mp4',
            resolution: '1080p'
          }] }
        ];

        // The aspect ratio will be determined by width/height

        logger.info('Attempting to set movie configuration:', configSteps);

        // Set each property individually with logging
        for (const config of configSteps) {
          try {
            logger.info(`Setting ${config.key}:`, config.value);
            movie.set(config.key, config.value);
            logger.info(`Successfully set ${config.key}`);
          } catch (error) {
            logger.error(`Failed to set ${config.key}:`, {
              value: config.value,
              error: error.message || 'Unknown error',
              stack: error.stack
            });
            throw new Error(`Failed to set ${config.key}: ${error.message || 'Unknown error'}`);
          }
        }

        logger.info('Movie configuration completed successfully:', {
          movieInstance: {
            hasSetMethod: typeof movie.set === 'function',
            hasRenderMethod: typeof movie.render === 'function',
            movieObject: JSON.stringify(movie, null, 2)
          }
        });

      } catch (error) {
        logger.error('Failed to set movie configuration:', {
          error: error.message,
          stack: error.stack,
          movieInstance: {
            hasSetMethod: typeof movie.set === 'function',
            hasRenderMethod: typeof movie.render === 'function',
            movieObject: JSON.stringify(movie, null, 2)
          }
        });
        throw new Error(`Failed to configure movie settings: ${error.message}`);
      }

      // Process each scene
      logger.info(`Starting to process ${sceneConfigs.length} scenes`);

      // Store scene assets for configuration
      const sceneAssets = {};

      for (const sceneConfig of sceneConfigs) {
        try {
          const assets = await assemblyDataAccess.getSceneAssets(jobId, sceneConfig.sceneId);
          // Store assets for this scene
          sceneAssets[sceneConfig.sceneId] = assets;

          logger.info('Processing scene:', {
            sceneId: sceneConfig.sceneId,
            duration: sceneConfig.duration,
            transition: sceneConfig.transition,
            visualType: assets.visual.type,
            assets: {
              hasVisual: !!assets.visual.asset,
              hasVoice: !!assets.voice,
              visualType: assets.visual.type,
              visualUrl: assets.visual.asset?.public_url,
              voiceUrl: assets.voice?.public_url
            }
          });

          const scene = new Scene();

          // Set basic scene properties
          scene.set("duration", sceneConfig.duration);

          // Add visual element with transition
          if (assets.visual.asset) {
            try {
              const visualElement = {
                type: assets.visual.type === 'image' ? 'image' : 'video',
                source: assets.visual.asset.public_url,
                fit: "cover",
                position: "center"
              };

              // Add transition to the element if specified
              if (sceneConfig.transition) {
                visualElement.transition = typeof sceneConfig.transition === 'string' 
                  ? {
                      style: sceneConfig.transition,
                      duration: 1.0
                    }
                  : sceneConfig.transition;
              }
              
              logger.info('Adding visual element:', {
                sceneId: sceneConfig.sceneId,
                element: visualElement
              });
              
              scene.addElement(visualElement);
            } catch (error) {
              logger.error('Failed to add visual element:', {
                sceneId: sceneConfig.sceneId,
                error: error.message,
                visualType: assets.visual.type,
                url: assets.visual.asset.public_url
              });
              throw error;
            }
          }

          // Add voice if available
          if (assets.voice) {
            try {
              const audioElement = {
                type: "audio",
                source: assets.voice.public_url,
                volume: 1,
                loop: false
              };

              logger.info('Adding audio element:', {
                sceneId: sceneConfig.sceneId,
                element: audioElement
              });

              scene.addElement(audioElement);
            } catch (error) {
              logger.error('Failed to add audio element:', {
                sceneId: sceneConfig.sceneId,
                error: error.message,
                url: assets.voice.public_url
              });
              throw error;
            }
          }

          // Add scene to movie
          try {
            movie.addScene(scene);
            logger.info(`Added scene ${sceneConfig.sceneId} to movie`, {
              sceneConfig,
              sceneElements: scene.elements?.length || 0
            });
          } catch (error) {
            logger.error('Failed to add scene to movie:', {
              sceneId: sceneConfig.sceneId,
              error: error.message,
              scene: JSON.stringify(scene)
            });
            throw error;
          }

        } catch (error) {
          logger.error(`Error processing scene ${sceneConfig.sceneId}:`, {
            error: error.message,
            stack: error.stack,
            sceneConfig,
            fullError: error
          });
          throw error;
        }
      }

      logger.info(`Completed processing all ${sceneConfigs.length} scenes`);

      // Add background music if available
      const musicAsset = await assemblyDataAccess.getMusicAsset(jobId);
      if (musicAsset) {
        movie.set("soundtrack", {
          source: musicAsset.public_url,
          volume: 0.3,
          loop: true
        });
        logger.info('Added background music to movie');
      }

      // Start rendering
      logger.info('Starting movie render...');

      // Store configuration for database
      const movieConfig = {
        quality: "high",
        width: 1080,
        height: 1920,
        fps: 30,
        resolution: "1080p",
        exports: [{ 
          format: 'mp4',
          resolution: '1080p'
        }],
        scenes: sceneConfigs.map(scene => ({
          ...scene,
          elements: {
            visual: sceneAssets[scene.sceneId]?.visual?.asset?.public_url,
            voice: sceneAssets[scene.sceneId]?.voice?.public_url
          }
        }))
      };

      logger.info('Starting movie render with configuration:', movieConfig);

      try {
        // Start render
        const render = await movie.render();
        logger.info('Render response:', render);

        if (!render || !render.project) {
          throw new Error('Invalid render response: missing project ID');
        }

        const projectId = render.project;
        logger.info(`Render queued for job ${jobId}, project ID: ${projectId}`);

        // Create assembly record
        const assemblyOutput = await assemblyDataAccess.createAssemblyOutput(jobId, {
          status: 'processing',
          projectId: projectId,
          assemblyConfig: movieConfig,
          metadata: { 
            scenes: sceneConfigs.length,
            startedAt: new Date().toISOString()
          }
        });

        // Start progress monitoring using the dedicated monitor
        renderMonitor.monitorRender(movie, jobId, projectId);

        return assemblyOutput;
      } catch (error) {
        logger.error('Render failed:', {
          error: error.message,
          stack: error.stack,
          movieConfig,
          movieObject: JSON.stringify(movie, null, 2)
        });
        throw new Error(`Failed to start render: ${error.message}`);
      }

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

  async saveLocalOutput(jobId, videoUrl, metadata) {
    try {
      // Create output path structure
      const dateFolder = new Date().toISOString().split('T')[0];
      const outputPath = path.join(
        config.output.directory,
        'assembly',
        dateFolder,
        jobId
      );

      // Ensure directory exists
      await fs.mkdir(outputPath, { recursive: true });
      
      // Save metadata
      const metadataPath = path.join(outputPath, 'metadata.json');
      await fs.writeFile(
        metadataPath, 
        JSON.stringify({
          jobId,
          videoUrl,
          createdAt: new Date().toISOString(),
          ...metadata
        }, null, 2)
      );

      // Download and save video file
      if (videoUrl) {
        const videoPath = path.join(outputPath, 'assembled_video.mp4');
        const response = await fetch(videoUrl);
        const buffer = await response.buffer();
        await fs.writeFile(videoPath, buffer);
      }

      logger.info('Saved local output files:', {
        jobId,
        outputPath,
        files: ['metadata.json', 'assembled_video.mp4']
      });

      return {
        outputPath,
        metadataPath
      };
    } catch (error) {
      logger.error('Failed to save local output:', {
        jobId,
        error: error.message
      });
      // Don't throw - this is just for testing
    }
  }
}

module.exports = AssemblyService;