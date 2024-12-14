exports.up = function(knex) {
  return knex.schema
    // Simplify users table
    .alterTable('users', table => {
      // Remove unnecessary columns
      table.dropColumn('first_name');
      table.dropColumn('last_name');
      table.dropColumn('password_hash'); // We use Auth0
      
      // Add essential columns
      table.timestamp('last_token_refresh');
      table.timestamp('last_logout');
    })

    // Add session management
    .createTable('user_sessions', table => {
      table.increments('session_id').primary();
      table.integer('user_id').references('users.user_id').onDelete('CASCADE');
      table.string('refresh_token_hash');
      table.boolean('is_valid').defaultTo(true);
      table.timestamp('expires_at').notNullable();
      table.timestamp('invalidated_at');
      table.string('invalidation_reason');
      table.timestamps(true, true);
    })

    // Add auth logs
    .createTable('auth_logs', table => {
      table.increments('log_id').primary();
      table.integer('user_id').references('users.user_id').onDelete('CASCADE');
      table.string('event_type').notNullable();
      table.jsonb('details');
      table.string('ip_address');
      table.string('user_agent');
      table.timestamps(true, true);
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTable('auth_logs')
    .dropTable('user_sessions')
    .alterTable('users', table => {
      table.string('first_name');
      table.string('last_name');
      table.string('password_hash');
      
      table.dropColumn('last_token_refresh');
      table.dropColumn('last_logout');
    });
}; 