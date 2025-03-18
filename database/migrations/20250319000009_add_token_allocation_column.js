exports.up = function(knex) {
  return knex.schema.alterTable('plans', function(table) {
    // Add token_allocation column for one-time token packages
    table.integer('token_allocation').nullable();
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('plans', function(table) {
    // Remove the token_allocation column
    table.dropColumn('token_allocation');
  });
};