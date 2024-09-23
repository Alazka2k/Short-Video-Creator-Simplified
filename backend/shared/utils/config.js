const fs = require('fs');
const path = require('path');
const logger = require('./logger'); // Make sure to import the logger

function deepMerge(target, source) {
  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        if (!target[key] || typeof target[key] !== 'object') {
          target[key] = {};
        }
        deepMerge(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }
  }
  return target;
}

function loadConfig() {
  const configPath = path.join(__dirname, '..', '..', '..', 'config', 'default.json');
  const parametersPath = path.join(__dirname, '..', '..', '..', 'data', 'input', 'parameters.json');
  
  let rawConfig, rawParameters;

  try {
    rawConfig = fs.readFileSync(configPath, 'utf8');
    logger.info(`Successfully read config file from ${configPath}`);
  } catch (error) {
    logger.error(`Error reading config file: ${error.message}`);
    process.exit(1);
  }

  try {
    rawParameters = fs.readFileSync(parametersPath, 'utf8');
    logger.info(`Successfully read parameters file from ${parametersPath}`);
  } catch (error) {
    logger.error(`Error reading parameters file: ${error.message}`);
    process.exit(1);
  }

  let config, parameters;

  try {
    config = JSON.parse(rawConfig);
    logger.info('Successfully parsed config JSON');
  } catch (error) {
    logger.error(`Error parsing config JSON: ${error.message}`);
    process.exit(1);
  }

  try {
    parameters = JSON.parse(rawParameters);
    logger.info('Successfully parsed parameters JSON');
  } catch (error) {
    logger.error(`Error parsing parameters JSON: ${error.message}`);
    process.exit(1);
  }

  // Ensure parameters.musicGen exists in the config
  if (!config.parameters) {
    config.parameters = {};
  }
  if (!config.parameters.musicGen) {
    config.parameters.musicGen = {};
  }

  // Deep merge parameters into config
  config = deepMerge(config, { parameters });

  // Add test output directory
  config.test = {
    outputDirectory: path.join(__dirname, '..', '..', '..', 'tests', 'test_output')
  };

  // Log the merged configuration
  logger.info('Merged configuration:', JSON.stringify(config, null, 2));

  return config;
}

const config = loadConfig();

// Ensure all required configurations are present
const requiredConfigs = [
  'llm.provider',
  'llm.model',
  'llm.apiKey',
  'voiceGen.provider',
  'voiceGen.apiKey',
  'imageGen.provider',
  'imageGen.serverId',
  'imageGen.channelId',
  'imageGen.salaiToken',
  'audioGen.provider',
  'audioGen.sunoCookie',
  'audioGen.sessionId',
  'videoGen.provider',
  'videoGen.clientId',
  'videoGen.clientSecret',
  'parameters.videoGen.animationLength',
  'input.csvPath',
  'parameters.jsonPath',
  'initialPrompt.txtPath',
  'output.directory',
  'test.outputDirectory',
  'parameters.musicGen.make_instrumental'
];

requiredConfigs.forEach(configPath => {
  const keys = configPath.split('.');
  let current = config;
  for (const key of keys) {
    if (current[key] === undefined) {
      logger.error(`Missing required configuration: ${configPath}`);
      process.exit(1);
    }
    current = current[key];
  }
});

// Log the musicGen configuration specifically
logger.info('MusicGen configuration:', JSON.stringify(config.parameters?.musicGen, null, 2));

module.exports = config;