const knex = require('knex')(require('../../../../knexfile')[process.env.NODE_ENV]);
const logger = require('../../../shared/utils/logger');
const config = require('../../../shared/utils/config');

class AuthDataAccess {
  async findUserByAuth0Id(auth0Id) {
    try {
      return await knex('users')
        .select(
          'user_id',
          'auth0_id',
          'email',
          'full_name',
          'picture',
          'provider',
          'last_login',
          'subscription_plan_id'
        )
        .where('auth0_id', auth0Id)
        .first();
    } catch (error) {
      logger.error('Error finding user by auth0Id:', error);
      throw error;
    }
  }

  async findUserById(userId) {
    try {
      return await knex('users')
        .where('user_id', userId)
        .first();
    } catch (error) {
      logger.error('Error finding user by user_id:', error);
      throw error;
    }
  }

  async findUserByEmail(email) {
    try {
      return await knex('users')
        .where('email', email)
        .first();
    } catch (error) {
      logger.error('Error finding user by email:', error);
      throw error;
    }
  }

  async updateUser(auth0Id, userData) {
    try {
      await knex('users')
        .where('auth0_id', auth0Id)
        .update({
          email: userData.email,
          full_name: userData.name,
          picture: userData.picture,
          last_login: new Date(),
          updated_at: new Date()
        });

      return this.findUserByAuth0Id(auth0Id);
    } catch (error) {
      logger.error('Error updating user:', error);
      throw error;
    }
  }

  async updateUserById(userId, userData) {
    try {
      await knex('users')
        .where('user_id', userId)
        .update({
          ...userData,
          updated_at: new Date()
        });

      return this.findUserById(userId);
    } catch (error) {
      logger.error('Error updating user by user_id:', error);
      throw error;
    }
  }

  async createUser(userData) {
    try {
      logger.info('Starting database transaction for user creation');
      logger.info('Input userData:', JSON.stringify(userData, null, 2));

      const result = await knex.transaction(async (trx) => {
        // First check if user already exists
        logger.info('Checking for existing user with auth0_id:', userData.auth0_id);
        
        const existingUser = await trx('users')
          .where('auth0_id', userData.auth0_id)
          .first();

        if (existingUser) {
          logger.info('Found existing user:', JSON.stringify(existingUser, null, 2));
          return existingUser;
        }

        logger.info('No existing user found, proceeding with insertion');
        
        // Insert user and get the id
        const [newUser] = await trx('users')
          .insert({
            auth0_id: userData.auth0_id,
            email: userData.email,
            full_name: userData.name,
            picture: userData.picture,
            provider: userData.provider,
            last_login: new Date(),
            created_at: new Date(),
            updated_at: new Date(),
            subscription_plan_id: 1, // Explicitly set the default plan ID
            video_preferences: {
              defaultStyle: 'modern',
              defaultVoice: 'neural-1',
              defaultLanguage: 'en',
              defaultResolution: '1080p',
              defaultAspectRatio: '16:9'
            },
            notification_settings: {
              emailNotifications: true,
              errorNotifications: true,
              videoCompletionAlert: true
            },
            api_settings: {
              apiKeys: [],
              allowedIps: [],
              webhookUrl: null
            }
          })
          .returning('*');

        // Double check we got a user
        if (!newUser || !newUser.user_id) {
          throw new Error('Failed to create user - no ID returned');
        }

        // Assign default role
        await trx('user_roles').insert({
          user_id: newUser.user_id,
          role_id: 2  // User role for new users (not admin)
        });

        // Create free trial subscription
        const now = new Date();
        const trialEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

        await trx('user_subscriptions').insert({
          user_id: newUser.user_id,
          plan_id: 1,
          status: 'active',
          start_date: now,
          current_period_start: now,
          current_period_end: trialEnd,
          created_at: now,
          updated_at: now
        });

        return newUser;
      });

      // Get full user details after transaction
      return this.getUserWithRoleAndSubscription(userData.auth0_id);
    } catch (error) {
      logger.error('Error creating user:', error);
      throw error;
    }
  }

  async deleteUser(auth0Id) {
    try {
      await knex('users')
        .where('auth0_id', auth0Id)
        .delete();
    } catch (error) {
      logger.error('Error deleting user:', error);
      throw error;
    }
  }

  async getUserWithRoleAndSubscription(auth0Id) {
    try {
      return await knex('users')
        .where('users.auth0_id', auth0Id)
        .leftJoin('user_roles', 'users.user_id', 'user_roles.user_id')
        .leftJoin('roles', 'user_roles.role_id', 'roles.role_id')
        .leftJoin('user_subscriptions', 'users.user_id', 'user_subscriptions.user_id')
        .select(
          'users.*',
          'roles.role_name as role_name',
          'roles.description as role_description',
          'user_subscriptions.plan_id',
          'user_subscriptions.status',
          knex.raw('COALESCE(user_subscriptions.current_period_end, NOW()) as current_period_end')
        )
        .first();
    } catch (error) {
      logger.error('Error getting user with role and subscription:', error);
      throw error;
    }
  }

  async getUserRole(userId) {
    try {
      return await knex('user_roles')
        .where('user_roles.user_id', userId)
        .leftJoin('roles', 'user_roles.role_id', 'roles.role_id')
        .select('roles.role_name')
        .first();
    } catch (error) {
      logger.error('Error getting user role:', { userId, error: error.message });
      throw error;
    }
  }

  async getUserPermissions(auth0Id) {
    try {
      const user = await knex('users')
        .where('auth0_id', auth0Id)
        .leftJoin('user_roles', 'users.user_id', 'user_roles.user_id')
        .first();

      if (!user?.role_id) {
        return [];
      }

      return await knex('permissions')
        .join('role_permissions', 'permissions.id', 'role_permissions.permission_id')
        .where('role_permissions.role_id', user.role_id)
        .select('permissions.*');
    } catch (error) {
      logger.error('Error getting user permissions:', error);
      throw error;
    }
  }
}

module.exports = new AuthDataAccess(); 