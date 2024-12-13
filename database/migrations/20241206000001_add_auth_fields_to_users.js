exports.up = async function(knex) {
  // Get existing columns
  const columns = await knex.table('users').columnInfo();
  const alterations = [];

  // Only add columns that don't exist
  if (!columns.auth0_id) {
    alterations.push(
      knex.schema.alterTable('users', table => {
        table.string('auth0_id').unique();
      })
    );
  }

  if (!columns.provider) {
    alterations.push(
      knex.schema.alterTable('users', table => {
        table.string('provider');
      })
    );
  }

  if (!columns.picture) {
    alterations.push(
      knex.schema.alterTable('users', table => {
        table.string('picture');
      })
    );
  }

  if (!columns.last_login) {
    alterations.push(
      knex.schema.alterTable('users', table => {
        table.timestamp('last_login');
      })
    );
  }

  // Execute all alterations in parallel
  return Promise.all(alterations);
};

exports.down = function(knex) {
  return knex.schema.alterTable('users', table => {
    table.dropColumn('auth0_id');
    table.dropColumn('provider');
    table.dropColumn('picture');
    table.dropColumn('last_login');
  });
}; 