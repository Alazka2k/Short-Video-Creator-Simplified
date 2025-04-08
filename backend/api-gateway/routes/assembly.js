const express = require('express');
const router = express.Router();
const logger = require('../../shared/utils/logger');
const assemblyDataAccess = require('../../services/assembly-service/data/assemblyDataAccess');
const AssemblyService = require('../../services/assembly-service/assembly-service');
const { verifyAuth0Token, checkPermission } = require('../../services/auth-service/middleware/auth0-verify.middleware');
const serviceAuthMiddleware = require('../middleware/serviceAuth');
const authDataAccess = require('../../services/auth-service/data/authDataAccess');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const config = require('../../shared/utils/config');
const extractUserFromToken = require('../middleware/userTokenExtractor');

// Initialize assembly service
const assemblyServiceInstance = new AssemblyService();

/**
 * Start video assembly for a job using a template
 */
router.post('/assemble',
  verifyAuth0Token,
  checkPermission('/api/assembly/assemble'),
  serviceAuthMiddleware,
  async (req, res) => {
    try {
      logger.info('Processing assembly request');
      
      // Log token details for debugging
      const tokenInfo = {
        type: req.user.gty === 'client-credentials' ? 'M2M' : 'User',
        sub: req.user.sub,
        auth0Id: req.user.auth0_id,
        databaseUser: req.user.databaseUser
      };
      
      //logger.info('Token and user context:', tokenInfo);

      // Check if a user token is provided
      const userToken = req.headers['x-user-token'] || req.headers['x-forwarded-user-token'];
      const hasUserToken = !!userToken;
      
      // If this is an M2M token, try to get the actual user profile
      let actualUserId = req.user.databaseUser?.userId;
      let isApiUser = req.user.databaseUser?.isApiUser || false;

      if (tokenInfo.type === 'M2M') {
        try {
          /*logger.info('Checking for user token:', {
            hasUserToken,
            tokenStart: userToken ? `${userToken.substring(0, 10)}...` : null
          });*/

          if (hasUserToken) {
            // Try to get user profile using the user token
            const gatewayUrl = config.services?.gateway?.url;
            
            // Check if gateway URL is configured
            if (!gatewayUrl) {
              logger.error('Gateway URL not configured correctly', {
                config: JSON.stringify(config.services || {})
              });
              throw new Error('Gateway URL configuration missing');
            }
            
            const profileUrl = `${gatewayUrl}/api/auth/profile`;
            
            logger.info('Making profile request with user token:', {
              url: profileUrl,
              headers: {
                'Authorization': `Bearer ${userToken.substring(0, 20)}...`, // Log partial token for security
                'Content-Type': 'application/json'
              }
            });

            try {
              const profileResponse = await axios.get(profileUrl, {
                headers: { 
                  'Authorization': `Bearer ${userToken}`,
                  'Content-Type': 'application/json'
                }
              });

              logger.info('Profile response received:', {
                status: profileResponse.status,
                hasUser: !!profileResponse.data?.user,
                userData: profileResponse.data?.user ? {
                  auth0Id: profileResponse.data.user.auth0_id,
                  email: profileResponse.data.user.email
                } : null
              });

              if (profileResponse.data?.user) {
                // Get auth0_id from the decoded token
                const decodedToken = jwt.decode(userToken);
                const auth0Id = decodedToken?.auth0_id;
                
                logger.info('Looking up user in database:', { 
                  auth0Id,
                  email: profileResponse.data.user.email
                });
                
                if (!auth0Id) {
                  logger.error('No auth0_id found in token:', { decodedToken });
                  throw new Error('No auth0_id found in token');
                }
                
                try {
                  // Look up user in database
                  const dbUser = await authDataAccess.findUserByAuth0Id(auth0Id);
                  if (dbUser) {
                    actualUserId = dbUser.user_id;
                    isApiUser = false;
                    logger.info('Found user in database:', { 
                      userId: actualUserId,
                      auth0Id,
                      email: dbUser.email 
                    });
                  } else {
                    logger.error('User not found in database:', { 
                      auth0Id,
                      email: profileResponse.data.user.email 
                    });
                    
                    // If we have a user token but can't find the user, we should not proceed
                    if (hasUserToken) {
                      throw new Error('User token provided but user not found in database');
                    }
                  }
                } catch (dbError) {
                  logger.error('Database error looking up user:', {
                    error: dbError.message,
                    stack: dbError.stack,
                    auth0Id
                  });
                  
                  // If we have a user token but encounter a database error, we should not proceed
                  if (hasUserToken) {
                    throw new Error('Database error while validating user token');
                  }
                }
              } else {
                logger.warn('No user data in profile response');
                
                // If we have a user token but profile doesn't return user data, we should not proceed
                if (hasUserToken) {
                  throw new Error('User token provided but no user data returned from profile');
                }
              }
            } catch (profileError) {
              logger.error('Error getting user profile:', {
                error: profileError.message,
                stack: profileError.stack,
                response: {
                  status: profileError.response?.status,
                  data: profileError.response?.data
                }
              });
              
              // If we have a user token but encounter an error, we should not proceed
              if (hasUserToken) {
                throw new Error('Error validating user token');
              }
              
              logger.warn('Falling back to API user due to profile error (only for requests without user token)');
            }
          } else {
            logger.info('No user token found, using API user context');
          }
        } catch (error) {
          logger.error('Error processing user token:', {
            error: error.message,
            stack: error.stack
          });
          
          // Critical security check: if a user token was provided but failed validation,
          // we must reject the request rather than falling back to API user
          if (hasUserToken) {
            return res.status(401).json({
              error: 'Invalid User Token',
              message: 'The provided user token could not be validated',
              details: error.message
            });
          }
          
          logger.warn('Falling back to API user (only for requests without user token)');
        }
      }

      const { jobId, templateId } = req.body;
      
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

      // Log request with user context
      logger.info('Assembly request received:', {
        jobId,
        templateId,
        userId: req.user?.sub,
        actualUserId,
        isApiUser,
        hasUserToken
      });

      logger.info('Forwarding request to Assembly service:', { 
        jobId,
        templateId,
        userId: actualUserId,
        isApiUser,
        assemblyServiceUrl: config.services.assembly.url
      });

      // Create assembly output record
      const assemblyId = await assemblyDataAccess.createAssemblyOutput(jobId, actualUserId, templateId);

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
router.get('/status/:assemblyId',
  verifyAuth0Token,
  checkPermission('/api/assembly/status'),
  serviceAuthMiddleware,
  async (req, res) => {
    try {
      logger.info('Processing assembly status request');
      
      // Log token details for debugging
      const tokenInfo = {
        type: req.user.gty === 'client-credentials' ? 'M2M' : 'User',
        sub: req.user.sub,
        auth0Id: req.user.auth0_id,
        databaseUser: req.user.databaseUser
      };
      
      //logger.info('Token and user context:', tokenInfo);

      // If this is an M2M token, try to get the actual user profile
      let actualUserId = req.user.databaseUser?.userId;
      let isApiUser = req.user.databaseUser?.isApiUser || false;

      if (tokenInfo.type === 'M2M') {
        try {
          // Get the Authorization header from the original request
          const authHeader = req.headers.authorization;
          const userToken = req.headers['x-user-token'] || req.headers['x-forwarded-user-token'];

          /*logger.info('Checking for user token:', {
            hasUserToken: !!userToken,
            tokenStart: userToken ? `${userToken}` : null,
            profileEndpoint: '/api/auth/profile'
          });*/

          if (userToken) {
            // Try to get user profile using the user token
            const gatewayUrl = config.services?.gateway?.url;
            
            // Check if gateway URL is configured
            if (!gatewayUrl) {
              logger.error('Gateway URL not configured correctly', {
                config: JSON.stringify(config.services || {})
              });
              throw new Error('Gateway URL configuration missing');
            }
            
            const profileUrl = `${gatewayUrl}/api/auth/profile`;
            
            logger.info('Making profile request with user token:', {
              url: profileUrl,
              gatewayUrl,
              headers: {
                'Authorization': `Bearer ${userToken.substring(0, 20)}...`, // Log partial token for security
                'Content-Type': 'application/json'
              }
            });

            try {
              const profileResponse = await axios.get(profileUrl, {
                headers: { 
                  'Authorization': `Bearer ${userToken}`,
                  'Content-Type': 'application/json'
                }
              });

              logger.info('Profile response received:', {
                status: profileResponse.status,
                hasUser: !!profileResponse.data?.user,
                userData: profileResponse.data?.user ? {
                  auth0Id: profileResponse.data.user.auth0_id,
                  email: profileResponse.data.user.email
                } : null,
                fullResponse: profileResponse.data // Log full response for debugging
              });

              if (profileResponse.data?.user) {
                // Get auth0_id from the decoded token
                const decodedToken = jwt.decode(userToken);
                const auth0Id = decodedToken?.auth0_id;
                
                logger.info('Looking up user in database:', { 
                  auth0Id,
                  email: profileResponse.data.user.email,
                  tokenPayload: decodedToken // Log the full payload for debugging
                });
                
                if (!auth0Id) {
                  logger.error('No auth0_id found in token:', { decodedToken });
                  throw new Error('No auth0_id found in token');
                }
                
                try {
                  // Look up user in database
                  const dbUser = await authDataAccess.findUserByAuth0Id(auth0Id);
                  if (dbUser) {
                    actualUserId = dbUser.user_id;
                    isApiUser = false;
                    logger.info('Found user in database:', { 
                      userId: actualUserId,
                      auth0Id,
                      email: dbUser.email 
                    });
                  } else {
                    logger.warn('User not found in database:', { 
                      auth0Id,
                      email: profileResponse.data.user.email 
                    });
                  }
                } catch (dbError) {
                  logger.error('Database error looking up user:', {
                    error: dbError.message,
                    stack: dbError.stack,
                    auth0Id,
                    email: profileResponse.data.user.email
                  });
                }
              } else {
                logger.warn('No user data in profile response:', {
                  responseData: profileResponse.data
                });
              }
            } catch (profileError) {
              logger.error('Error getting user profile:', {
                error: profileError.message,
                stack: profileError.stack,
                response: {
                  status: profileError.response?.status,
                  data: profileError.response?.data
                },
                requestConfig: {
                  url: profileUrl,
                  method: 'GET',
                  baseURL: config.services.auth.url,
                  headers: {
                    'Authorization': 'Bearer [REDACTED]',
                    'Content-Type': 'application/json'
                  }
                },
                configDump: {
                  authUrl: config.services.auth.url,
                  fullConfig: JSON.stringify(config.services.auth)
                }
              });
              logger.warn('Falling back to API user due to profile error');
            }
          }
        } catch (error) {
          logger.error('Error processing user token:', error);
          logger.warn('Falling back to API user');
        }
      }

      const { assemblyId } = req.params;

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
        userId: req.user?.sub,
        actualUserId,
        isApiUser
      });

      const assembly = await assemblyDataAccess.getAssemblyOutput(assemblyId);

      if (!assembly) {
        return res.status(404).json({
          error: 'Assembly not found'
        });
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
router.get('/templates/:aspectRatio',
  verifyAuth0Token,
  checkPermission('/api/assembly/templates'),
  serviceAuthMiddleware,
  async (req, res) => {
    try {
      logger.info('Processing templates request');
      
      // Log token details for debugging
      const tokenInfo = {
        type: req.user.gty === 'client-credentials' ? 'M2M' : 'User',
        sub: req.user.sub,
        auth0Id: req.user.auth0_id,
        databaseUser: req.user.databaseUser
      };
      
      //Slogger.info('Token and user context:', tokenInfo);

      // If this is an M2M token, try to get the actual user profile
      let actualUserId = req.user.databaseUser?.userId;
      let isApiUser = req.user.databaseUser?.isApiUser || false;

      if (tokenInfo.type === 'M2M') {
        try {
          // Get the Authorization header from the original request
          const authHeader = req.headers.authorization;
          const userToken = req.headers['x-user-token'] || req.headers['x-forwarded-user-token'];

          /*logger.info('Checking for user token:', {
            hasUserToken: !!userToken,
            tokenStart: userToken ? `${userToken}` : null,
            profileEndpoint: '/api/auth/profile'
          });*/

          if (userToken) {
            // Try to get user profile using the user token
            const gatewayUrl = config.services?.gateway?.url;
            
            // Check if gateway URL is configured
            if (!gatewayUrl) {
              logger.error('Gateway URL not configured correctly', {
                config: JSON.stringify(config.services || {})
              });
              throw new Error('Gateway URL configuration missing');
            }
            
            const profileUrl = `${gatewayUrl}/api/auth/profile`;
            
            logger.info('Making profile request with user token:', {
              url: profileUrl,
              gatewayUrl,
              headers: {
                'Authorization': `Bearer ${userToken.substring(0, 20)}...`, // Log partial token for security
                'Content-Type': 'application/json'
              }
            });

            try {
              const profileResponse = await axios.get(profileUrl, {
                headers: { 
                  'Authorization': `Bearer ${userToken}`,
                  'Content-Type': 'application/json'
                }
              });

              logger.info('Profile response received:', {
                status: profileResponse.status,
                hasUser: !!profileResponse.data?.user,
                userData: profileResponse.data?.user ? {
                  auth0Id: profileResponse.data.user.auth0_id,
                  email: profileResponse.data.user.email
                } : null,
                fullResponse: profileResponse.data // Log full response for debugging
              });

              if (profileResponse.data?.user) {
                // Get auth0_id from the decoded token
                const decodedToken = jwt.decode(userToken);
                const auth0Id = decodedToken?.auth0_id;
                
                logger.info('Looking up user in database:', { 
                  auth0Id,
                  email: profileResponse.data.user.email,
                  tokenPayload: decodedToken // Log the full payload for debugging
                });
                
                if (!auth0Id) {
                  logger.error('No auth0_id found in token:', { decodedToken });
                  throw new Error('No auth0_id found in token');
                }
                
                try {
                  // Look up user in database
                  const dbUser = await authDataAccess.findUserByAuth0Id(auth0Id);
                  if (dbUser) {
                    actualUserId = dbUser.user_id;
                    isApiUser = false;
                    logger.info('Found user in database:', { 
                      userId: actualUserId,
                      auth0Id,
                      email: dbUser.email 
                    });
                  } else {
                    logger.warn('User not found in database:', { 
                      auth0Id,
                      email: profileResponse.data.user.email 
                    });
                  }
                } catch (dbError) {
                  logger.error('Database error looking up user:', {
                    error: dbError.message,
                    stack: dbError.stack,
                    auth0Id,
                    email: profileResponse.data.user.email
                  });
                }
              } else {
                logger.warn('No user data in profile response:', {
                  responseData: profileResponse.data
                });
              }
            } catch (profileError) {
              logger.error('Error getting user profile:', {
                error: profileError.message,
                stack: profileError.stack,
                response: {
                  status: profileError.response?.status,
                  data: profileError.response?.data
                },
                requestConfig: {
                  url: profileUrl,
                  method: 'GET',
                  baseURL: config.services.auth.url,
                  headers: {
                    'Authorization': 'Bearer [REDACTED]',
                    'Content-Type': 'application/json'
                  }
                },
                configDump: {
                  authUrl: config.services.auth.url,
                  fullConfig: JSON.stringify(config.services.auth)
                }
              });
              logger.warn('Falling back to API user due to profile error');
            }
          }
        } catch (error) {
          logger.error('Error processing user token:', error);
          logger.warn('Falling back to API user');
        }
      }

      const { aspectRatio } = req.params;
      
      logger.info('Templates request received:', {
        aspectRatio,
        userId: req.user?.sub,
        actualUserId,
        isApiUser
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
router.get('/template/:templateId',
  verifyAuth0Token,
  checkPermission('/api/assembly/template'),
  serviceAuthMiddleware,
  async (req, res) => {
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
router.get('/videos', 
  verifyAuth0Token,
  checkPermission('/api/assembly/videos'),
  serviceAuthMiddleware,
  extractUserFromToken,
  async (req, res) => {
    try {
      // Try to get user ID from x-user-token if present
      let userId = req.user.databaseUser.userId;
      let isApiUser = req.user.databaseUser.isApiUser;

      const userToken = req.header('x-user-token');
      if (userToken) {
        try {
          const decodedUserToken = jwt.decode(userToken);
          if (decodedUserToken?.auth0_id) {
            const user = await authDataAccess.findUserByAuth0Id(decodedUserToken.auth0_id);
            if (user) {
              userId = user.user_id;
              isApiUser = false;
            }
          }
        } catch (tokenError) {
          logger.warn('Error decoding user token:', tokenError);
        }
      }

      logger.info('Getting assembly outputs with filters:', {
        userId,
        isApiUser,
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

      // Add user ID if not API user
      if (!isApiUser) {
        filters.userId = userId.toString();
      }

      logger.info('Making request to assembly service:', {
        url: `${config.services.assembly.url}/videos`,
        filters,
        userId,
        isApiUser
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
          isApiUser,
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