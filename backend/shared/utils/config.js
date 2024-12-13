const dotenv = require('dotenv').config();
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
  
  const env = process.env.NODE_ENV;
  const envPrefix = env.toUpperCase();
  if (!env) {
    logger.error('NODE_ENV is not set. This is required for the application to run.');
    process.exit(1);
  }
  logger.info('Current environment:', { 
    NODE_ENV: env,
    isDefined: env !== undefined,
    type: typeof env
  });

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

  // Update Voice config
  config.voiceGen = {
    ...config.voiceGen,
    outputDirectory: path.join(config.basePaths.output, 'voice')
  };

  config.animationGen = {
    ...config.animationGen,
    outputDirectory: path.join(config.basePaths.output, 'animation')
  };
  
  logger.info('LLM configuration:', JSON.stringify(config.llm, null, 2));
  logger.info('Voice configuration:', JSON.stringify(config.voiceGen, null, 2));
  
  // Add service URLs with environment-specific defaults
  config.services = {
    // Service URLs
    llm: { url: process.env.LLM_SERVICE_URL || 'http://localhost:3001' },
    image: { url: process.env.IMAGE_SERVICE_URL || 'http://localhost:3002' },
    voice: { url: process.env.VOICE_SERVICE_URL || 'http://localhost:3003' },
    animation: { url: process.env.ANIMATION_SERVICE_URL || 'http://localhost:3004' },
    video: { url: process.env.VIDEO_SERVICE_URL || 'http://localhost:3005' },
    music: { url: process.env.MUSIC_SERVICE_URL || 'http://localhost:3006' },
    assembly: { url: process.env.ASSEMBLY_SERVICE_URL || 'http://localhost:3007' },
    job: { url: process.env.JOB_SERVICE_URL || 'http://localhost:3008' },
    auth: { url: process.env.AUTH_SERVICE_URL || 'http://localhost:3009' },
    billing: { url: process.env.BILLING_SERVICE_URL || 'http://localhost:3010' },
    // Add storage configuration
    storage: {
      type: config.services?.storage?.type || 'aws',
      config: config.services?.storage?.[env] || {
        region: env ? process.env[`${envPrefix}_AWS_REGION`] : process.env.AWS_REGION,
        bucket: env ? process.env[`${envPrefix}_AWS_BUCKET`] : process.env.AWS_BUCKET,
        cdnUrl: env ? process.env[`${envPrefix}_CDN_URL`] : process.env.CDN_URL,
        accessKeyId: env ? process.env[`${envPrefix}_AWS_ACCESS_KEY_ID`] : process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: env ? process.env[`${envPrefix}_AWS_SECRET_ACCESS_KEY`] : process.env.AWS_SECRET_ACCESS_KEY
      }
    }
  };
  
  // Log the merged configuration
  logger.info('Merged configuration:', JSON.stringify(config, null, 2));

  // Auth0 config
  config.auth = {
    auth0: {
      domain: process.env[`${envPrefix}_AUTH0_DOMAIN`],
      clientId: process.env[`${envPrefix}_AUTH0_CLIENT_ID`],
      clientSecret: process.env[`${envPrefix}_AUTH0_CLIENT_SECRET`],
      audience: process.env[`${envPrefix}_AUTH0_AUDIENCE`]
    }
  };

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
  'voiceGen.outputDirectory',
  'imageGen.provider',
  'imageGen.serverId',
  'imageGen.channelId',
  'imageGen.salaiToken',
  'musicGen.provider',
  'musicGen.apiKey',
  'musicGen.modelId',
  'animationGen.provider',
  'animationGen.clientId',
  'animationGen.clientSecret',
  'videoGen.provider',
  'videoGen.apiKey',
  'assembly.provider',
  'assembly.apiKey',
  'parameters.animationGen.animationLength',
  'input.csvPath',
  'parameters.jsonPath',
  'initialPrompt.txtPath',
  'output.directory',
  'test.outputDirectory',
  'voiceGen.outputDirectory',
  'animationGen.outputDirectory',
  'parameters.musicGen.make_instrumental',
  'services.voice.url',
  'services.llm.url'
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

// Log all service URLs
logger.info('Service URLs:', JSON.stringify(config.services, null, 2));

module.exports = config;