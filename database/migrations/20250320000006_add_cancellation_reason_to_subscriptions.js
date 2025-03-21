/**
 * Migration to add the cancellation_reason column to the user_subscriptions table
 * This allows tracking of why subscriptions were cancelled
 */
exports.up = function(knex) {
  return knex.schema.alterTable('user_subscriptions', function(table) {
    // Add cancellation_reason column with text type
    table.text('cancellation_reason').nullable();
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('user_subscriptions', function(table) {
    // Remove the cancellation_reason column if rolling back
    table.dropColumn('cancellation_reason');
  });
}; 