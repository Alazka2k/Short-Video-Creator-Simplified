/**
 * Migration to enhance subscription cancellation handling
 * 
 * This migration:
 * 1. Adds an upcoming_plan_id column to track the plan to switch to after cancellation
 * 2. Modifies the status CHECK constraint to include "pending_cancellation" status
 * 3. Adds a cancellation_type column to track the type of cancellation
 */
exports.up = function(knex) {
  return knex.schema
    // First, add upcoming_plan_id column
    .alterTable('user_subscriptions', function(table) {
      table.integer('upcoming_plan_id').unsigned().nullable().references('plan_id').inTable('plans');
      table.enum('cancellation_type', [
        'CANCEL_PAID_PLAN',
        'CANCEL_FOR_UPGRADE',
        'CANCEL_FOR_DOWNGRADE'
      ]).nullable();
    })
    // Then modify the status CHECK constraint
    .raw('ALTER TABLE user_subscriptions DROP CONSTRAINT IF EXISTS user_subscriptions_status_check')
    .raw(`ALTER TABLE user_subscriptions ADD CONSTRAINT user_subscriptions_status_check 
          CHECK (status IN ('active', 'cancelled', 'pending_cancellation'))`);
};

exports.down = function(knex) {
  return knex.schema
    // Revert the status CHECK constraint to the original values
    .raw('ALTER TABLE user_subscriptions DROP CONSTRAINT IF EXISTS user_subscriptions_status_check')
    .raw(`ALTER TABLE user_subscriptions ADD CONSTRAINT user_subscriptions_status_check 
          CHECK (status IN ('active', 'cancelled'))`)
    // Remove the added columns
    .alterTable('user_subscriptions', function(table) {
      table.dropColumn('cancellation_type');
      table.dropColumn('upcoming_plan_id');
    });
}; 