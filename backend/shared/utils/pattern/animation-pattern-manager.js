const fs = require('fs').promises;
const path = require('path');
const { format } = require('date-fns');
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
      logger.info(`Loading patterns from: ${this.patternsPath}`);
      await fs.mkdir(this.patternsPath, { recursive: true });
      
      const files = await fs.readdir(this.patternsPath);
      logger.info(`Found ${files.length} files in patterns directory: ${files.join(', ')}`);
      
      let loadedCount = 0;
      for (const file of files) {
        try {
          if (!file.toLowerCase().endsWith('.json')) {
            logger.debug(`Skipping non-JSON file: ${file}`);
            continue;
          }
          
          const filePath = path.join(this.patternsPath, file);
          logger.info(`Processing file: ${filePath}`);
  
          // Read the file content
          const data = await fs.readFile(filePath, 'utf8');
          logger.debug(`File content: ${data.substring(0, 100)}...`);
  
          // Try to parse JSON
          let pattern;
          try {
            pattern = JSON.parse(data);
            logger.debug(`Parsed JSON structure: ${JSON.stringify(Object.keys(pattern))}`);
          } catch (parseError) {
            logger.warn(`Failed to parse JSON in ${file}: ${parseError.message}`);
            continue;
          }
  
          // Check pattern structure
          if (!pattern) {
            logger.warn(`Pattern is null or undefined in ${file}`);
            continue;
          }
  
          if (typeof pattern !== 'object') {
            logger.warn(`Pattern is not an object in ${file}, type: ${typeof pattern}`);
            continue;
          }
  
          if (!pattern.pattern) {
            logger.warn(`No pattern property found in ${file}`);
            logger.debug(`Available properties: ${Object.keys(pattern).join(', ')}`);
            continue;
          }
  
          if (typeof pattern.pattern !== 'string') {
            logger.warn(`Pattern is not a string in ${file}, type: ${typeof pattern.pattern}`);
            continue;
          }
  
          // Generate ID if missing
          if (!pattern.id) {
            const baseName = path.basename(file, '.json');
            pattern.id = baseName;
            logger.info(`Generated ID for pattern: ${pattern.id}`);
          }
  
          // Add description if missing
          if (!pattern.description) {
            pattern.description = path.basename(file, '.json')
              .replace(/^fallback_/, '')
              .replace(/_/g, ' ');
          }
  
          // Clean up the pattern string
          try {
            const originalLength = pattern.pattern.split(',').length;
            pattern.pattern = this.validateAndCleanPattern(pattern.pattern);
            const newLength = pattern.pattern.split(',').length;
            logger.info(`Pattern cleaned: ${originalLength} values -> ${newLength} values`);
          } catch (validationError) {
            logger.warn(`Pattern validation failed for ${file}: ${validationError.message}`);
            continue;
          }
  
          // Store the pattern
          this.patterns.set(pattern.id, pattern);
          loadedCount++;
          
          logger.info(`Successfully loaded pattern from ${file}: ${pattern.id}`);
  
          // Update file if needed
          if (!data.includes('"id":')) {
            await fs.writeFile(filePath, JSON.stringify(pattern, null, 2));
            logger.info(`Updated pattern file ${file} with generated ID`);
          }
        } catch (error) {
          logger.error(`Error processing pattern file ${file}:`, error);
          continue;
        }
      }
      
      logger.info(`Successfully loaded ${loadedCount} patterns from ${files.length} files`);
      if (loadedCount > 0) {
        const patterns = Array.from(this.patterns.values());
        patterns.forEach(p => {
          logger.info(`Loaded pattern: ${p.id}, description: ${p.description}, pattern length: ${p.pattern.split(',').length}`);
        });
      }
  
      return loadedCount;
    } catch (error) {
      logger.error('Error loading patterns:', error);
      throw error;
    }
  }

  calculateCreationProbability() {
    const totalPatterns = this.patterns.size;
    // Higher probability of new patterns when we have fewer patterns
    const probability = Math.max(0.2, Math.min(0.1, 1 - (totalPatterns / 100)));
    logger.info(`Pattern creation probability: ${probability.toFixed(2)} (Total patterns: ${totalPatterns})`);
    return probability;
  }

  validateAndCleanPattern(pattern) {
    try {
      logger.debug(`Validating pattern: ${pattern.substring(0, 50)}...`);
      
      // Check if the pattern starts with { and ends with }
      if (!pattern.startsWith('{') || !pattern.endsWith('}')) {
        logger.warn('Pattern does not have correct format (should be wrapped in {})');
        pattern = `{${pattern}}`;
      }
  
      // Remove any spaces and extract values
      const values = pattern
        .replace(/\s/g, '')
        .slice(1, -1)
        .split(',')
        .map(val => {
          const num = parseFloat(val);
          if (isNaN(num)) {
            logger.warn(`Invalid number found in pattern: ${val}`);
            return 0;
          }
          return Number(num.toFixed(5));
        });
  
      logger.debug(`Extracted ${values.length} values from pattern`);
  
      // Ensure we have complete triplets
      const triplets = Math.floor(values.length / 3);
      if (values.length % 3 !== 0) {
        logger.warn(`Pattern length ${values.length} is not divisible by 3, truncating to ${triplets * 3} values`);
        values.length = triplets * 3;
      }
  
      // Ensure minimum length (234 triplets = 702 values)
      while (values.length < 702) {
        logger.debug(`Pattern too short (${values.length} values), extending with first triplet`);
        values.push(...values.slice(0, 3));
      }
  
      // Reconstruct pattern string
      const result = `{${values.join(',')}}`;
      logger.debug(`Final pattern length: ${values.length} values`);
      return result;
    } catch (error) {
      logger.error('Error validating pattern:', error);
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

        // Clean pattern on load
        pattern.pattern = this.validateAndCleanPattern(pattern.pattern);
        this.patterns.set(pattern.id, pattern);
      }
      
      logger.info(`Loaded ${this.patterns.size} patterns successfully`);
    } catch (error) {
      logger.error('Error loading patterns:', error);
      throw error;
    }
  }

  async savePattern(pattern, prompt) {
    try {
      const timestamp = format(new Date(), 'yyyyMMdd-HHmmss');
      const id = `pattern_${timestamp}`;
      
      // Clean pattern before saving
      const cleanedPattern = this.validateAndCleanPattern(pattern.pattern);
      
      const patternData = {
        id,
        pattern: cleanedPattern,
        description: pattern.description,
        prompt,
        created: new Date().toISOString(),
        metadata: {
          tripletCount: Math.floor(cleanedPattern.split(',').length / 3),
          source: 'openai'
        }
      };
      
      const filePath = path.join(this.patternsPath, `${id}.json`);
      await fs.writeFile(filePath, JSON.stringify(patternData, null, 2));
      
      this.patterns.set(id, patternData);
      logger.info(`Saved new pattern: ${id}`);
      return id;
    } catch (error) {
      logger.error('Error saving pattern:', error);
      throw error;
    }
  }

  async selectPattern(prompt) {
    if (!this.initialized) {
      throw new Error('PatternManager not initialized');
    }

    const shouldCreateNew = Math.random() < this.calculateCreationProbability();
    if (shouldCreateNew) {
      logger.info('Decided to create new pattern based on probability calculation');
      return null;
    }

    const patterns = Array.from(this.patterns.values());
    if (patterns.length === 0) {
      logger.info('No patterns available, using default pattern');
      return this.getDefaultPattern();
    }

    const selectedPattern = patterns[Math.floor(Math.random() * patterns.length)];
    logger.info(`Selected existing pattern: ${selectedPattern.id}`);
    return selectedPattern;
  }

  getDefaultPattern() {
    const defaultValues = Array(234).fill(0); // 234 triplets of small values
    const pattern = defaultValues.map((_, i) => {
      const angle = (i / 234) * Math.PI * 2;
      return [
        Math.sin(angle) * 0.5,
        Math.cos(angle) * 0.5,
        Math.sin(angle + Math.PI/4) * 0.5
      ];
    }).flat();

    return {
      id: 'default',
      pattern: `{${pattern.join(',')}}`,
      description: 'Default gentle wave pattern',
      metadata: {
        tripletCount: 234,
        source: 'default'
      }
    };
  }
}

module.exports = AnimationPatternManager;