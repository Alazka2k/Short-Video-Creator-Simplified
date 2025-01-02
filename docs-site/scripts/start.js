require('dotenv').config({ path: '../.env' });
const { spawn } = require('child_process');
const config = require('../../backend/shared/utils/config');

// Get environment prefix
const env = process.env.NODE_ENV || 'development';
const envPrefix = env.toUpperCase();

// Get port from environment-specific variable
const port = process.env[`${envPrefix}_DOCS_SERVICE_PORT`] || 4001;
const docsUrl = new URL(config.services.docs.url);

// Start Docusaurus with the specified port and host
const docusaurus = spawn('npx', [
  'docusaurus',
  'start',
  '--port',
  port,
  '--host',
  docsUrl.hostname
], {
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    DOCS_URL: config.services.docs.url
  }
});

docusaurus.on('error', (error) => {
  console.error(`Error starting Docusaurus: ${error}`);
  process.exit(1);
});

process.on('SIGINT', () => {
  docusaurus.kill();
  process.exit();
}); 