// auth-controller.js
const { auth0 } = require('./auth0');
const authService = require('./auth-service');
const logger = require('../../shared/utils/logger');

const loginWithSocial = async (req, res) => {
  try {
    const { accessToken, provider, profile } = req.body;

    // Validate required fields
    if (!accessToken || !provider || !profile) {
      return res.status(400).json({ 
        error: 'Missing required fields', 
        required: ['accessToken', 'provider', 'profile'] 
      });
    }

    // Handle social login
    const { user, tokens } = await authService.handleSocialLogin(provider, profile);

    res.json({ user, tokens });
  } catch (error) {
    logger.error('Social login error:', error);
    res.status(500).json({ 
      error: 'Login failed', 
      message: 'An unexpected error occurred during login'
    });
  }
};

const handleRegisterCallback = async (req, res) => {
  try {
    const { email, sub: auth0Id, name, picture } = req.body;

    // Create user in our database after Auth0 registration
    const { user, refreshToken } = await authService.handleNewUser({
      auth0Id,
      email,
      name: name || email.split('@')[0], // Use email username if no name provided
      picture: picture || null,
      provider: 'auth0'
    });

    res.json({ 
      user,
      tokens: {
        refresh_token: refreshToken,
        expires_in: 30 * 24 * 60 * 60 // 30 days in seconds
      }
    });
  } catch (error) {
    logger.error('Registration callback error:', error);
    res.status(500).json({ 
      error: 'Registration failed', 
      message: 'An unexpected error occurred during registration'
    });
  }
};

const getProfile = async (req, res) => {
  try {
    // req.user is set by our authenticate middleware
    if (!req.user || !req.user.auth0Id) {
      logger.error('Missing user or auth0Id in request:', req.user);
      return res.status(400).json({ 
        error: 'Bad Request', 
        message: 'User ID not found in token' 
      });
    }

    const auth0Id = req.user.auth0Id;
    logger.info('Getting profile for auth0Id:', auth0Id);
    
    const user = await authService.getUserProfile(auth0Id);

    if (!user) {
      logger.warn('No user found for auth0Id:', auth0Id);
      return res.status(404).json({ 
        error: 'Not Found',
        message: 'User profile not found'
      });
    }

    logger.info('Successfully retrieved profile for auth0Id:', auth0Id);
    res.json({ user });
  } catch (error) {
    logger.error('Get profile error:', error);
    
    if (error.name === 'UnauthorizedError') {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Invalid or expired token'
      });
    }

    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Failed to get user profile'
    });
  }
};

const refreshToken = async (req, res) => {
  try {
    const refreshToken = req.body.refresh_token || req.body.refreshToken;
    
    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }

    const { user, tokens } = await authService.refreshToken(refreshToken);
    res.json({ user, tokens });
  } catch (error) {
    logger.error('Token refresh error:', error);
    res.status(401).json({ error: 'Invalid refresh token' });
  }
};

const logout = async (req, res) => {
  try {
    const refreshToken = req.body.refresh_token || req.body.refreshToken;
    const allDevices = req.body.all_devices || req.body.allDevices;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }

    await authService.logout(refreshToken, allDevices);
    res.json({ message: 'Successfully logged out' });
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
};

module.exports = {
  loginWithSocial,
  handleRegisterCallback,
  getProfile,
  refreshToken,
  logout
};