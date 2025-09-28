/**
 * Create subscription_feedback table for storing user cancellation feedback
 * 
 * This table stores user feedback when cancelling subscriptions, separate from
 * the system cancellation reasons stored in user_subscriptions.cancellation_reason
 */

exports.up = function(knex) {
  return knex.schema.createTable('subscription_feedback', function(table) {
    table.increments('id').primary();
    
    // References
    table.integer('subscription_id')
      .unsigned()
      .references('subscription_id')
      .inTable('user_subscriptions')
      .onDelete('CASCADE')
      .comment('Reference to the cancelled subscription');
    
    table.integer('user_id')
      .unsigned()
      .notNullable()
      .references('user_id')
      .inTable('users')
      .onDelete('CASCADE')
      .comment('Reference to the user who provided feedback');
    
    // Feedback data
    table.string('feedback_reason', 50)
      .nullable()
      .comment('Selected reason for cancellation (e.g., too_expensive, missing_features)');
    
    table.text('feedback_comments')
      .nullable()
      .comment('Free-form feedback comments from user (max 500 chars)');
    
    table.string('cancellation_type', 20)
      .notNullable()
      .defaultTo('user_initiated')
      .comment('Type of cancellation: user_initiated, system_initiated');
    
    // Timestamps
    table.timestamp('feedback_timestamp')
      .notNullable()
      .defaultTo(knex.fn.now())
      .comment('When the feedback was provided');
    
    table.timestamps(true, true); // created_at, updated_at with auto-update
    
    // Indexes for performance
    table.index('user_id', 'idx_subscription_feedback_user_id');
    table.index('feedback_reason', 'idx_subscription_feedback_reason');
    table.index('feedback_timestamp', 'idx_subscription_feedback_timestamp');
    table.index('cancellation_type', 'idx_subscription_feedback_type');
    
    // Composite index for analytics
    table.index(['feedback_reason', 'feedback_timestamp'], 'idx_feedback_reason_time');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('subscription_feedback');
};