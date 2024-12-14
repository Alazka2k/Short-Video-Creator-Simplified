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
    const { user, refreshToken } = await authService.handleSocialLogin(provider, profile);

    res.json({ 
      user,
      tokens: {
        refresh_token: refreshToken,
        expires_in: 30 * 24 * 60 * 60 // 30 days in seconds
      }
    });
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
    const auth0Id = req.auth.payload.sub;
    const user = await authService.getUserProfile(auth0Id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    logger.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
};

const refreshToken = async (req, res) => {
  try {
    const { refresh_token } = req.body;
    
    if (!refresh_token) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }

    const { user, refreshToken: newRefreshToken } = await authService.refreshToken(refresh_token);

    res.json({
      user,
      tokens: {
        refresh_token: newRefreshToken,
        expires_in: 30 * 24 * 60 * 60 // 30 days in seconds
      }
    });
  } catch (error) {
    logger.error('Token refresh error:', error);
    res.status(401).json({ error: 'Invalid refresh token' });
  }
};

const logout = async (req, res) => {
  try {
    const { session_id, all_devices } = req.body;
    await authService.logout(session_id, all_devices);
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