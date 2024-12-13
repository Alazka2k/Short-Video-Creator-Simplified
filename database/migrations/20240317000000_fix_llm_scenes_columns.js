exports.up = async function(knex) {
  const hasLlmSceneId = await knex.schema.hasColumn('llm_scenes', 'llm_scene_id');
  const hasSceneId = await knex.schema.hasColumn('llm_scenes', 'scene_id');

  if (!hasLlmSceneId && hasSceneId) {
    return knex.schema.alterTable('llm_scenes', table => {
      table.renameColumn('scene_id', 'llm_scene_id');
    });
  }
};

exports.down = async function(knex) {
  const hasLlmSceneId = await knex.schema.hasColumn('llm_scenes', 'llm_scene_id');
  
  if (hasLlmSceneId) {
    return knex.schema.alterTable('llm_scenes', table => {
      table.renameColumn('llm_scene_id', 'scene_id');
    });
  }
}; 