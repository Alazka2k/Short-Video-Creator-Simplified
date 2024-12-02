exports.up = function(knex) {
  return knex.schema
    .alterTable('llm_outputs', table => {
      // Drop the new columns
      table.dropColumn('llm_id');
    })
    .alterTable('llm_scenes', table => {
      // Drop the new columns
      table.dropColumn('llm_id');
    });
};

exports.down = function(knex) {
  return knex.schema
    .alterTable('llm_outputs', table => {
      table.uuid('llm_id');
    })
    .alterTable('llm_scenes', table => {
      table.uuid('llm_id');
    });
}; 