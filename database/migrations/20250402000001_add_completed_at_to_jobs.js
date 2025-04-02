exports.up = function(knex) {
  return knex.schema.alterTable('jobs', function(table) {
    table.timestamp('completed_at').nullable();
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('jobs', function(table) {
    table.dropColumn('completed_at');
  });
}; 