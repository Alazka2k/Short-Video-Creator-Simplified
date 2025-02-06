const express = require('express');
const router = express.Router();
const axios = require('axios');
const logger = require('../../shared/utils/logger');
const config = require('../../shared/utils/config');
const { verifyAuth0Token, checkPermission } = require('../../services/auth-service/middleware/auth0-verify.middleware');
const serviceAuthMiddleware = require('../middleware/serviceAuth');
const authDataAccess = require('../../services/auth-service/data/authDataAccess');
const jwt = require('jsonwebtoken');
const extractUserFromToken = require('../middleware/userTokenExtractor');

/**
 * @route POST /api/job/generate
 * @description Generate a new job
 * @access Protected - requires create:job permission
 */
router.post('/generate',
  verifyAuth0Token,
  checkPermission('/api/job/generate'),
  serviceAuthMiddleware,
  async (req, res) => {
    try {
      logger.info('Processing job generation request');
      
      // Log token details for debugging
      const tokenInfo = {
        type: req.user.gty === 'client-credentials' ? 'M2M' : 'User',
        sub: req.user.sub,
        auth0Id: req.user.auth0_id,
        databaseUser: req.user.databaseUser
      };
      
      logger.info('Token and user context:', tokenInfo);

      // If this is an M2M token, try to get the actual user profile
      let actualUserId = req.user.databaseUser?.userId;
      let isApiUser = req.user.databaseUser?.isApiUser || false;

      if (tokenInfo.type === 'M2M') {
        try {
          // Get the Authorization header from the original request
          const authHeader = req.headers.authorization;
          const userToken = req.headers['x-user-token'] || req.headers['x-forwarded-user-token'];

          logger.info('Checking for user token:', {
            hasUserToken: !!userToken,
            tokenStart: userToken ? `${userToken}` : null,
            profileEndpoint: '/api/auth/profile'
          });

          if (userToken) {
            // Try to get user profile using the user token
            const gatewayUrl = process.env[`${process.env.NODE_ENV?.toUpperCase()}_GATEWAY_SERVICE_PORT`] || 'http://localhost:3000';
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
          } else {
            logger.warn('No valid user token found');
          }
        } catch (profileError) {
          logger.error('Error getting user profile:', {
            error: profileError.message,
            stack: profileError.stack,
            config: profileError.config,
            response: {
              status: profileError.response?.status,
              data: profileError.response?.data
            }
          });
          logger.warn('Falling back to API user due to profile error');
        }
      }

      const { prompt, parameters, visualizationType } = req.body;

      // Basic validation
      if (!prompt) {
        throw new Error('Missing required parameter: prompt');
      }

      logger.info('Forwarding request to Job service:', {
        userId: actualUserId,
        isApiUser,
        hasPrompt: !!prompt,
        hasParameters: !!parameters,
        visualizationType,
        jobServiceUrl: config.services.job.url
      });

      if (!config.services.job.url) {
        throw new Error('Job service URL is not configured');
      }

      const jobServiceUrl = `${config.services.job.url}/generate`;
      const requestBody = {
        prompt,
        parameters,
        visualizationType,
        userId: actualUserId.toString()
      };

      try {
        const response = await axios.post(jobServiceUrl, requestBody, {
          headers: { 'Content-Type': 'application/json' },
          timeout: 1800000  // 30 minutes timeout
        });

        logger.info('Received response from Job service:', {
          status: response.status,
          hasData: !!response.data,
          userId: actualUserId,
          isApiUser
        });

        res.json(response.data);
      } catch (error) {
        logger.error('Job service request failed:', {
          error: error.message,
          stack: error.stack,
          config: {
            url: jobServiceUrl,
            method: 'POST',
            timeout: 1800000
          },
          response: {
            status: error.response?.status,
            data: error.response?.data
          },
          userId: actualUserId,
          isApiUser
        });

        throw error;
      }
    } catch (error) {
      logger.error('Job generation error:', {
        error: error.message,
        stack: error.stack,
        status: error.response?.status,
        userId: req.user?.databaseUser?.userId
      });

      res.status(error.response?.status || 500).json({
        error: 'Job generation failed',
        details: error.response?.data?.details || error.message
      });
    }
  }
);

/**
 * @route GET /api/job/jobs/:jobId
 * @description Get details of a specific job
 * @access Protected - requires read:job permission
 */
router.get('/jobs/:jobId',
  verifyAuth0Token,
  checkPermission('/api/job/jobs'),
  serviceAuthMiddleware,
  extractUserFromToken,
  async (req, res) => {
    try {
      const userId = req.user.databaseUser.userId;
      const isApiUser = req.user.databaseUser.isApiUser;

      logger.info(`Fetching job details for jobId: ${req.params.jobId}`, {
        userId,
        isApiUser
      });

      const response = await axios.get(`${config.services.job.url}/jobs/${req.params.jobId}`, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000  // 30 seconds timeout
      });

      // If not API user, verify job belongs to user
      if (!isApiUser && response.data.userId !== userId) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You do not have permission to access this job'
        });
      }

      logger.info('Job details retrieved:', {
        jobId: req.params.jobId,
        status: response.status,
        hasData: !!response.data,
        userId,
        isApiUser
      });

      res.json(response.data);
    } catch (error) {
      logger.error('Job details error:', {
        jobId: req.params.jobId,
        error: error.message,
        status: error.response?.status
      });

      res.status(error.response?.status || 500).json({
        error: 'Failed to get job details',
        details: error.response?.data?.details || error.message
      });
    }
  }
);

/**
 * @route GET /api/job/jobs
 * @description Get list of all jobs with pagination and filtering
 * @access Protected - requires read:job permission
 */
router.get('/jobs',
  verifyAuth0Token,
  checkPermission('/api/job/jobs'),
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

      logger.info('Processing get jobs request', {
        userId,
        isApiUser,
        query: req.query
      });

      // Extract query parameters
      const {
        page,
        limit,
        sortBy,
        sortOrder,
        services,
        status
      } = req.query;

      // Build filters object
      const filters = {
        page,
        limit,
        sortBy,
        sortOrder,
        status,
        ...(services ? { services: services.split(',') } : {}),
        ...(isApiUser ? {} : { userId: userId.toString() })
      };

      const response = await axios.get(`${config.services.job.url}/jobs`, {
        params: filters,
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000  // 30 seconds timeout
      });

      logger.info('Jobs list retrieved:', {
        status: response.status,
        hasData: !!response.data,
        userId,
        isApiUser,
        jobCount: response.data?.data?.length || 0,
        pagination: response.data?.pagination
      });

      // Process URLs in the response data
      const StorageUrlHelper = require('../../shared/utils/storage-url-helper');
      const processedData = await Promise.all(response.data.data.map(async job => {
        if (job.metadata?.scenes) {
          for (const scene of job.metadata.scenes) {
            if (scene.image) {
              scene.image = await StorageUrlHelper.refreshUrlsInObject(scene.image);
            }
            if (scene.video) {
              scene.video = await StorageUrlHelper.refreshUrlsInObject(scene.video);
            }
            if (scene.voice) {
              scene.voice = await StorageUrlHelper.refreshUrlsInObject(scene.voice);
            }
          }
          if (job.metadata.music) {
            job.metadata.music = await StorageUrlHelper.refreshUrlsInObject(job.metadata.music);
          }
        }
        return job;
      }));

      res.json({
        data: processedData,
        pagination: response.data.pagination
      });
    } catch (error) {
      logger.error('Jobs list request error:', {
        error: error.message,
        stack: error.stack,
        status: error.response?.status
      });

      res.status(error.response?.status || 500).json({
        error: 'Failed to get jobs list',
        details: error.response?.data?.details || error.message
      });
    }
  }
);

module.exports = router; 