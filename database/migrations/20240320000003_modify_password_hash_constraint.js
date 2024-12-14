exports.up = function(knex) {
  return knex.schema.alterTable('users', table => {
    // Make password_hash nullable for social login users
    table.string('password_hash').nullable().alter();
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('users', table => {
    // Restore not-null constraint
    table.string('password_hash').notNullable().alter();
  });
}; 