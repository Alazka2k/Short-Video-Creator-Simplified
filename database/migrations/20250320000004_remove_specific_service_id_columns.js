exports.up = function(knex) {
  return knex.schema.table('token_transactions', function(table) {
    // Remove specific service ID columns now that we have the generalized approach
    table.dropColumn('job_id');
    table.dropColumn('service_type');
    table.dropColumn('llm_id');
    table.dropColumn('image_id');
    table.dropColumn('voice_id');
    table.dropColumn('animation_id');
    table.dropColumn('video_id');
    table.dropColumn('music_id');
    table.dropColumn('assembly_id');
    table.dropColumn('scene_id');
  });
};

exports.down = function(knex) {
  return knex.schema
    // First recreate the service_type enum type if it doesn't exist
    .raw(`DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'service_type') THEN
          CREATE TYPE service_type AS ENUM (
            'llm',
            'image',
            'voice',
            'animation',
            'video',
            'music',
            'assembly'
          );
        END IF;
      END $$;
    `)
    // Then add back all the columns we removed
    .table('token_transactions', function(table) {
      table.uuid('job_id');
      table.enu('service_type', null, {
        useNative: true,
        enumName: 'service_type',
        existingType: true
      });
      table.uuid('llm_id');
      table.uuid('image_id');
      table.uuid('voice_id');
      table.uuid('animation_id');
      table.uuid('video_id');
      table.uuid('music_id');
      table.uuid('assembly_id');
      table.integer('scene_id');

      // Create indexes on frequently queried columns
      table.index('job_id', 'idx_token_transactions_job_id');
      table.index('service_type', 'idx_token_transactions_service_type');
    })
    // Populate the service-specific columns from the generalized ones
    .then(function() {
      return knex.raw(`
        UPDATE token_transactions
        SET service_type = related_entity_type::service_type,
            llm_id = CASE WHEN related_entity_type = 'llm' THEN related_entity_id::uuid ELSE NULL END,
            image_id = CASE WHEN related_entity_type = 'image' THEN related_entity_id::uuid ELSE NULL END,
            voice_id = CASE WHEN related_entity_type = 'voice' THEN related_entity_id::uuid ELSE NULL END,
            animation_id = CASE WHEN related_entity_type = 'animation' THEN related_entity_id::uuid ELSE NULL END,
            video_id = CASE WHEN related_entity_type = 'video' THEN related_entity_id::uuid ELSE NULL END,
            music_id = CASE WHEN related_entity_type = 'music' THEN related_entity_id::uuid ELSE NULL END,
            assembly_id = CASE WHEN related_entity_type = 'assembly' THEN related_entity_id::uuid ELSE NULL END
      `);
    });
}; 