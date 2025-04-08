/**
 * Migration to add retry_count column to payments table
 * 
 * This migration adds a retry_count column to the payments table to track
 * how many times a failed payment has been retried.
 */

exports.up = function(knex) {
  return knex.schema.table('payments', function(table) {
    // Add retry_count column with default value of 0
    table.integer('retry_count').defaultTo(0).comment('Number of times this payment has been retried');
  });
};

exports.down = function(knex) {
  return knex.schema.table('payments', function(table) {
    // Remove the retry_count column
    table.dropColumn('retry_count');
  });
}; 