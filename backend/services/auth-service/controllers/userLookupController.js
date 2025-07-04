const logger = require('../../../shared/utils/logger');
const authDataAccess = require('../data/authDataAccess');

async function lookupUser(req, res) {
  const { email, auth0_id, name, picture, provider } = req.body;

  if (!email || !auth0_id) {
    logger.warn('User lookup request missing email or auth0_id.', { body: req.body });
    return res.status(400).json({ error: 'Email and Auth0 ID are required.' });
  }

  try {
    let user = await authDataAccess.getUserWithRoleAndSubscription(auth0_id);

    if (!user) {
      logger.info('User not found by auth0_id, checking by email.', { email });
      const existingUserByEmail = await authDataAccess.findUserByEmail(email);

      if (existingUserByEmail) {
        logger.info('Found existing user by email, linking auth0_id.', { userId: existingUserByEmail.user_id });
        await authDataAccess.updateUserById(existingUserByEmail.user_id, { auth0_id });
        user = await authDataAccess.getUserWithRoleAndSubscription(auth0_id);
      } else {
        logger.info('User not found by email, creating new user.', { auth0_id });
        // User does not exist, create a new one
        // The createUser method now handles default role and subscription
        user = await authDataAccess.createUser({
          auth0_id,
          email,
          name: name || email.split('@')[0],
          picture,
          provider: provider || 'unknown',
        });
      }
    } else {
        logger.info('User found by auth0_id.', { auth0_id, userId: user.user_id });
        // Optional: Update user info if it has changed from the auth provider
        const updates = {};
        if (name && user.full_name !== name) updates.full_name = name;
        if (picture && user.picture !== picture) updates.picture = picture;

        if (Object.keys(updates).length > 0) {
            logger.info('Updating user info.', { userId: user.user_id, updates });
            user = await authDataAccess.updateUser(user.user_id, updates);
            logger.info('User updated', { user_id: user.user_id, updates });

            // Re-fetch user to get the latest data after update
            user = await authDataAccess.findUserByAuth0Id(auth0_id);
        }
    }

    if (!user || !user.plan_id || !user.role_name) {
        logger.error('User record is inconsistent. Missing role or subscription.', { userId: user?.user_id });
        return res.status(500).json({ error: 'User data is inconsistent.' });
    }

    // Always return the full user data object to be added to claims
    const permissions = await authDataAccess.getUserPermissions(auth0_id);

    const userData = {
      user_id: user.user_id,
      email: user.email,
      name: user.full_name,
      picture: user.picture,
      provider: user.provider,
      is_admin: user.role_name === 'admin',
      permissions: permissions || [],
      subscription_plan_id: user.plan_id,
    };
    
    logger.info('Successfully looked up user. Returning data for claims.', { userId: user.user_id });
    res.status(200).json(userData);

  } catch (error) {
    logger.error('Error in user lookup controller', { error: error.message, stack: error.stack, auth0_id });
    res.status(500).json({ error: 'An internal error occurred during user lookup.' });
  }
}

module.exports = {
  lookupUser,
}; 