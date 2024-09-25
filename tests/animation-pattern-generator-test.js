const path = require('path');
const fs = require('fs').promises;
const projectRoot = path.resolve(__dirname, '..');
const AnimationPatternGenerator = require(path.join(projectRoot, 'backend', 'services', 'animation-service', 'AnimationPatternGenerator'));
const logger = require(path.join(projectRoot, 'backend', 'shared', 'utils', 'logger'));

async function runAnimationPatternGeneratorTest() {
  try {
    logger.info('Starting Animation Pattern Generator test');

    const test_video_prompt = "The camera captures the silhouette of a solitary survivor braving the wasteland, their breath visible in the frigid air, as it gently zooms in on their determined stride through an abandoned cityscape.";

    logger.info(`Testing with visual prompt: "${test_video_prompt}"`);
    logger.info(`AnimationPatternGenerator prompt path: ${AnimationPatternGenerator.promptPath}`);

    try {
      await fs.access(AnimationPatternGenerator.promptPath);
      logger.info('animation_prompt.txt file exists');
    } catch (error) {
      logger.error(`animation_prompt.txt file not found at ${AnimationPatternGenerator.promptPath}`);
      throw error;
    }

    const result = await AnimationPatternGenerator.generatePattern(test_video_prompt);

    console.log('Generated pattern:', result.pattern);
    console.log('Generated description:', result.description);

    // Validate pattern format
    const patternRegex = /^\{(-?\d+(\.\d+)?,){3,}(-?\d+(\.\d+)?)\}$/;
    if (!patternRegex.test(result.pattern)) {
      logger.error(`Invalid pattern format: ${result.pattern}`);
      throw new Error(`Invalid pattern format: ${result.pattern}`);
    }

    // Check if description is non-empty
    if (!result.description || result.description.trim().length === 0) {
      throw new Error('Description is empty');
    }

    // Parse pattern and check value ranges
    const values = result.pattern.slice(1, -1).split(',').map(Number);
    if (values.length % 3 !== 0) {
      throw new Error(`Number of values (${values.length}) is not a multiple of 3`);
    }
    
    if (values.length > 405) {
      throw new Error(`Number of values (${values.length}) exceeds the maximum allowed (405)`);
    }
    
    let outOfRangeCount = 0;
    for (const value of values) {
      if (value < -4 || value > 4) {
        logger.warn(`Pattern value ${value} is out of expected range (-4 to 4)`);
        outOfRangeCount++;
      }
    }
    
    if (outOfRangeCount > 0) {
      logger.warn(`${outOfRangeCount} values were out of the expected range (-4 to 4)`);
    } else {
      logger.info('All values are within the expected range (-4 to 4)');
    }

    logger.info(`Animation pattern contains ${values.length / 3} triplets (${values.length} total values)`);
    logger.info('Animation Pattern Generator test passed successfully');

    // Return the result for further inspection if needed
    return result;
  } catch (error) {
    logger.error('Animation Pattern Generator test failed:', error);
    throw error;
  }
}

runAnimationPatternGeneratorTest()
  .then(result => {
    console.log('Test completed. Final result:', JSON.stringify(result, null, 2));
  })
  .catch(error => {
    console.error('Unhandled error in Animation Pattern Generator test:', error);
    process.exit(1);
  });