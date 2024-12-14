const knex = require('knex')(require('../../../../knexfile')[process.env.NODE_ENV]);
const logger = require('../../../shared/utils/logger');
const config = require('../../../shared/utils/config');

class AuthDataAccess {
  async findUserByAuth0Id(auth0Id) {
    try {
      return await knex('users')
        .where('auth0_id', auth0Id)
        .first();
    } catch (error) {
      logger.error('Error finding user by auth0Id:', error);
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

  async createUser(userData) {
    try {
      const result = await knex.transaction(async (trx) => {
        // First check if user already exists
        const existingUser = await trx('users')
          .where('auth0_id', userData.auth0Id)
          .first();

        if (existingUser) {
          return existingUser;
        }

        // Insert user and get the id
        const [newUser] = await trx('users')
          .insert({
            auth0_id: userData.auth0Id,
            email: userData.email,
            full_name: userData.name,
            picture: userData.picture,
            provider: userData.provider,
            last_login: new Date(),
            created_at: new Date(),
            updated_at: new Date(),
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
          role_id: 1
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
      return this.getUserWithRoleAndSubscription(userData.auth0Id);
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
        .where('auth0_id', auth0Id)
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

  async trackVideoCreation(auth0Id) {
    const user = await this.getUserWithRoleAndSubscription(auth0Id);
    
    // Check subscription status
    if (!user.status || user.status !== 'active') {
      throw new Error('No active subscription');
    }

    // Check if subscription has expired
    if (new Date(user.current_period_end) < new Date()) {
      throw new Error('Subscription has expired');
    }
    
    // Get subscription limits from plan
    const plan = await knex('subscription_plans')
      .where('id', user.plan_id)
      .first();
    
    // Check monthly usage
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    
    const videoCount = await knex('jobs')
      .where('user_id', user.user_id)
      .where('created_at', '>=', monthStart)
      .count('user_id as count')
      .first();
      
    if (videoCount.count >= plan.monthly_video_limit) {
      throw new Error('Monthly video quota exceeded');
    }
    
    // Track usage
    await knex('usage_logs').insert({
      user_id: user.user_id,
      action: 'video_creation',
      subscription_plan_id: plan.id,
      created_at: new Date()
    });
  }

  async getUserUsage(auth0Id) {
    const user = await this.findUserByAuth0Id(auth0Id);
    return await knex('jobs')
      .where('user_id', user.user_id)
      .select(
        knex.raw('DATE_TRUNC(\'month\', created_at) as month'),
        knex.raw('COUNT(*) as video_count'),
        knex.raw('SUM(duration) as total_duration')
      )
      .groupBy(knex.raw('DATE_TRUNC(\'month\', created_at)'))
      .orderBy('month', 'desc')
      .limit(12);
  }

  async createSession(userId) {
    try {
      const [sessionId] = await knex('user_sessions')
        .insert({
          user_id: userId,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          created_at: new Date()
        })
        .returning('session_id');

      await this.logAuthEvent(userId, 'session_created');
      return typeof sessionId === 'object' ? sessionId.session_id : sessionId;
    } catch (error) {
      logger.error('Error creating session:', error);
      throw error;
    }
  }

  async invalidateSession(sessionId, reason = 'user_logout') {
    try {
      const session = await knex('user_sessions')
        .where('session_id', sessionId)
        .first();

      if (session) {
        await knex('user_sessions')
          .where('session_id', sessionId)
          .update({
            is_valid: false,
            invalidated_at: new Date(),
            invalidation_reason: reason
          });

        await this.logAuthEvent(session.user_id, 'session_invalidated', { reason });
      }
    } catch (error) {
      logger.error('Error invalidating session:', error);
      throw error;
    }
  }

  async createVerificationToken(userId, type) {
    try {
      const [tokenId] = await knex('verification_tokens').insert({
        user_id: userId,
        type,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        created_at: new Date()
      }).returning('token_id');

      await this.logAuthEvent(userId, 'verification_token_created', { type });
      return tokenId;
    } catch (error) {
      logger.error('Error creating verification token:', error);
      throw error;
    }
  }

  async verifyToken(tokenHash, type) {
    try {
      const token = await knex('verification_tokens')
        .where('token_hash', tokenHash)
        .where('type', type)
        .where('is_valid', true)
        .where('expires_at', '>', new Date())
        .first();

      if (token) {
        await knex('verification_tokens')
          .where('token_id', token.token_id)
          .update({
            is_valid: false,
            used_at: new Date()
          });

        await this.logAuthEvent(token.user_id, 'token_verified', { type });
      }

      return token;
    } catch (error) {
      logger.error('Error verifying token:', error);
      throw error;
    }
  }

  async logAuthEvent(userId, eventType, details = {}) {
    try {
      await knex('auth_logs').insert({
        user_id: userId,
        event_type: eventType,
        details,
        ip_address: details.ip_address,
        user_agent: details.user_agent,
        created_at: new Date()
      });
    } catch (error) {
      logger.error('Error logging auth event:', error);
      // Don't throw - logging shouldn't break the flow
    }
  }

  async findValidSession(tokenHash) {
    try {
      return await knex('user_sessions')
        .where({
          refresh_token_hash: tokenHash,
          is_valid: true
        })
        .where('expires_at', '>', new Date())
        .first();
    } catch (error) {
      logger.error('Error finding valid session:', error);
      throw error;
    }
  }

  async findSessionById(sessionId) {
    try {
      return await knex('user_sessions')
        .where('session_id', sessionId)
        .first();
    } catch (error) {
      logger.error('Error finding session:', error);
      throw error;
    }
  }

  async updateSession(sessionId, data) {
    try {
      const actualSessionId = typeof sessionId === 'object' ? sessionId.session_id : sessionId;
      
      await knex('user_sessions')
        .where('session_id', actualSessionId)
        .update({
          ...data,
          updated_at: new Date()
        });

      return this.findSessionById(actualSessionId);
    } catch (error) {
      logger.error('Error updating session:', error);
      throw error;
    }
  }

  async invalidateAllUserSessions(userId) {
    try {
      await knex('user_sessions')
        .where({
          user_id: userId,
          is_valid: true
        })
        .update({
          is_valid: false,
          invalidated_at: new Date(),
          invalidation_reason: 'user_logout_all',
          updated_at: new Date()
        });

      await this.logAuthEvent(userId, 'all_sessions_invalidated');
    } catch (error) {
      logger.error('Error invalidating all sessions:', error);
      throw error;
    }
  }
}

module.exports = new AuthDataAccess(); 