const fs = require('fs');
const path = require('path');

function loadConfig() {
  const configPath = path.join(__dirname, '..', '..', 'config', 'default.json');
  const parametersPath = path.join(__dirname, '..', '..', 'data', 'input', 'parameters.json');
  
  const rawConfig = fs.readFileSync(configPath, 'utf8');
  const rawParameters = fs.readFileSync(parametersPath, 'utf8');
  
  const config = JSON.parse(rawConfig);
  const parameters = JSON.parse(rawParameters);

  // Merge parameters into config
  config.parameters = parameters;

  // Add test output directory
  config.test = {
    outputDirectory: path.join(__dirname, '..', '..', 'tests', 'test_output')
  };

  return config;
}

const config = loadConfig();

// Ensure all required configurations are present
const requiredConfigs = [
  'llm.apiKey',
  'llm.model',
  'voiceGen.apiKey',
  'parameters.voiceGen.modelId',
  'parameters.voiceGen.defaultVoiceId',
  'imageGen.apiKey',
  'input.csvPath',
  'initialPrompt.txtPath',
  'output.directory',
  'test.outputDirectory'
];

requiredConfigs.forEach(configPath => {
  const keys = configPath.split('.');
  let current = config;
  for (const key of keys) {
    if (current[key] === undefined) {
      throw new Error(`Missing required configuration: ${configPath}`);
    }
    current = current[key];
  }
});

module.exports = config;