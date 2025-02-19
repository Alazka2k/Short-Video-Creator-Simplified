exports.up = function(knex) {
  return knex.schema.alterTable('jobs', function(table) {
    table.string('status', 50).alter(); // Increase to 50 characters
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('jobs', function(table) {
    table.string('status', 20).alter(); // Revert to original size
  });
}; 