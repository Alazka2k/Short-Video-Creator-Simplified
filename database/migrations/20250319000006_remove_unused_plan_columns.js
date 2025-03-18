exports.up = function(knex) {
  return knex.schema.alterTable('plans', function(table) {
    // Remove unused columns
    table.dropColumn('features');
    table.dropColumn('restrictions');
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('plans', function(table) {
    // Add back the columns if we need to rollback
    table.jsonb('features').nullable();
    table.jsonb('restrictions').nullable();
  });
}; 