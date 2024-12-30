const authService = require('../auth-service');
const logger = require('../../../shared/utils/logger');

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

    const wasSessionFound = await authService.logout(refreshToken, allDevices);
    res.json({ 
      message: wasSessionFound ? 'Successfully logged out' : 'No active session found',
      status: wasSessionFound ? 'success' : 'info'
    });
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
};

module.exports = {
  getProfile,
  refreshToken,
  logout
}; 