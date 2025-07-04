const express = require('express');
const router = express.Router();
const logger = require('../../shared/utils/logger');
const assemblyDataAccess = require('../../services/assembly-service/data/assemblyDataAccess');
const AssemblyService = require('../../services/assembly-service/assembly-service');
const jwtAuth = require('../middleware/jwtAuth');
const axios = require('axios');
const config = require('../../shared/utils/config');

// Initialize assembly service
const assemblyServiceInstance = new AssemblyService();

/**
 * Start video assembly for a job using a template
 */
router.post('/assemble', jwtAuth({ requireUser: true }), async (req, res) => {
    try {
      const { jobId, templateId } = req.body;
      const { userId, isAdmin } = req.user;

      // Validate required fields
      if (!jobId || !templateId) {
        return res.status(400).json({
          error: 'Missing required fields',
          details: 'Both jobId and templateId are required'
        });
      }

      // Validate job ID format (UUID)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(jobId)) {
        return res.status(400).json({
          error: 'Invalid job ID format',
          details: 'Job ID must be a valid UUID'
        });
      }

      logger.info('Assembly request received:', {
        jobId,
        templateId,
        userId,
        isAdmin,
      });

      // Create assembly output record
      const assemblyId = await assemblyDataAccess.createAssemblyOutput(jobId, userId, templateId);

      // Start video assembly process
      const result = await assemblyServiceInstance.createVideoProject(assemblyId, jobId, templateId);

      logger.info('Received response from Assembly service:', {
        assemblyId,
        jobId,
        templateId,
        creatomateId: result.creatomateId,
        status: result.status
      });

      return res.status(202).json({
        message: 'Video assembly started',
        assemblyId,
        jobId,
        templateId,
        creatomateId: result.creatomateId,
        status: result.status
      });

    } catch (error) {
      logger.error('Error in assembly request:', error);
      return res.status(500).json({
        error: 'Failed to start video assembly',
        details: error.message
      });
    }
  });

/**
 * Get assembly status
 */
router.get('/status/:assemblyId', jwtAuth({ requireUser: true }), async (req, res) => {
    try {
      const { assemblyId } = req.params;
      const { userId, isAdmin } = req.user;

      // Validate assembly ID format (UUID)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(assemblyId)) {
        return res.status(400).json({
          error: 'Invalid assembly ID format',
          details: 'Assembly ID must be a valid UUID'
        });
      }

      logger.info('Assembly status request received:', {
        assemblyId,
        userId,
        isAdmin
      });

      const assembly = await assemblyDataAccess.getAssemblyOutput(assemblyId);

      if (!assembly) {
        return res.status(404).json({
          error: 'Assembly not found'
        });
      }
      
      // Security check: only owner or admin can see the status
      if (assembly.user_id !== userId && !isAdmin) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      return res.json({
        assemblyId: assembly.assembly_id,
        jobId: assembly.job_id,
        status: assembly.status,
        progress: assembly.metadata?.progress || 0,
        url: assembly.public_url,
        createdAt: assembly.created_at,
        updatedAt: assembly.updated_at,
        error: assembly.metadata?.error
      });
    } catch (error) {
      logger.error('Error getting assembly status:', error);
      return res.status(500).json({
        error: 'Failed to get assembly status',
        details: error.message
      });
    }
  });

/**
 * List available templates by aspect ratio
 */
router.get('/templates/:aspectRatio', jwtAuth({ requireUser: true }), async (req, res) => {
    try {
      const { aspectRatio } = req.params;
      const { userId } = req.user;

      logger.info('Templates request received:', {
        aspectRatio,
        userId,
      });
      
      const templates = await assemblyDataAccess.listTemplatesByAspectRatio(aspectRatio);

      return res.json({
        templates,
        count: templates.length
      });
    } catch (error) {
      logger.error('Error listing templates:', error);
      return res.status(500).json({
        error: 'Failed to list templates',
        details: error.message
      });
    }
  });

/**
 * Get template configuration
 */
router.get('/template/:templateId', jwtAuth({ requireUser: true }), async (req, res) => {
    try {
      const { templateId } = req.params;
      const config = await assemblyDataAccess.getTemplateConfig(templateId);

      if (!config) {
        return res.status(404).json({
          error: 'Template not found'
        });
      }

      return res.json(config);
    } catch (error) {
      logger.error('Error getting template config:', error);
      return res.status(500).json({
        error: 'Failed to get template configuration',
        details: error.message
      });
    }
  });

// Webhook endpoint - no auth required as it's called by Creatomate
router.post('/webhook', async (req, res) => {
  try {
    logger.info('Received Creatomate webhook:', {
      id: req.body.id,
      status: req.body.status,
      hasUrl: !!req.body.url,
      hasError: !!req.body.error
    });

    let parsedMetadata = {};
    try {
      parsedMetadata = JSON.parse(req.body.metadata || '{}');
      logger.info('Parsed webhook metadata:', parsedMetadata);
    } catch (parseError) {
      logger.error('Error parsing webhook metadata:', {
        error: parseError.message,
        metadata: req.body.metadata
      });
      return res.status(400).json({ error: 'Invalid metadata format' });
    }

    const { assemblyId, jobId, templateId } = parsedMetadata;

    if (!assemblyId) {
      logger.error('No assemblyId found in webhook metadata');
      return res.status(400).json({ error: 'Missing assemblyId in metadata' });
    }

    logger.info('Forwarding webhook to Assembly service:', {
      assemblyId,
      jobId,
      templateId,
      creatomateId: req.body.id,
      webhookStatus: req.body.status,
      assemblyServiceUrl: config.services.assembly.url
    });
    
    // Forward the webhook to the assembly service
    try {
      const response = await axios.post(
        `${config.services.assembly.url}/webhook`,
        req.body
      );

      logger.info('Received response from Assembly service webhook:', {
        assemblyId,
        jobId,
        templateId,
        status: response.data.status,
        hasStorageKey: !!response.data.storageKey,
        hasPublicUrl: !!response.data.publicUrl
      });

      return res.json(response.data);
    } catch (forwardError) {
      logger.error('Error forwarding webhook to Assembly service:', {
        error: forwardError.message,
        stack: forwardError.stack,
        responseStatus: forwardError.response?.status,
        responseData: forwardError.response?.data
      });
      
      return res.status(forwardError.response?.status || 500).json({
        error: 'Failed to process webhook',
        details: forwardError.response?.data || forwardError.message
      });
    }
  } catch (error) {
    logger.error('Error processing webhook:', {
      error: error.message,
      stack: error.stack
    });
    
    return res.status(500).json({
      error: 'Failed to process webhook',
      details: error.message
    });
  }
});

// Log user context and token details for debugging
const logUserContext = (req, res, next) => {
  logger.debug('User context:', {
    userId: req.user?.sub,
    permissions: req.user?.permissions,
    token: req.headers.authorization?.substring(0, 20) + '...'
  });
  next();
};

// GET endpoint to retrieve all assembly outputs with pagination and filtering
router.get('/videos', jwtAuth({ requireUser: true }), async (req, res) => {
    try {
      const { userId, isAdmin } = req.user;

      logger.info('Getting assembly outputs with filters:', {
        userId,
        isAdmin,
        query: req.query
      });

      const filters = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20,
        sortBy: req.query.sortBy || 'created_at',
        sortOrder: req.query.sortOrder || 'desc',
        status: req.query.status,
        startDate: req.query.startDate,
        endDate: req.query.endDate
      };

      // Add user ID if not admin
      if (!isAdmin) {
        filters.userId = userId.toString();
      }

      logger.info('Making request to assembly service:', {
        url: `${config.services.assembly.url}/videos`,
        filters,
        userId,
        isAdmin
      });

      try {
        const response = await axios.get(`${config.services.assembly.url}/videos`, {
          params: filters,
          headers: { 'Content-Type': 'application/json' },
          timeout: 30000  // 30 seconds timeout
        });

        logger.info('Assembly outputs retrieved:', {
          status: response.status,
          hasData: !!response.data,
          userId,
          isAdmin,
          outputCount: response.data?.data?.length || 0,
          pagination: response.data?.pagination
        });

        // Process URLs in the response data - only refresh the final assembled video URL
        const StorageUrlHelper = require('../../shared/utils/storage-url-helper');
        const processedData = await Promise.all(response.data.data.map(async output => {
          // Only refresh the final video URL if it exists
          if (output.public_url) {
            const refreshedOutput = await StorageUrlHelper.refreshUrlsInObject({
              publicUrl: output.public_url,
              storageKey: output.storage_key
            });
            output.public_url = refreshedOutput.publicUrl;
          }
          return output;
        }));

        res.json({
          data: processedData,
          pagination: response.data.pagination
        });
      } catch (error) {
        logger.error('Assembly outputs request error:', {
          error: error.message,
          stack: error.stack,
          status: error.response?.status
        });

        res.status(error.response?.status || 500).json({
          error: 'Failed to get assembly outputs',
          details: error.response?.data?.details || error.message
        });
      }
    } catch (error) {
      logger.error('Assembly outputs request error:', {
        error: error.message,
        stack: error.stack,
        status: error.response?.status
      });

      res.status(error.response?.status || 500).json({
        error: 'Failed to get assembly outputs',
        details: error.response?.data?.details || error.message
      });
    }
  }
);

module.exports = router;