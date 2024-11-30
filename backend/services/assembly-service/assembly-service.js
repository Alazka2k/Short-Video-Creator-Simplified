const Json2Video = require('json2video-sdk');
const assemblyDataAccess = require('./data/assemblyDataAccess');
const logger = require('../../shared/utils/logger');
const config = require('../../shared/utils/config');
const path = require('path');

class AssemblyService {
  constructor() {
    if (!config.assembly || !config.assembly.apiKey) {
      throw new Error('Assembly API key not found in configuration');
    }
    
    this.json2video = Json2Video({
      apiKey: config.assembly.apiKey
    });
    this.mediaBaseUrl = process.env.MEDIA_BASE_URL || config.services.gateway?.url || 'http://localhost:3000/media';
    
    logger.info(`Assembly Provider: ${config.assembly.provider}`);
    logger.info(`Assembly API Key: ${config.assembly.apiKey ? 'Loaded' : 'Missing'}`);
  }

  async init() {
    logger.info('Initializing Assembly Service');
    try {
      // Validate configuration
      if (!config.assembly.provider === 'json2video') {
        throw new Error('Invalid assembly provider configuration');
      }
      logger.info('Assembly Service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Assembly Service:', error);
      throw error;
    }
  }

  convertLocalPathToUrl(localPath, jobId) {
    // Remove the base output directory from the path
    const relativePath = localPath.replace(config.output.directory, '');
    // Convert backslashes to forward slashes if needed
    const normalizedPath = relativePath.replace(/\\/g, '/');
    // Get date from path
    const dateMatch = normalizedPath.match(/\d{4}-\d{2}-\d{2}/);
    const date = dateMatch ? dateMatch[0] : '';
    // Extract scene number if present
    const sceneMatch = normalizedPath.match(/scene_(\d+)/);
    const sceneNumber = sceneMatch ? sceneMatch[1] : '';
    
    // Construct URL with correct path structure
    const urlPath = sceneNumber 
      ? `${date}/${jobId}/scene_${sceneNumber}`
      : `${date}/${jobId}`;
      
    return `${this.mediaBaseUrl}/${urlPath}/${path.basename(normalizedPath)}`;
  }

  generateProjectConfig(jobId, scenes) {
    return {
      elements: {
        scenes: scenes.map(scene => ({
          duration: scene.duration,
          transition: scene.transition,
          layers: [
            {
              type: "video",
              source: this.convertLocalPathToUrl(scene.videoUrl, jobId),
              position: "center"
            },
            {
              type: "audio",
              source: this.convertLocalPathToUrl(scene.voiceUrl, jobId),
              volume: 1
            }
          ]
        })),
        soundtrack: scenes[0]?.musicUrl ? {
          source: this.convertLocalPathToUrl(scenes[0].musicUrl, jobId),
          volume: 0.3
        } : undefined
      },
      output: {
        format: "mp4",
        resolution: "1080p",
        aspectRatio: "9:16",
        fps: 30
      }
    };
  }

  async createVideoProject(jobId, scenes) {
    try {
      // Create project configuration
      const projectConfig = this.generateProjectConfig(jobId, scenes);

      // Create project in JSON2Video
      const project = await this.json2video.createProject(projectConfig);

      // Store in database
      const assemblyOutput = await assemblyDataAccess.createAssemblyOutput(jobId, {
        status: 'processing',
        projectId: project.id,
        assemblyConfig: projectConfig,
        metadata: { scenes: scenes.length }
      });

      // Start rendering
      await this.json2video.render(project.id);

      return assemblyOutput;
    } catch (error) {
      logger.error('Error in createVideoProject:', error);
      throw error;
    }
  }

  async getProjectStatus(jobId) {
    try {
      const assembly = await assemblyDataAccess.getAssemblyByJobId(jobId);
      if (!assembly) {
        throw new Error(`No assembly found for job ID: ${jobId}`);
      }

      const status = await this.json2video.getProjectStatus(assembly.project_id);
      return status;
    } catch (error) {
      logger.error('Error checking project status:', error);
      throw error;
    }
  }

  async close() {
    logger.info('Closing Assembly Service');
    // Add any cleanup logic here if needed
  }
}

module.exports = new AssemblyService(); 