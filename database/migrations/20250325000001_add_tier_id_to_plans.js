/**
 * Migration to add tier_id column to plans table
 * 
 * This column will help distinguish between plan types that share the same feature set
 * but differ in billing frequency or price.
 */
exports.up = function(knex) {
  return knex.schema.alterTable('plans', function(table) {
    // Add tier_id column to track which tier a plan belongs to
    table.integer('tier_id').unsigned().notNullable().defaultTo(1);
    // Add an index for faster lookups by tier
    table.index('tier_id', 'idx_plans_tier_id');
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('plans', function(table) {
    // Remove the index first
    table.dropIndex('idx_plans_tier_id');
    // Then remove the column
    table.dropColumn('tier_id');
  });
}; 