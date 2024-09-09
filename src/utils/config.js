const fs = require('fs');
const path = require('path');

function loadConfig() {
  const configPath = path.join(__dirname, '..', '..', 'config', 'default.json');
  const rawConfig = fs.readFileSync(configPath, 'utf8');
  return JSON.parse(rawConfig);
}

const config = loadConfig();

module.exports = config;