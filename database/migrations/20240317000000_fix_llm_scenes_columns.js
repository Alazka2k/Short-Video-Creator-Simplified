exports.up = function(knex) {
  return knex.schema.alterTable('llm_scenes', table => {
    // First rename scene_id to llm_scene_id (to avoid conflicts)
    table.renameColumn('scene_id', 'llm_scene_id');
    // Then rename scene_number to scene_id
    table.renameColumn('scene_number', 'scene_id');
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('llm_scenes', table => {
    // Reverse the changes
    table.renameColumn('scene_id', 'scene_number');
    table.renameColumn('llm_scene_id', 'scene_id');
  });
}; 