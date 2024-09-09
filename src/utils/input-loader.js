const fs = require('fs').promises;
const path = require('path');
const config = require('./config');
const logger = require('./logger');

async function loadParameters() {
  const parametersPath = path.join(__dirname, '..', '..', config.parameters.jsonPath);
  try {
    const data = await fs.readFile(parametersPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    logger.error('Error loading parameters:', error);
    throw error;
  }
}

async function loadInitialPrompt() {
  const promptPath = path.join(__dirname, '..', '..', config.initialPrompt.txtPath);
  try {
    return await fs.readFile(promptPath, 'utf8');
  } catch (error) {
    logger.error('Error loading initial prompt:', error);
    throw error;
  }
}

module.exports = { loadParameters, loadInitialPrompt };