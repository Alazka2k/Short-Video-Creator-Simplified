const { runContentPipeline } = require('./workflows/content-pipeline');
const logger = require('./utils/logger');

async function main() {
  try {
    logger.info('Starting SHORT-VIDEO-CREATOR-SIMPLIFIED');
    await runContentPipeline();
    logger.info('Content creation process completed successfully');
  } catch (error) {
    logger.error('Error in content creation process:', error);
    process.exit(1);
  }
}

main();