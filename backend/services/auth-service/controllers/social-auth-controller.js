const { auth0 } = require('../auth0');
const authService = require('../auth-service');
const logger = require('../../../shared/utils/logger');

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
      auth0_id: auth0Id,
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

module.exports = {
  loginWithSocial,
  handleRegisterCallback
}; 