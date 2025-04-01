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

      // Check if a user token is provided
      const userToken = req.headers['x-user-token'] || req.headers['x-forwarded-user-token'];
      const hasUserToken = !!userToken;
      
      // If this is an M2M token, try to get the actual user profile
      let actualUserId = req.user.databaseUser?.userId;
      let isApiUser = req.user.databaseUser?.isApiUser || false;

      if (tokenInfo.type === 'M2M') {
        try {
          logger.info('Checking for user token:', {
            hasUserToken,
            tokenStart: userToken ? `${userToken.substring(0, 10)}...` : null,
            profileEndpoint: '/api/auth/profile'
          });

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
            
            logger.info('Verify Gateway URL:', gatewayUrl);
            
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
                    // This prevents falling back to API user
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
                  // This prevents falling back to API user
                  if (hasUserToken) {
                    throw new Error('Database error while validating user token');
                  }
                }
              } else {
                logger.warn('No user data in profile response');
                
                // If we have a user token but profile doesn't return user data, we should not proceed
                // This prevents falling back to API user
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
              
              // If we have a user token but encounter an error, we should not proceed
              // This prevents falling back to API user
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
            stack: error.stack,
            response: {
              status: error.response?.status,
              data: error.response?.data
            }
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

      // Create job request payload
      const jobPayload = {
        prompt,
        parameters: parameters || {},
        userId: actualUserId,
        visualizationType: visualizationType || 'video',
        // Include flag for API user so other services know if this is a real user or API user
        isApiUser,
        // Also include security metadata so services know if a real user was securely identified
        securityContext: {
          hasUserToken,
          identitySource: hasUserToken ? 'user_token' : (isApiUser ? 'api_token' : 'user_session')
        }
      };

      // Send job to job-service
      const response = await axios.post(`${config.services.job.url}/generate`, jobPayload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 120000  // 120 seconds timeout - give more time for the job service to acknowledge
      });

      logger.info('Job response received:', { 
        status: response.status, 
        jobId: response.data.jobId || response.data.result?.jobId,
        hasResult: !!response.data
      });

      // Return the job results - the job service will continue processing in the background
      res.json({
        message: 'Job submitted successfully and is now processing',
        jobId: response.data.jobId || response.data.result?.jobId,
        status: 'in_progress',
        ...response.data
      });

    } catch (error) {
      logger.error('Job error:', { 
        error: error.message,
        status: error.response?.status,
        data: error.response?.data
      });

      // Send appropriate error response
      const status = error.response?.status || 500;
      const message = error.response?.data?.message || error.message;
      
      res.status(status).json({
        error: 'Job generation failed',
        message,
        details: error.response?.data || error.message
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

       logger.info('Job response data:', {
         jobId: req.params.jobId,
         responseUserId: response.data.user_id,
         requestUserId: userId,
      //   responseData: response.data,
         isApiUser
       });

      // If not API user, verify job belongs to user
      if (!isApiUser && response.data.user_id?.toString() !== userId?.toString()) {
        logger.warn('Access denied to job:', {
          jobId: req.params.jobId,
          jobUserId: response.data.user_id,
          requestUserId: userId,
          isApiUser
        });
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
        status
      };

      // Handle services parameter
      if (services) {
        if (typeof services === 'string') {
          filters.services = [services];
        } else if (Array.isArray(services)) {
          filters.services = services;
        }
      }

      // Add user ID if not API user
      if (!isApiUser) {
        filters.userId = userId.toString();
      }

      logger.info('Making request to job service:', {
        url: `${config.services.job.url}/jobs`,
        filters,
        userId,
        isApiUser
      });

      try {
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

/**
 * @route GET /api/job/jobs/:jobId/progress
 * @description Get progress of a specific job
 * @access Protected - requires read:job permission
 */
router.get('/jobs/:jobId/progress',
  verifyAuth0Token,
  checkPermission('/api/job/jobs'),
  serviceAuthMiddleware,
  extractUserFromToken,
  async (req, res) => {
    try {
      const userId = req.user.databaseUser.userId;
      const isApiUser = req.user.databaseUser.isApiUser;
      const { jobId } = req.params;
      
      logger.info(`Fetching progress for job ${jobId}`, { userId, isApiUser });
      
      // First get job details to verify ownership
      const jobResponse = await axios.get(`${config.services?.job?.url}/jobs/${jobId}`, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000  // 10 seconds timeout
      });
      
      // If not API user, verify job belongs to user
      if (!isApiUser && jobResponse.data.user_id?.toString() !== userId?.toString()) {
        logger.warn('Access denied to job progress:', {
          jobId: jobId,
          jobUserId: jobResponse.data.user_id,
          requestUserId: userId,
          isApiUser
        });
        return res.status(403).json({
          error: 'Access denied',
          message: 'You do not have permission to access this job'
        });
      }
      
      // Get the actual progress
      const response = await axios.get(`${config.services?.job?.url}/jobs/${jobId}/progress`);
      
      logger.info('Job progress retrieved:', {
        jobId: jobId,
        status: response.status,
        hasData: !!response.data,
        progress: response.data?.overallProgress,
        jobStatus: response.data?.status
      });
      
      res.json(response.data);
    } catch (error) {
      logger.error('Job progress error:', {
        jobId: req.params.jobId,
        error: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      
      if (error.response?.status === 404) {
        return res.status(404).json({ error: 'Job progress not found' });
      }
      
      res.status(error.response?.status || 500).json({
        error: 'Failed to get job progress',
        details: error.response?.data?.details || error.message
      });
    }
  }
);

module.exports = router; 