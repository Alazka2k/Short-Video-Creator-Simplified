exports.up = async function(knex) {
  const hasColumn = await knex.schema
    .hasColumn('users', 'full_name');
    
  if (!hasColumn) {
    return knex.schema.alterTable('users', table => {
      table.string('full_name');
    });
  }
};

exports.down = function(knex) {
  return knex.schema.alterTable('users', table => {
    table.dropColumn('full_name');
  });
}; 