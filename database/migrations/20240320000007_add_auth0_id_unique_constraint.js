exports.up = async function(knex) {
  // Check if constraint exists
  const hasConstraint = await knex.schema
    .raw(`SELECT constraint_name 
          FROM information_schema.table_constraints 
          WHERE table_name = 'users' 
          AND constraint_name = 'users_auth0_id_unique'`);

  if (hasConstraint.rows.length === 0) {
    return knex.schema.alterTable('users', table => {
      // Drop existing index if exists
      table.dropIndex(['auth0_id']);
      // Add unique constraint
      table.unique(['auth0_id']);
    });
  }
};

exports.down = async function(knex) {
  // Check if constraint exists before trying to drop it
  const hasConstraint = await knex.schema
    .raw(`SELECT constraint_name 
          FROM information_schema.table_constraints 
          WHERE table_name = 'users' 
          AND constraint_name = 'users_auth0_id_unique'`);

  if (hasConstraint.rows.length > 0) {
    return knex.schema.alterTable('users', table => {
      table.dropUnique(['auth0_id']);
      // Recreate normal index
      table.index(['auth0_id']);
    });
  }
}; 