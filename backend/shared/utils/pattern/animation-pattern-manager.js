const fs = require('fs').promises;
const path = require('path');
const logger = require('../logger');
const config = require('../config');

class AnimationPatternManager {
  constructor() {
    this.patternsPath = path.join(config.basePaths.input, 'animation_patterns');
    this.patterns = new Map();
    this.initialized = false;
  }

  async initialize() {
    try {
      await fs.mkdir(this.patternsPath, { recursive: true });
      await this.loadPatterns();
      this.initialized = true;
      logger.info(`AnimationPatternManager initialized with ${this.patterns.size} patterns`);
    } catch (error) {
      logger.error('Failed to initialize AnimationPatternManager:', error);
      throw error;
    }
  }

  async loadPatterns() {
    try {
      const files = await fs.readdir(this.patternsPath);
      for (const file of files) {
        if (!file.endsWith('.json')) continue;
        
        const filePath = path.join(this.patternsPath, file);
        const data = await fs.readFile(filePath, 'utf8');
        const pattern = JSON.parse(data);
        
        if (!pattern.id || !pattern.pattern) {
          logger.warn(`Skipping invalid pattern file: ${file}`);
          continue;
        }

        this.patterns.set(pattern.id, pattern);
      }
      
      logger.info(`Loaded ${this.patterns.size} patterns successfully`);
    } catch (error) {
      logger.error('Error loading patterns:', error);
      throw error;
    }
  }

  async selectPattern(prompt) {
    if (!this.initialized) {
      throw new Error('PatternManager not initialized');
    }

    const patterns = Array.from(this.patterns.values());
    if (patterns.length === 0) {
      logger.info('No patterns available, using default pattern');
      return this.getDefaultPattern();
    }

    const selectedPattern = patterns[Math.floor(Math.random() * patterns.length)];
    logger.info(`Selected pattern: ${selectedPattern.id}`);
    return selectedPattern;
  }

  getDefaultPattern() {
    return {
      id: 'default',
      pattern: this.patterns.get('fallback_vertical_movement')?.pattern || '{0,0,0}',
      description: 'Default fallback pattern'
    };
  }
}

module.exports = AnimationPatternManager;