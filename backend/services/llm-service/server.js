const express = require('express');
const path = require('path');
const logger = require('../../shared/utils/logger');
const config = require('../../shared/utils/config');

function createServer(llmServiceInterface) {
  const app = express();
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  app.use((req, res, next) => {
    logger.info(`LLM Service: Received ${req.method} request for ${req.url}`);
    logger.info(`Request headers: ${JSON.stringify(req.headers)}`);
    logger.info(`Request body: ${JSON.stringify(req.body)}`);
    next();
  });

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ status: 'LLM Service is healthy' });
  });

  // Generate endpoint
  app.post('/generate', async (req, res) => {
    try {
      logger.info('Processing LLM generation request');
      const { inputPrompt, llmGenParams } = req.body;
  
      // Basic validation
      if (!inputPrompt) {
        throw new Error('Missing required parameter: inputPrompt');
      }
  
      if (!llmGenParams || !llmGenParams.general) {
        throw new Error('Missing required llmGenParams structure: must include general section');
      }
  
      // Validate only the truly required general parameters
      const requiredGeneralParams = ['sceneAmount', 'lengthDescription'];
      for (const param of requiredGeneralParams) {
        if (!llmGenParams.general[param]) {
          throw new Error(`Missing required parameter: general.${param}`);
        }
      }
  
      // Ensure all optional objects exist even if empty
      llmGenParams.script = llmGenParams.script || {};
      llmGenParams.image = llmGenParams.image || {};
      llmGenParams.general.generalDescription = llmGenParams.general.generalDescription || '';
  
      // Use the service interface directly instead of making an HTTP request
      const result = await llmServiceInterface.process(llmGenParams, inputPrompt);
      
      logger.info('LLM generation completed successfully');
      res.json(result);
    } catch (error) {
      logger.error('LLM Service: Error generating content:', error);
      res.status(500).json({ error: 'LLM generation failed', details: error.message });
    }
  });

  // Generate documentation endpoint
  app.post('/generate-doc', async (req, res) => {
    logger.info('LLM Service: Handling /generate-doc request');
    try {
      const { prompt } = req.body;
      logger.info(`LLM Service: Generating doc content with prompt: ${prompt}`);
      
      const content = await llmServiceInterface.generateDocContent(prompt);
      
      logger.info('LLM Service: Doc content generated successfully');
      res.json(content);
    } catch (error) {
      logger.error('LLM Service: Error generating doc content:', error);
      res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  });

  // Process all prompts from CSV endpoint
  app.post('/process-all', async (req, res) => {
    logger.info('LLM Service: Handling /process-all request');
    try {
      const { csvPath, llmGenParams } = req.body;
      
      if (!csvPath) {
        throw new Error('Missing required parameter: csvPath');
      }

      if (!llmGenParams) {
        throw new Error('Missing required parameter: llmGenParams');
      }

      const results = await llmServiceInterface.processAllPrompts(csvPath, llmGenParams);
      
      logger.info('LLM Service: All prompts processed successfully');
      res.json({
        message: 'All prompts processed successfully',
        results: results
      });
    } catch (error) {
      logger.error('LLM Service: Error processing all prompts:', error);
      res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  });

  // Catch-all route for unhandled requests
  app.use('*', (req, res) => {
    logger.warn(`LLM Service: Received unhandled request: ${req.method} ${req.originalUrl}`);
    res.status(404).json({ error: 'Not Found', message: 'The requested resource does not exist.' });
  });

  // Error handling middleware
  app.use((err, req, res, next) => {
    logger.error(`LLM Service: Unhandled error: ${err.stack}`);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  });

  return app;
}

module.exports = createServer;