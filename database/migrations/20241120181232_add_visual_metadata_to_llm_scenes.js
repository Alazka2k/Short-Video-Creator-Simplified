// database/migrations/YYYYMMDDHHMMSS_add_visual_metadata_to_llm_scenes.js

exports.up = function (knex) {
    return knex.schema.alterTable('llm_scenes', function (table) {
      table.jsonb('visual_metadata').nullable();
      table.index('visual_metadata', 'idx_llm_scenes_visual_metadata', 'gin');
    });
  };
  
  exports.down = function (knex) {
    return knex.schema.alterTable('llm_scenes', function (table) {
      table.dropColumn('visual_metadata');
    });
  };