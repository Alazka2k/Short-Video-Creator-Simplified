exports.up = async function(knex) {
  const hasFullName = await knex.schema.hasColumn('users', 'full_name');

  return knex.schema.alterTable('users', table => {
    // Drop the not-null constraint on first_name and last_name
    table.string('first_name').nullable().alter();
    table.string('last_name').nullable().alter();
    
    // Add full_name if it doesn't exist
    if (!hasFullName) {
      table.string('full_name');
    }
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('users', table => {
    // Restore the not-null constraints
    table.string('first_name').notNullable().alter();
    table.string('last_name').notNullable().alter();
    
    // Drop full_name column
    table.dropColumn('full_name');
  });
}; 