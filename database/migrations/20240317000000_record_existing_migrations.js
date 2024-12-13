// This migration records all previously executed migrations
exports.up = async function(knex) {
  // First check if table exists
  const hasTable = await knex.schema.hasTable('knex_migrations');
  
  if (!hasTable) {
    await knex.schema.createTable('knex_migrations', table => {
      table.increments('id').primary();
      table.string('name');
      table.integer('batch');
      table.timestamp('migration_time');
    });
  }

  // Clear existing records to avoid duplicates
  await knex('knex_migrations').del();

  // List of migrations to record in chronological order
  const migrations = [
    // Initial schema
    '20241004181232_initial_schema.js',
    
    // Core migrations
    '20240315000000_create_assembly_outputs.js',
    '20240316000000_create_users_table.js',
    '20240316000001_add_user_indexes.js',
    '20240316000002_add_roles_and_permissions.js',
    '20240317000000_fix_llm_scenes_columns.js',
    '20240318000000_fix_llm_job_ids.js',
    '20240319000000_revert_llm_id_changes.js',
    '20240320000000_add_public_urls_and_media_ownership.js',
    '20240320000000_update_assembly_outputs.js',
    
    // October-November migrations
    '20241008000000_add_prompt_to_jobs_and_job_id_to_scenes.js',
    '20241120181232_add_visual_metadata_to_llm_scenes.js',
    '20241126171100_add_error_column_to_jobs.js',
    
    // December migrations
    '20241203000000_rename_voice_output_columns.js',
    '20241203000001_update_animation_outputs_columns.js',
    '20241205000000_update_video_outputs_columns.js',
    '20241206000000_update_music_outputs_columns.js',
    '20241206000001_add_auth_fields_to_users.js',
    '20241206000001_update_music_outputs_add_lyric_rename_tags.js',
    '20241207000000_update_llm_outputs_music_fields.js',
    '20241207000001_add_service_config_columns.js'
  ];

  // Insert all migrations
  return knex('knex_migrations').insert(
    migrations.map(name => ({
      name,
      batch: 1,
      migration_time: new Date()
    }))
  );
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('knex_migrations');
}; 