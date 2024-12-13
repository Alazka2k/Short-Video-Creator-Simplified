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
      await knex('users').insert({
        auth0_id: userData.auth0Id,
        email: userData.email,
        full_name: userData.name,
        picture: userData.picture,
        provider: userData.provider,
        last_login: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      });

      return this.findUserByAuth0Id(userData.auth0Id);
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
        .leftJoin('user_roles', 'users.id', 'user_roles.user_id')
        .leftJoin('roles', 'user_roles.role_id', 'roles.role_id')
        .leftJoin('user_subscriptions', 'users.id', 'user_subscriptions.user_id')
        .select(
          'users.*',
          'roles.role_name as role_name',
          'roles.description as role_description',
          'user_subscriptions.plan_id',
          'user_subscriptions.status',
          'user_subscriptions.current_period_end'
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
        .leftJoin('user_roles', 'users.id', 'user_roles.user_id')
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
      .where('user_id', user.id)
      .where('created_at', '>=', monthStart)
      .count('id as count')
      .first();
      
    if (videoCount.count >= plan.monthly_video_limit) {
      throw new Error('Monthly video quota exceeded');
    }
    
    // Track usage
    await knex('usage_logs').insert({
      user_id: user.id,
      action: 'video_creation',
      subscription_plan_id: plan.id,
      created_at: new Date()
    });
  }

  async getUserUsage(auth0Id) {
    const user = await this.findUserByAuth0Id(auth0Id);
    return await knex('jobs')
      .where('user_id', user.id)
      .select(
        knex.raw('DATE_TRUNC(\'month\', created_at) as month'),
        knex.raw('COUNT(*) as video_count'),
        knex.raw('SUM(duration) as total_duration')
      )
      .groupBy(knex.raw('DATE_TRUNC(\'month\', created_at)'))
      .orderBy('month', 'desc')
      .limit(12);
  }
}

module.exports = new AuthDataAccess(); 