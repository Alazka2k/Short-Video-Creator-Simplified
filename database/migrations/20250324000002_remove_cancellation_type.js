/**
 * Migration to remove the redundant cancellation_type column
 * 
 * This migration:
 * 1. Removes the cancellation_type column since we already have cancellation_reason
 * 2. We'll use standardized values in cancellation_reason instead
 */
exports.up = function(knex) {
  return knex.schema
    .alterTable('user_subscriptions', function(table) {
      // Drop the redundant column
      table.dropColumn('cancellation_type');
    });
};

exports.down = function(knex) {
  return knex.schema
    .alterTable('user_subscriptions', function(table) {
      // Add back the column if we need to rollback
      table.enum('cancellation_type', [
        'CANCEL_PAID_PLAN',
        'CANCEL_FOR_UPGRADE',
        'CANCEL_FOR_DOWNGRADE'
      ]).nullable();
    });
}; 