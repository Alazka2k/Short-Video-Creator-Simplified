const AnimationGenService = require('./animation-gen-service');
const logger = require('../../shared/utils/logger');
const path = require('path');

class AnimationServiceInterface {
  constructor() {
    logger.info('Constructing AnimationServiceInterface');
    this.service = AnimationGenService;
    logger.info('AnimationGenService assigned to this.service');
    logger.info('AnimationServiceInterface constructed');
  }

  async initialize() {
    try {
      logger.info('Initializing AnimationServiceInterface...');
      if (!this.service || typeof this.service.init !== 'function') {
        throw new Error('AnimationGenService is not properly initialized or lacks init method');
      }
      await this.service.init();
      logger.info('AnimationServiceInterface initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize AnimationServiceInterface:', error);
      throw error;
    }
  }

  async process(imagePath, outputDir, sceneNumber, options = {}) {
    try {
      logger.info(`Processing animation request for scene ${sceneNumber}`);
      logger.info(`Image path: ${imagePath}`);
      logger.info(`Output directory: ${outputDir}`);
      logger.info('Animation options:', JSON.stringify(options));

      if (!options.animationPrompt) {
        throw new Error('Visual prompt is required for animation generation');
      }

      // Generate animation pattern first
      logger.info('Generating animation pattern');
      const patternData = await this.service.generateAnimationPattern(options.animationPrompt);
      if (!patternData || !patternData.pattern) {
        throw new Error('Failed to generate valid animation pattern');
      }
      const animationPattern = patternData.pattern;
      logger.info('Animation pattern generated successfully');

      // Construct the output path for the animation
      const outputFileName = `scene_${sceneNumber}_animation.mp4`;
      const outputPath = path.join(outputDir, outputFileName);

      // Proceed with animation generation using the generated pattern
      logger.info('Starting animation generation');
      const result = await this.service.generateAnimation(imagePath, outputPath, {
        animationLength: options.animationLength,
        animationPattern: animationPattern
      });
      logger.info('Animation generation completed successfully');
      logger.info(`Animation saved to: ${result}`);
      return result;
    } catch (error) {
      logger.error('Error processing animation:', error);
      throw error;
    }
  }

  async cleanup() {
    try {
      logger.info('Cleaning up AnimationServiceInterface...');
      if (this.service && typeof this.service.cleanup === 'function') {
        await this.service.cleanup();
        logger.info('AnimationServiceInterface cleanup completed');
      } else {
        logger.warn('AnimationGenService cleanup method not available');
      }
    } catch (error) {
      logger.error('Error during AnimationServiceInterface cleanup:', error);
      throw error;
    }
  }
}

logger.info('Creating new instance of AnimationServiceInterface');
const animationServiceInterface = new AnimationServiceInterface();
logger.info('AnimationServiceInterface instance created');

module.exports = animationServiceInterface;