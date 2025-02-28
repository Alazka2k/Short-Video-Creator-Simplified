const creatomate = require('creatomate');
const assemblyDataAccess = require('./data/assemblyDataAccess');
const jobDataAccess = require('../job-service/data/jobDataAccess');
const logger = require('../../shared/utils/logger');
const config = require('../../shared/utils/config');
const path = require('path');
const storageService = require('../../shared/utils/storage');
const fs = require('fs').promises;
const _ = require('lodash');

class AssemblyService {
  constructor() {
    if (!config.assembly?.apiKey) {
      throw new Error('Assembly API key not found in configuration');
    }
    
    this.apiKey = config.assembly.apiKey;
    this.client = new creatomate.Client(this.apiKey);
    logger.info('Assembly Service initialized with API key');
  }

  async init() {
    logger.info('Initializing Assembly Service');
    try {
      if (config.assembly.provider.toLowerCase() !== 'creatomate') {
        throw new Error('Invalid assembly provider configuration');
      }
      logger.info('Assembly Service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Assembly Service:', error);
      throw error;
    }
  }

  async createVideoProject(assemblyId, jobId, templateId) {
    try {
      logger.info('Creating video project:', { assemblyId, jobId, templateId });

      // Get job data
      const jobData = await jobDataAccess.getJob(jobId);
      if (!jobData) {
        throw new Error(`Job not found: ${jobId}`);
      }
      logger.info('Retrieved job data:', { jobId, status: jobData.status });

      // Get template configuration
      const templateConfig = await this.getTemplateConfig(templateId);
      if (!templateConfig) {
        throw new Error('Template configuration not found');
      }
      logger.info('Retrieved template configuration:', { 
        templateId, 
        sceneCount: templateConfig.sceneAmount,
        aspectRatio: templateConfig.aspectRatio 
      });

      // Validate template compatibility with job content
      await this.validateTemplateCompatibility(jobData, templateConfig);
      logger.info('Template compatibility validated successfully');

      // Map job content to template modifications
      const modifications = await this.mapJobContentToModifications(jobData, templateConfig);
      logger.info('Job content mapped to modifications:', { 
        modificationKeys: Object.keys(modifications),
        sceneCount: templateConfig.sceneAmount
      });

      // Construct webhook URL
      const webhookUrl = `${config.assembly.webhookBaseUrl}/api/assembly/webhook`;
      logger.info('Using webhook URL:', { webhookUrl });

      // Start the render process
      logger.info('Starting render with Creatomate:', {
        jobId,
        templateId,
        assemblyId,
        webhookUrl,
        modifications: Object.keys(modifications)
      });

      const renderResponse = await this.client.render({
        templateId: templateId,
        modifications: modifications,
        webhook_url: webhookUrl,
        metadata: JSON.stringify({
          jobId,
          assemblyId,
          templateId
        })
      });

      logger.info('Render started successfully:', {
        assemblyId,
        jobId,
        renderId: renderResponse.id
      });

      // Update assembly record with render ID
      await assemblyDataAccess.updateAssemblyOutput(assemblyId, {
        project_id: renderResponse.id,
        status: 'processing',
        metadata: {
          renderId: renderResponse.id,
          startTime: new Date().toISOString()
        }
      });

      return {
        assemblyId,
        status: 'processing',
        renderId: renderResponse.id
      };
    } catch (error) {
      logger.error('Error creating video project:', {
        error: error.message,
        stack: error.stack,
        assemblyId,
        jobId,
        templateId
      });
      throw error;
    }
  }

  async getTemplateConfig(templateId) {
    try {
      // Read template configuration from template-select-option.json
      const templateConfigPath = path.join(__dirname, '../../../frontend/src/data/video-creation/assembly/template-select-option.json');
      const templateConfigData = await fs.readFile(templateConfigPath, 'utf8');
      const templateConfig = JSON.parse(templateConfigData);

      // Find the template configuration by templateId
      const template = templateConfig.options.find(opt => opt.templateId === templateId);
      if (!template) {
        throw new Error(`Template configuration not found for templateId: ${templateId}`);
      }

      return template;
    } catch (error) {
      logger.error('Error getting template configuration:', error);
      throw error;
    }
  }

  async validateTemplateCompatibility(jobData, template) {
    try {
      const { templateContent, aspectRatio, sceneAmount } = template;

      // Check if job has the required number of scenes
      if (!jobData.metadata?.scenes || !Array.isArray(jobData.metadata.scenes)) {
        throw new Error('Job data does not contain any scenes');
      }

      const jobSceneCount = jobData.metadata.scenes.length;
      if (jobSceneCount !== sceneAmount) {
        throw new Error(`Scene count mismatch. Template requires ${sceneAmount} scenes, but job has ${jobSceneCount} scenes`);
      }

      // Check if job has required content types, ignoring 'text' since it's always generated
      const jobContentTypes = new Set();
      jobData.metadata.scenes.forEach(scene => {
        if (scene.video) jobContentTypes.add('video');
        if (scene.image) jobContentTypes.add('image');
        if (scene.voice) jobContentTypes.add('voice');
        if (scene.animation) jobContentTypes.add('animation');
      });

      // Filter out 'text' from content validation since it's always generated
      const requiredContentTypes = templateContent.filter(type => type !== 'text');
      
      // For video content, either video OR animation is acceptable
      const hasVideoContent = jobContentTypes.has('video') || jobContentTypes.has('animation');
      const nonVideoContentTypes = requiredContentTypes.filter(type => type !== 'video' && type !== 'animation');
      
      // Check for missing non-video content types
      const missingTypes = nonVideoContentTypes.filter(type => !jobContentTypes.has(type));
      
      // If video/animation is required but neither is present, add to missing types
      if (requiredContentTypes.includes('video') && !hasVideoContent) {
        missingTypes.push('video or animation');
      }

      if (missingTypes.length > 0) {
        throw new Error(`Missing required content types: ${missingTypes.join(', ')}`);
      }

      // Check aspect ratio compatibility
      const jobAspectRatio = jobData.metadata?.parameters?.llmGenParams?.image?.aspectRatio;
      
      if (jobAspectRatio && jobAspectRatio !== aspectRatio) {
        throw new Error(`Aspect ratio mismatch. Template requires ${aspectRatio}, but job has ${jobAspectRatio}`);
      }

      // Validate that each scene has the required content based on modification properties
      for (let i = 0; i < sceneAmount; i++) {
        const scene = jobData.metadata.scenes[i];
        if (!scene) {
          throw new Error(`Missing scene at index ${i}`);
        }

        // Check each modification property for this scene
        for (const [key, config] of Object.entries(template.modificationProperties)) {
          if (key.includes(`Scene-${i + 1}`)) {
            const { allowedContent } = config;
            // For each scene, check if at least one of the allowed types is present
            const hasRequiredContent = allowedContent.some(type => {
              const lowerType = type.toLowerCase();
              if (lowerType === 'text') {
                // For text content, check in llmResult.scenes
                return jobData.metadata?.llmResult?.scenes?.[i]?.description;
              }
              return scene[lowerType];
            });
            
            if (!hasRequiredContent) {
              throw new Error(`Scene ${i + 1} is missing required content. At least one of these types is required: ${allowedContent.join(' or ')}`);
            }
          }
        }
      }

      return true;
    } catch (error) {
      logger.error('Template compatibility validation failed:', error);
      throw error;
    }
  }

  getContentTypeFromScene(scene, allowedContent) {
    for (const type of allowedContent) {
      if (scene[type.toLowerCase()]) {
        return type;
      }
    }
    return null;
  }

  async mapJobContentToModifications(jobData, template) {
    try {
      logger.info('Starting content mapping with job data:', {
        jobId: jobData.job_id,
        hasMetadata: !!jobData.metadata,
        sceneCount: jobData.metadata?.scenes?.length,
        firstScene: jobData.metadata?.scenes?.[0] || null
      });

      const modifications = {};

      // Get LLM result properties for text content
      const llmProperties = await assemblyDataAccess.getLLMResultProperties(jobData.job_id, { includeScenes: true });
      logger.info('Retrieved LLM properties for content mapping:', {
        hasTitle: !!llmProperties.title,
        hasDescription: !!llmProperties.description,
        hasScenes: !!llmProperties.scenes
      });

      // Map each modification property from template to job content
      for (const [key, config] of Object.entries(template.modificationProperties)) {
        const { keyPath, type, allowedContent } = config;
        logger.info(`Processing modification for ${key}:`, { keyPath, type, allowedContent });

        // Handle array of keyPaths
        let sceneContent = null;
        let usedPath = null;

        // For text type, first try to get content from LLM properties
        if (type === 'text') {
          // Check if this is a scene-specific text
          const sceneMatch = key.match(/Text-Scene-(\d+)/);
          if (sceneMatch) {
            const sceneNum = parseInt(sceneMatch[1]);
            // Access description directly from llmResult.scenes array
            sceneContent = jobData.metadata?.llmResult?.scenes?.[sceneNum - 1]?.description;
            logger.info(`Attempting to get scene ${sceneNum} description:`, {
              hasLLMResult: !!jobData.metadata?.llmResult,
              hasScenes: !!jobData.metadata?.llmResult?.scenes,
              sceneIndex: sceneNum - 1,
              foundDescription: !!sceneContent
            });
          } else {
            // For non-scene text, check global properties
            const propertyMatch = keyPath.match(/metadata\.llmResult\.(\w+)/);
            if (propertyMatch) {
              const property = propertyMatch[1];
              sceneContent = llmProperties[property];
            }
          }

          if (sceneContent) {
            modifications[key] = sceneContent;
            logger.info(`Added text content for ${key} from LLM properties`);
            continue;
          }
        }

        // If not text type or text content not found in LLM properties, proceed with normal path lookup
        if (Array.isArray(keyPath)) {
          // Try each keyPath until we find content
          for (const path of keyPath) {
            const content = _.get(jobData, path);
            if (content) {
              sceneContent = content;
              usedPath = path;
              logger.info(`Found content using keyPath: ${path}`, { key });
              break;
            }
          }
        } else {
          sceneContent = _.get(jobData, keyPath);
          usedPath = keyPath;
        }

        if (!sceneContent) {
          const error = `Required content not found for ${key}. Tried paths: ${Array.isArray(keyPath) ? keyPath.join(', ') : keyPath}`;
          logger.error(error);
          throw new Error(error);
        }

        // For text type that wasn't found in LLM properties
        if (type === 'text') {
          modifications[key] = sceneContent;
          logger.info(`Added text content for ${key} from job data`);
          continue;
        }

        // Extract the content source type from the used path
        let contentSource;
        const sceneContentMatch = usedPath.match(/scenes\[\d+\]\.(\w+)\.publicUrl/);
        const globalContentMatch = usedPath.match(/metadata\.(\w+)\.publicUrl/);
        
        if (sceneContentMatch) {
          contentSource = sceneContentMatch[1];
        } else if (globalContentMatch) {
          contentSource = globalContentMatch[1];
        } else {
          const error = `Could not determine content source type from path: ${usedPath}`;
          logger.error(error);
          throw new Error(error);
        }

        // Verify the content source is allowed
        if (!allowedContent.includes(contentSource)) {
          const error = `Content source ${contentSource} not allowed for ${key}. Allowed sources: ${allowedContent.join(', ')}`;
          logger.error(error);
          throw new Error(error);
        }

        // Get file extension from URL, removing any query parameters
        const urlWithoutParams = sceneContent.split('?')[0];
        const fileExtension = urlWithoutParams.split('.').pop().toLowerCase();
        let isValidFileType = false;

        switch (type) {
          case 'video':
            isValidFileType = ['mp4', 'mov', 'avi', 'webm'].includes(fileExtension);
            break;
          case 'audio':
            isValidFileType = ['mp3', 'wav', 'ogg', 'm4a'].includes(fileExtension);
            break;
          case 'image':
            isValidFileType = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension);
            break;
          default:
            // For any other types, assume valid
            isValidFileType = true;
        }

        if (!isValidFileType) {
          const validExtensions = {
            video: ['mp4', 'mov', 'avi', 'webm'],
            audio: ['mp3', 'wav', 'ogg', 'm4a'],
            image: ['jpg', 'jpeg', 'png', 'gif', 'webp']
          };
          const expectedExtensions = validExtensions[type] || [];
          const error = `Invalid file type for ${key}. Expected ${type} file (${expectedExtensions.join(', ')}) but got extension .${fileExtension}`;
          logger.error(error);
          throw new Error(error);
        }

        // Use the URL directly since it's already a signed URL
        modifications[key] = sceneContent;
        logger.info(`Added URL for ${key} from ${contentSource} source with file type ${type}`);
      }

      logger.info('Completed content mapping with modifications:', { 
        modificationKeys: Object.keys(modifications)
      });

      return modifications;
    } catch (error) {
      logger.error('Error mapping job content to modifications:', error);
      throw error;
    }
  }

  async close() {
    logger.info('Closing Assembly Service');
  }
}

module.exports = AssemblyService;