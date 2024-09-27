const express = require('express');
const logger = require('../../shared/utils/logger');

function createServer(llmServiceInterface) {
  const app = express();
  app.use(express.json());

  app.post('/generate', async (req, res) => {
    try {
      const { initialPromptPath, parametersPath, inputPrompt } = req.body;
      const content = await llmServiceInterface.process(initialPromptPath, parametersPath, inputPrompt);
      res.json(content);
    } catch (error) {
      logger.error('Error generating content:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/generate-doc', async (req, res) => {
    try {
      const { prompt } = req.body;
      const content = await llmServiceInterface.generateDocContent(prompt);
      res.json(content);
    } catch (error) {
      logger.error('Error generating doc content:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/process-all', async (req, res) => {
    try {
      const { csvPath, initialPromptPath, parametersPath } = req.body;
      const results = await llmServiceInterface.processAllPrompts(csvPath, initialPromptPath, parametersPath);
      res.json(results);
    } catch (error) {
      logger.error('Error processing all prompts:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return app;
}

module.exports = createServer;