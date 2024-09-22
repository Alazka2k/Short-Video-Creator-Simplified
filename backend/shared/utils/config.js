const fs = require('fs');
const path = require('path');

function deepMerge(target, source) {
  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      if (source[key] && typeof source[key] === 'object') {
        if (!target[key]) Object.assign(target, { [key]: {} });
        deepMerge(target[key], source[key]);
      } else {
        Object.assign(target, { [key]: source[key] });
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
  } catch (error) {
    console.error(`Error reading config file: ${error.message}`);
    process.exit(1);
  }

  try {
    rawParameters = fs.readFileSync(parametersPath, 'utf8');
  } catch (error) {
    console.error(`Error reading parameters file: ${error.message}`);
    process.exit(1);
  }

  let config, parameters;

  try {
    config = JSON.parse(rawConfig);
  } catch (error) {
    console.error(`Error parsing config JSON: ${error.message}`);
    process.exit(1);
  }

  try {
    parameters = JSON.parse(rawParameters);
  } catch (error) {
    console.error(`Error parsing parameters JSON: ${error.message}`);
    process.exit(1);
  }

  // Deep merge parameters into config
  config = deepMerge(config, parameters);

  // Add test output directory
  config.test = {
    outputDirectory: path.join(__dirname, '..', '..', '..', 'tests', 'test_output')
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
  'videoGen.animationLength',
  'input.csvPath',
  'parameters.jsonPath',
  'initialPrompt.txtPath',
  'output.directory',
  'test.outputDirectory'
];

requiredConfigs.forEach(configPath => {
  const keys = configPath.split('.');
  let current = config;
  for (const key of keys) {
    if (current[key] === undefined) {
      console.error(`Missing required configuration: ${configPath}`);
      process.exit(1);
    }
    current = current[key];
  }
});

module.exports = config;