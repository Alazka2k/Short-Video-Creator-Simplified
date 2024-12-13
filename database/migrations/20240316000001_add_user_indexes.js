exports.up = function(knex) {
  return knex.schema.table('users', table => {
    // Add indexes if they don't exist
    table.index(['auth0_id'], 'users_auth0_id_index');
    table.index(['email'], 'users_email_index');
  });
};

exports.down = function(knex) {
  return knex.schema.table('users', table => {
    // Remove indexes
    table.dropIndex('', 'users_auth0_id_index');
    table.dropIndex('', 'users_email_index');
  });
}; 