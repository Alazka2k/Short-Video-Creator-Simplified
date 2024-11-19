const OpenAI = require("openai");
const { zodResponseFormat } = require("openai/helpers/zod");
const { z } = require('zod');
const fs = require('fs').promises;
const path = require('path');
const logger = require('../logger');
const config = require('../config');
const AnimationPatternManager = require('./animation-pattern-manager');

const AnimationPatternSchema = z.object({
  pattern: z.string(),
  description: z.string()
});

class AnimationPatternGenerator {
  constructor() {
    this.openai = new OpenAI({
      apiKey: config.llm.apiKey,
    });
    this.promptPath = path.join(config.basePaths.input, 'animation_prompt.txt');
    this.patternManager = new AnimationPatternManager();
    logger.info('AnimationPatternGenerator initialized');
  }

  async generatePattern(animationPrompt) {
    try {
      logger.info(`Generating animation pattern for visual prompt: ${animationPrompt}`);

      // Initialize pattern manager if not already done
      if (!this.patternManager.initialized) {
        await this.patternManager.initialize();
      }

      // Try to select existing pattern
      const existingPattern = await this.patternManager.selectPattern(animationPrompt);
      if (existingPattern) {
        logger.info(`Using existing pattern: ${existingPattern.id}`);
        return existingPattern;
      }

      // Generate new pattern
      const prompt = await this.loadPrompt(animationPrompt);
      logger.info('Sending request to OpenAI API...');
      
      const completion = await this.openai.beta.chat.completions.parse({
        model: config.llm.model,
        messages: [
          { role: "system", content: "You are an AI specialized in generating animation patterns." },
          { role: "user", content: prompt },
        ],
        response_format: zodResponseFormat(AnimationPatternSchema, "animation_pattern"),
      });

      logger.info('Animation pattern generated successfully');
      const result = completion.choices[0].message.parsed;
      logger.info(`Raw generated pattern: ${result.pattern}`);

      // Validate and reconstruct the pattern
      result.pattern = this.validateAndReconstructPattern(result.pattern);
      logger.info(`Validated and reconstructed pattern: ${result.pattern}`);

      // Save the new pattern
      await this.patternManager.savePattern(result, animationPrompt);

      return result;
    } catch (error) {
      logger.error('Error generating animation pattern:', error);
      
      // Attempt to get a fallback pattern
      const fallbackPattern = await this.patternManager.selectPattern(animationPrompt) 
        || this.patternManager.getDefaultPattern();
      
      logger.info(`Using fallback pattern: ${fallbackPattern.id}`);
      return fallbackPattern;
    }
  }

  validateAndReconstructPattern(pattern) {
    try {
      logger.info(`Validating and reconstructing pattern: ${pattern}`);
      // Remove any spaces and extract values
      const values = pattern.replace(/\s/g, '').slice(1, -1).split(',').map(val => {
        const num = parseFloat(val);
        return isNaN(num) ? 0 : Number(num.toFixed(5)); // Limit to 5 decimal places
      });
      
      logger.info(`Extracted ${values.length} values from pattern`);
      
      // Limit to 250 triplets (750 values)
      const maxValues = 750;
      if (values.length > maxValues) {
        logger.warn(`Pattern had ${values.length} values. Truncating to ${maxValues} values.`);
        values.length = maxValues;
      }
      
      // If the pattern is shorter than 700 values, extend it by repeating the pattern
      while (values.length < 702) {
        values.push(...values.slice(0, 3));
        logger.info(`Extended pattern. New length: ${values.length}`);
      }
      
      // Reconstruct the pattern string
      const reconstructedPattern = `{${values.join(',')}}`;
      logger.info(`Reconstructed pattern with ${values.length} values`);
      return reconstructedPattern;
    } catch (error) {
      logger.error('Error validating and reconstructing pattern:', error);
      return this.patternManager.getDefaultPattern().pattern;
    }
  }

  async loadPrompt(animationPrompt) {
    try {
      logger.info(`Loading prompt template from ${this.promptPath}`);
      const promptTemplate = await fs.readFile(this.promptPath, 'utf8');
      const finalPrompt = promptTemplate.replace('{video_prompt}', animationPrompt);
      logger.info(`Prompt loaded and prepared with animation prompt`);
      return finalPrompt;
    } catch (error) {
      logger.error('Error loading animation prompt:', error);
      throw error;
    }
  }
}

module.exports = AnimationPatternGenerator;