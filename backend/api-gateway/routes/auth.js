const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const socialAuthController = require('../../services/auth-service/controllers/social-auth-controller');
const emailAuthController = require('../../services/auth-service/controllers/email-auth-controller');
const userController = require('../../services/auth-service/controllers/user-controller');
const { verifyJwtToken } = require('../../services/auth-service/middleware/jwt-verify.middleware');
const { verifyAuth0Token, checkPermission } = require('../../services/auth-service/middleware/auth0-verify.middleware');
const logger = require('../../shared/utils/logger');
const authService = require('../../services/auth-service/auth-service');

// Rate limiting configuration
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 failed attempts
  message: {
    error: 'Too many login attempts, please try again later',
    retryAfter: '15 minutes'
  }
});

const refreshLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100, // 100 refresh attempts per hour
  message: {
    error: 'Too many token refresh attempts',
    retryAfter: '1 hour'
  }
});

const m2mTokenLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100, // 100 token requests per hour
  message: {
    error: 'Too many M2M token requests',
    retryAfter: '1 hour'
  }
});

const m2mVerifyLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 1000, // 1000 verify requests per hour
  message: {
    error: 'Too many M2M token verify requests',
    retryAfter: '1 hour'
  }
});

// Social auth routes
router.post('/social', loginLimiter, socialAuthController.loginWithSocial);
router.post('/register-callback', loginLimiter, socialAuthController.handleRegisterCallback);

// Email auth routes
router.post('/register', loginLimiter, emailAuthController.registerWithEmail);
router.post('/login', loginLimiter, emailAuthController.loginWithEmail);
router.post('/forgot-password', loginLimiter, emailAuthController.forgotPassword);
router.post('/reset-password', loginLimiter, emailAuthController.resetPassword);

// User management routes
router.get('/profile', verifyJwtToken, userController.getProfile);
router.post('/refresh', refreshLimiter, userController.refreshToken);
router.post('/logout', userController.logout);

// M2M Token routes
router.post('/token', m2mTokenLimiter, async (req, res) => {
  try {
    const { client_id, client_secret, audience, grant_type } = req.body;
    
    logger.info('M2M token request received:', {
      hasClientId: !!client_id,
      hasClientSecret: !!client_secret,
      audience,
      grantType: grant_type,
      environment: process.env.NODE_ENV
    });

    // Validate required fields
    if (!client_id || !client_secret || !audience || grant_type !== 'client_credentials') {
      logger.warn('Invalid M2M token request:', {
        missingClientId: !client_id,
        missingClientSecret: !client_secret,
        missingAudience: !audience,
        invalidGrantType: grant_type !== 'client_credentials'
      });
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Missing required fields or invalid grant type'
      });
    }

    logger.info('Requesting M2M token from Auth0 service');
    const tokenData = await authService.getM2MToken({
      clientId: client_id,
      clientSecret: client_secret,
      audience
    });
    
    logger.info('M2M token obtained successfully', {
      hasAccessToken: !!tokenData.access_token,
      tokenType: tokenData.token_type,
      expiresIn: tokenData.expires_in
    });

    res.json(tokenData);
  } catch (error) {
    logger.error('Error getting M2M token:', {
      error: error.message,
      stack: error.stack,
      environment: process.env.NODE_ENV
    });
    res.status(500).json({ 
      error: 'Failed to get M2M token',
      message: error.message
    });
  }
});

router.post('/m2m/verify', m2mVerifyLimiter, verifyAuth0Token, async (req, res) => {
  try {
    // Token is already verified by verifyAuth0Token middleware
    // and user info is attached to req.user
    const scopes = (req.user.scope || '').split(' ');
    
    res.json({
      valid: true,
      token: {
        sub: req.user.sub,
        scope: scopes,
        gty: req.user.gty
      }
    });
  } catch (error) {
    logger.error('Error in M2M token verification:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Error handling middleware
router.use((err, req, res, next) => {
  logger.error('Auth route error:', err);
  
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      error: 'Invalid token',
      message: 'Authentication required'
    });
  }

  if (err.name === 'ForbiddenError') {
    return res.status(403).json({
      error: 'Access denied',
      message: 'Insufficient permissions'
    });
  }

  res.status(500).json({
    error: 'Internal server error',
    message: 'An unexpected error occurred'
  });
});

module.exports = router; 