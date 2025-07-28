/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.table('users', function(table) {
    // Add the new column for the subscription plan ID
    table.integer('subscription_plan_id').unsigned().defaultTo(1).comment('Foreign key to the plans table, indicating the user\'s current active plan.');
    
    // Add the foreign key constraint
    table.foreign('subscription_plan_id').references('plan_id').inTable('plans');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.table('users', function(table) {
    // It's important to drop the foreign key constraint before dropping the column
    table.dropForeign('subscription_plan_id');
    table.dropColumn('subscription_plan_id');
  });
}; 