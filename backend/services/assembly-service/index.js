const AssemblyService = require('./assembly-service');
const createServer = require('./server');
const logger = require('../../shared/utils/logger');
const config = require('../../shared/utils/config');
const storageService = require('../../shared/utils/storage');
const assemblyDataAccess = require('./data/assemblyDataAccess');

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

  async generateContent(jobId, templateId) {
    try {
      logger.info(`Generating assembled video for job: ${jobId} with template: ${templateId}`);
      
      // Validate input
      if (!jobId || !templateId) {
        throw new Error('Invalid input parameters: jobId and templateId are required');
      }

      return await this.service.createVideoProject(jobId, templateId);
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

  async getAllAssemblyOutputs(filters = {}) {
    try {
      logger.info('Getting all assembly outputs with filters:', filters);
      return await assemblyDataAccess.getAllAssemblyOutputs(filters);
    } catch (error) {
      logger.error('Error getting assembly outputs:', error);
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
    const app = createServer(assemblyServiceInterface, storageService);

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