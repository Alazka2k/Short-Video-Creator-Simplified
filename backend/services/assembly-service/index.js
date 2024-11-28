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
    logger.info('Initializing AssemblyServiceInterface');
    await this.service.init();
    logger.info('AssemblyServiceInterface initialized');
  }

  async generateContent(jobId, scenes) {
    logger.info(`Generating assembled video for job: ${jobId}`);
    return await this.service.createVideoProject(jobId, scenes);
  }

  async getStatus(jobId) {
    logger.info(`Getting assembly status for job: ${jobId}`);
    return await this.service.getProjectStatus(jobId);
  }

  async cleanup() {
    logger.info('Cleaning up AssemblyServiceInterface');
    await this.service.close();
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