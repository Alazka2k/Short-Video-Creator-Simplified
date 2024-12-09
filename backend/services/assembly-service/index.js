const AssemblyService = require('./assembly-service');
const createServer = require('./server');
const logger = require('../../shared/utils/logger');
const config = require('../../shared/utils/config');

class AssemblyServiceInterface {
  constructor() {
    logger.info('Constructing AssemblyServiceInterface');
    this.service = new AssemblyService();
    logger.info('AssemblyService instance created');
  }

  async initialize() {
    try {
      logger.info('Initializing AssemblyServiceInterface');
      await this.service.init();
      logger.info('AssemblyServiceInterface initialized');
    } catch (error) {
      logger.error('Failed to initialize AssemblyServiceInterface:', error);
      throw error;
    }
  }

  async generateContent(jobId, scenes) {
    try {
      logger.info(`Generating assembled video for job: ${jobId}`);
      
      // Validate input
      if (!jobId || !scenes || !Array.isArray(scenes)) {
        throw new Error('Invalid input parameters');
      }

      // Validate each scene
      scenes.forEach((scene, index) => {
        if (!scene.sceneId || typeof scene.duration !== 'number') {
          throw new Error(`Invalid scene configuration at index ${index}`);
        }
      });

      return await this.service.createVideoProject(jobId, scenes);
    } catch (error) {
      logger.error('Error in generateContent:', error);
      throw error;
    }
  }

  async getStatus(jobId) {
    try {
      logger.info(`Getting assembly status for job: ${jobId}`);
      return await this.service.getProjectStatus(jobId);
    } catch (error) {
      logger.error('Error getting assembly status:', error);
      throw error;
    }
  }

  async cleanup() {
    try {
      logger.info('Cleaning up AssemblyServiceInterface');
      await this.service.close();
    } catch (error) {
      logger.error('Error during cleanup:', error);
      throw error;
    }
  }
}

async function startServer() {
  try {
    logger.info('Starting Assembly Service');
    const assemblyServiceInterface = new AssemblyServiceInterface();
    await assemblyServiceInterface.initialize();

    const PORT = process.env.ASSEMBLY_SERVICE_PORT || 3007;
    const app = createServer(assemblyServiceInterface);

    app.listen(PORT, () => {
      logger.info(`Assembly Service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start Assembly Service:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = { AssemblyServiceInterface, startServer };