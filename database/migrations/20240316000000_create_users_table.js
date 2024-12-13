exports.up = function(knex) {
  return knex.schema.hasTable('users').then(exists => {
    if (!exists) {
      return knex.schema.createTable('users', table => {
        table.increments('id').primary();
        table.string('auth0_id').notNullable().unique();
        table.string('email').notNullable();
        table.string('full_name');
        table.string('picture');
        table.string('provider');
        table.timestamp('last_login');
        table.timestamps(true, true);
      });
    }
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('users');
};