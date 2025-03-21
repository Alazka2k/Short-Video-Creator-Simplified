exports.up = function(knex) {
  return knex.schema.table('token_transactions', function(table) {
    // Add created_at column if it doesn't exist
    table.timestamps(true, true); // This adds both created_at and updated_at with defaults
  });
};

exports.down = function(knex) {
  return knex.schema.table('token_transactions', function(table) {
    // Remove the added columns
    table.dropColumn('created_at');
    table.dropColumn('updated_at');
  });
}; 