exports.up = function(knex) {
  return knex.schema.alterTable('plans', function(table) {
    // Add plan_type column as an enum
    table.enu('plan_type', ['subscription', 'token_package']).notNullable().defaultTo('subscription');
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('plans', function(table) {
    // Remove the plan_type column
    table.dropColumn('plan_type');
  });
}; 