// migrations/YYYYMMDDHHMMSS_add_error_column_to_jobs.js

exports.up = function(knex) {
    return knex.schema.alterTable('jobs', function(table) {
      table.text('error').nullable();
    });
  };
  
  exports.down = function(knex) {
    return knex.schema.alterTable('jobs', function(table) {
      table.dropColumn('error');
    });
  };