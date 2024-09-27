const express = require('express');
const path = require('path');
const logger = require('../../shared/utils/logger');
const config = require('../../shared/utils/config');

function createServer(llmServiceInterface) {
    const app = express();
    app.use(express.json());
  
    app.use((req, res, next) => {
      logger.info(`LLM Service: Received ${req.method} request for ${req.url}`);
      next();
    });
  
    const router = express.Router();
  
    router.post('/generate', async (req, res) => {
      logger.info('LLM Service: Handling /generate request');
      try {
        const { initialPromptFile, parametersFile, inputPrompt } = req.body;
        logger.info(`LLM Service: Request body: ${JSON.stringify(req.body)}`);
        
        if (!initialPromptFile) {
          throw new Error('initialPromptFile is missing or undefined');
        }
        if (!parametersFile) {
          throw new Error('parametersFile is missing or undefined');
        }
        if (!inputPrompt) {
          throw new Error('inputPrompt is missing or undefined');
        }
  
        logger.info(`LLM Service: Generating content with input: ${inputPrompt}`);
        logger.info(`LLM Service: Initial Prompt File: ${initialPromptFile}`);
        logger.info(`LLM Service: Parameters File: ${parametersFile}`);
        
        const content = await llmServiceInterface.process(initialPromptFile, parametersFile, inputPrompt);
        
        logger.info('LLM Service: Content generated successfully');
        res.json(content);
      } catch (error) {
        logger.error('LLM Service: Error generating content:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
      }
    });

    router.post('/generate-doc', async (req, res) => {
      logger.info('LLM Service: Handling /generate-doc request');
      try {
        const { prompt } = req.body;
        logger.info(`LLM Service: Generating doc content with prompt: ${prompt}`);
        
        const startTime = Date.now();
        const content = await llmServiceInterface.generateDocContent(prompt);
        const endTime = Date.now();
        
        logger.info(`LLM Service: Doc content generated successfully in ${endTime - startTime}ms`);
        logger.info(`LLM Service: Generated doc content: ${JSON.stringify(content)}`);
        res.json(content);
      } catch (error) {
        logger.error('LLM Service: Error generating doc content:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
      }
    });

    router.post('/process-all', async (req, res) => {
      logger.info('LLM Service: Handling /process-all request');
      try {
        const { csvPath, initialPromptFile, parametersFile } = req.body;
        logger.info(`LLM Service: Processing all prompts from CSV: ${csvPath}`);
        
        const startTime = Date.now();
        const results = await llmServiceInterface.processAllPrompts(csvPath, initialPromptFile, parametersFile);
        const endTime = Date.now();
        
        logger.info(`LLM Service: All prompts processed successfully in ${endTime - startTime}ms`);
        logger.info(`LLM Service: Number of results: ${results.length}`);
        res.json(results);
      } catch (error) {
        logger.error('LLM Service: Error processing all prompts:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
      }
    });

    // Use the router with the /api/llm prefix
    app.use('/api/llm', router);

    // Catch-all for undefined routes
    app.use((req, res) => {
      logger.warn(`LLM Service: Received request for undefined route: ${req.method} ${req.url}`);
      res.status(404).json({ error: 'Not Found' });
    });

    // Error handling middleware
    app.use((err, req, res, next) => {
      logger.error(`LLM Service: Unhandled error: ${err.stack}`);
      res.status(500).json({ error: 'Internal server error', details: err.message });
    });

    return app;
}

module.exports = createServer;