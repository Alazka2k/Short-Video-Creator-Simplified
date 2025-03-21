/**
 * Migration to fix the status check constraint in the user_subscriptions table
 * to allow 'cancelled' (with two 'l's) instead of 'canceled' (with one 'l')
 */
exports.up = function(knex) {
  return knex.schema
    // First, drop the existing constraint
    .raw('ALTER TABLE user_subscriptions DROP CONSTRAINT IF EXISTS user_subscriptions_status_check')
    // Then create a new constraint with only the statuses we need
    .raw(`ALTER TABLE user_subscriptions ADD CONSTRAINT user_subscriptions_status_check 
          CHECK (status IN ('active', 'cancelled'))`);
};

exports.down = function(knex) {
  return knex.schema
    // Revert to the original constraint (only allowed 'active', 'canceled')
    .raw('ALTER TABLE user_subscriptions DROP CONSTRAINT IF EXISTS user_subscriptions_status_check')
    .raw(`ALTER TABLE user_subscriptions ADD CONSTRAINT user_subscriptions_status_check 
          CHECK (status IN ('active', 'canceled'))`);
}; 