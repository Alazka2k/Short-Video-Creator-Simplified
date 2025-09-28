/**
 * Subscription Feedback Data Access Layer
 * 
 * Handles all database operations for the subscription_feedback table.
 * This stores user feedback when cancelling subscriptions, separate from
 * system cancellation reasons.
 */

const knex = require('knex')(require('../../../../knexfile')[process.env.NODE_ENV]);
const logger = require('../../../shared/utils/logger');

class SubscriptionFeedbackDataAccess {
  constructor() {
    this.tableName = 'subscription_feedback';
    this.logger = logger;
  }

  /**
   * Create a new subscription feedback record
   * @param {Object} feedbackData - The feedback data
   * @param {number} feedbackData.subscription_id - ID of the cancelled subscription
   * @param {number} feedbackData.user_id - ID of the user providing feedback
   * @param {string} feedbackData.feedback_reason - Selected reason (optional)
   * @param {string} feedbackData.feedback_comments - Free-form comments (optional)
   * @param {string} feedbackData.cancellation_type - Type of cancellation (default: 'user_initiated')
   * @param {Object} trx - Optional Knex transaction object
   * @returns {Promise<Object>} - The created feedback record
   */
  async createFeedback(feedbackData, trx) {
    try {
      this.logger.info('Creating subscription feedback:', {
        subscription_id: feedbackData.subscription_id,
        user_id: feedbackData.user_id,
        has_reason: !!feedbackData.feedback_reason,
        has_comments: !!feedbackData.feedback_comments
      });

      // Use transaction if provided, otherwise use knex directly
      const query = trx || knex;

      // Prepare the feedback data
      const feedbackRecord = {
        subscription_id: feedbackData.subscription_id,
        user_id: feedbackData.user_id,
        feedback_reason: feedbackData.feedback_reason || null,
        feedback_comments: feedbackData.feedback_comments || null,
        cancellation_type: feedbackData.cancellation_type || 'user_initiated',
        feedback_timestamp: new Date()
      };

      // Insert and return the created record
      const [createdFeedback] = await query(this.tableName)
        .insert(feedbackRecord)
        .returning('*');

      this.logger.info('Successfully created subscription feedback:', {
        feedback_id: createdFeedback.id,
        subscription_id: createdFeedback.subscription_id
      });

      return createdFeedback;
    } catch (error) {
      this.logger.error('Error creating subscription feedback:', {
        error: error.message,
        feedbackData
      });
      throw error;
    }
  }

  /**
   * Get feedback by subscription ID
   * @param {number} subscriptionId - The subscription ID
   * @returns {Promise<Array>} - Array of feedback records
   */
  async getFeedbackBySubscriptionId(subscriptionId) {
    try {
      this.logger.info('Getting feedback for subscription:', { subscriptionId });

      const feedback = await knex(this.tableName)
        .where('subscription_id', subscriptionId)
        .orderBy('feedback_timestamp', 'desc');

      this.logger.info('Retrieved feedback records:', {
        subscriptionId,
        count: feedback.length
      });

      return feedback;
    } catch (error) {
      this.logger.error('Error getting feedback by subscription ID:', {
        error: error.message,
        subscriptionId
      });
      throw error;
    }
  }

  /**
   * Get feedback by user ID
   * @param {number} userId - The user ID
   * @param {Object} options - Query options
   * @param {number} options.limit - Limit number of results
   * @param {number} options.offset - Offset for pagination
   * @returns {Promise<Array>} - Array of feedback records
   */
  async getFeedbackByUserId(userId, options = {}) {
    try {
      this.logger.info('Getting feedback for user:', { userId, options });

      let query = knex(this.tableName)
        .where('user_id', userId)
        .orderBy('feedback_timestamp', 'desc');

      if (options.limit) {
        query = query.limit(options.limit);
      }

      if (options.offset) {
        query = query.offset(options.offset);
      }

      const feedback = await query;

      this.logger.info('Retrieved user feedback records:', {
        userId,
        count: feedback.length
      });

      return feedback;
    } catch (error) {
      this.logger.error('Error getting feedback by user ID:', {
        error: error.message,
        userId,
        options
      });
      throw error;
    }
  }

  /**
   * Get feedback analytics by reason
   * @param {Object} options - Query options
   * @param {Date} options.startDate - Start date for filtering
   * @param {Date} options.endDate - End date for filtering
   * @returns {Promise<Array>} - Array of reason counts
   */
  async getFeedbackAnalytics(options = {}) {
    try {
      this.logger.info('Getting feedback analytics:', options);

      let query = knex(this.tableName)
        .select('feedback_reason')
        .count('* as count')
        .whereNotNull('feedback_reason')
        .groupBy('feedback_reason')
        .orderBy('count', 'desc');

      if (options.startDate) {
        query = query.where('feedback_timestamp', '>=', options.startDate);
      }

      if (options.endDate) {
        query = query.where('feedback_timestamp', '<=', options.endDate);
      }

      const analytics = await query;

      this.logger.info('Retrieved feedback analytics:', {
        reasonCount: analytics.length
      });

      return analytics;
    } catch (error) {
      this.logger.error('Error getting feedback analytics:', {
        error: error.message,
        options
      });
      throw error;
    }
  }

  /**
   * Get recent feedback with comments for review
   * @param {number} limit - Number of records to retrieve
   * @returns {Promise<Array>} - Array of feedback records with comments
   */
  async getRecentFeedbackWithComments(limit = 50) {
    try {
      this.logger.info('Getting recent feedback with comments:', { limit });

      const feedback = await knex(this.tableName)
        .select([
          'subscription_feedback.*',
          'users.email',
          'plans.plan_name'
        ])
        .leftJoin('users', 'subscription_feedback.user_id', 'users.user_id')
        .leftJoin('user_subscriptions', 'subscription_feedback.subscription_id', 'user_subscriptions.subscription_id')
        .leftJoin('plans', 'user_subscriptions.plan_id', 'plans.plan_id')
        .whereNotNull('feedback_comments')
        .where('feedback_comments', '!=', '')
        .orderBy('feedback_timestamp', 'desc')
        .limit(limit);

      this.logger.info('Retrieved recent feedback with comments:', {
        count: feedback.length
      });

      return feedback;
    } catch (error) {
      this.logger.error('Error getting recent feedback with comments:', {
        error: error.message,
        limit
      });
      throw error;
    }
  }
}

module.exports = SubscriptionFeedbackDataAccess;