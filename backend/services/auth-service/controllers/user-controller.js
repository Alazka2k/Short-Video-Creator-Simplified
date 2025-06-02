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
    // Get refresh token from cookies first, then fall back to request body
    const refreshToken = req.cookies?.refresh_token || req.body.refresh_token || req.body.refreshToken;
    
    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }

    const { user, tokens } = await authService.refreshToken(refreshToken);
    
    // Set new tokens as secure httpOnly cookies
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/'
    };

    // Set access token cookie (shorter expiry)
    res.cookie('access_token', tokens.access_token, {
      ...cookieOptions,
      maxAge: tokens.expires_in * 1000 // Convert to milliseconds
    });

    // Set refresh token cookie (longer expiry)
    res.cookie('refresh_token', tokens.refresh_token, {
      ...cookieOptions,
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    // Return only minimal user data
    const safeUserData = {
      user_id: user.user_id,
      email: user.email,
      name: user.full_name || user.name,
      picture: user.picture,
      provider: user.provider
    };

    res.json({ 
      success: true,
      user: safeUserData,
      message: 'Token refreshed successfully'
    });
  } catch (error) {
    logger.error('Token refresh error:', error);
    res.status(401).json({ error: 'Invalid refresh token' });
  }
};

const logout = async (req, res) => {
  try {
    // Get refresh token from cookies first, then fall back to request body
    const refreshToken = req.cookies?.refresh_token || req.body.refresh_token || req.body.refreshToken;
    const allDevices = req.body.all_devices || req.body.allDevices;

    if (!refreshToken) {
      return res.status(400).json({ 
        error: 'Refresh token is required',
        message: 'A refresh token is required for logout'
      });
    }

    logger.info('Calling authService.logout with refreshToken:', refreshToken);
    const result = await authService.logout(refreshToken, allDevices);
    logger.info('Logout result:', JSON.stringify(result, null, 2));
    
    // Clear the httpOnly cookies
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/'
    };

    res.clearCookie('access_token', cookieOptions);
    res.clearCookie('refresh_token', cookieOptions);

    // Handle case where result is undefined
    if (!result) {
      logger.warn('Logout result is undefined');
      return res.status(500).json({
        error: 'Logout failed',
        message: 'Failed to process logout request'
      });
    }
    
    // Send appropriate status code based on result status
    logger.info('Processing logout result with status:', result.status);
    
    switch (result.status) {
      case 'error':
        return res.status(401).json(result);
      case 'info':
        return res.status(200).json(result);
      case 'success':
        return res.status(200).json(result);
      default:
        logger.warn('Unexpected result status:', result.status);
        return res.status(200).json(result);
    }
  } catch (error) {
    logger.error('Logout error:', {
      message: error.message,
      stack: error.stack
    });
    return res.status(500).json({ 
      error: 'Logout failed',
      message: 'Failed to process logout request'
    });
  }
};

module.exports = {
  getProfile,
  refreshToken,
  logout
}; 