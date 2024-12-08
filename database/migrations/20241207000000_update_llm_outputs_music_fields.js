exports.up = function(knex) {
  return knex.schema.alterTable('llm_outputs', function(table) {
    // First rename music_tags to music_style
    table.renameColumn('music_tags', 'music_style');
    
    // Add new columns
    table.text('music_prompt');
    table.boolean('music_instrumental').defaultTo(false);
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('llm_outputs', function(table) {
    table.renameColumn('music_style', 'music_tags');
    table.dropColumn('music_prompt');
    table.dropColumn('music_instrumental');
  });
}; 