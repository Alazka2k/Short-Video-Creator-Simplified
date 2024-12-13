// auth-controller.js
const { auth0 } = require('./auth0');
const authDataAccess = require('./data/authDataAccess');
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

    // Find or create user
    let user = await authDataAccess.findUserByAuth0Id(profile.sub);
    
    if (!user) {
      user = await authDataAccess.createUser({
        auth0Id: profile.sub,
        email: profile.email,
        name: profile.name,
        picture: profile.picture,
        provider
      });
    } else {
      user = await authDataAccess.updateUser(profile.sub, {
        email: profile.email,
        name: profile.name,
        picture: profile.picture
      });
    }

    // Get user with roles and subscription
    const userWithDetails = await authDataAccess.getUserWithRoleAndSubscription(profile.sub);

    res.json({ user: userWithDetails });
  } catch (error) {
    logger.error('Social login error:', error);
    res.status(500).json({ error: 'Login failed', details: error.message });
  }
};

const getProfile = async (req, res) => {
  try {
    const auth0Id = req.user.sub;
    const userWithDetails = await authDataAccess.getUserWithRoleAndSubscription(auth0Id);

    if (!userWithDetails) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: userWithDetails });
  } catch (error) {
    logger.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile', details: error.message });
  }
};

module.exports = {
  loginWithSocial,
  getProfile
};