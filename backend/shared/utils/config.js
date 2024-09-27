const fs = require('fs');
const path = require('path');
const logger = require('./logger');

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
  const rootDir = path.join(__dirname, '..', '..', '..');
  const configPath = path.join(rootDir, 'config', 'default.json');
  const parametersPath = path.join(rootDir, 'data', 'input', 'parameters.json');
  
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

  // Update the base paths
  config.basePaths = {
    root: rootDir,
    input: path.join(rootDir, 'data', 'input'),
    output: path.join(rootDir, 'data', 'output'),
    test: path.join(rootDir, 'tests', 'test_output')
  };

  // Add test output directory
  config.test = {
    outputDirectory: config.basePaths.test
  };

  // Update LLM config
  config.llm = {
    ...config.llm,
    basePath: config.basePaths.input
  };

  // Add service URLs to the configuration
  config.services = {
    llm: { url: process.env.LLM_SERVICE_URL || 'http://localhost:3001' },
    image: { url: process.env.IMAGE_SERVICE_URL || 'http://localhost:3002' },
    voice: { url: process.env.VOICE_SERVICE_URL || 'http://localhost:3003' },
    animation: { url: process.env.ANIMATION_SERVICE_URL || 'http://localhost:3004' },
    music: { url: process.env.MUSIC_SERVICE_URL || 'http://localhost:3005' },
    video: { url: process.env.VIDEO_SERVICE_URL || 'http://localhost:3006' },
    auth: { url: process.env.AUTH_SERVICE_URL || 'http://localhost:3007' },
    job: { url: process.env.JOB_SERVICE_URL || 'http://localhost:3008' },
    billing: { url: process.env.BILLING_SERVICE_URL || 'http://localhost:3009' }
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
  'musicGen.provider',
  'musicGen.sunoCookie',
  'musicGen.sessionId',
  'animationGen.provider',
  'animationGen.clientId',
  'animationGen.clientSecret',
  'videoGen.apiKey',
  'parameters.animationGen.animationLength',
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