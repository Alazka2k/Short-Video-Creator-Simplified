exports.up = function(knex) {
  return knex.schema
    // First drop the existing constraint
    .raw('ALTER TABLE token_transactions DROP CONSTRAINT IF EXISTS valid_service_id')
    // Drop the token_cost column as it's redundant with amount
    .then(function() {
      return knex.schema.alterTable('token_transactions', function(table) {
        table.dropColumn('token_cost');
      });
    })
    // Add new constraint that enforces service-related fields only for deduction type
    .then(function() {
      return knex.raw(`
        ALTER TABLE token_transactions
        ADD CONSTRAINT valid_service_fields CHECK (
          CASE transaction_type
            WHEN 'deduction' THEN (
              service_type IS NOT NULL AND
              CASE service_type
                WHEN 'llm' THEN (llm_id IS NOT NULL AND image_id IS NULL AND voice_id IS NULL AND animation_id IS NULL AND video_id IS NULL AND music_id IS NULL AND assembly_id IS NULL)
                WHEN 'image' THEN (llm_id IS NULL AND image_id IS NOT NULL AND voice_id IS NULL AND animation_id IS NULL AND video_id IS NULL AND music_id IS NULL AND assembly_id IS NULL)
                WHEN 'voice' THEN (llm_id IS NULL AND image_id IS NULL AND voice_id IS NOT NULL AND animation_id IS NULL AND video_id IS NULL AND music_id IS NULL AND assembly_id IS NULL)
                WHEN 'animation' THEN (llm_id IS NULL AND image_id IS NULL AND voice_id IS NULL AND animation_id IS NOT NULL AND video_id IS NULL AND music_id IS NULL AND assembly_id IS NULL)
                WHEN 'video' THEN (llm_id IS NULL AND image_id IS NULL AND voice_id IS NULL AND animation_id IS NULL AND video_id IS NOT NULL AND music_id IS NULL AND assembly_id IS NULL)
                WHEN 'music' THEN (llm_id IS NULL AND image_id IS NULL AND voice_id IS NULL AND animation_id IS NULL AND video_id IS NULL AND music_id IS NOT NULL AND assembly_id IS NULL)
                WHEN 'assembly' THEN (llm_id IS NULL AND image_id IS NULL AND voice_id IS NULL AND animation_id IS NULL AND video_id IS NULL AND music_id IS NULL AND assembly_id IS NOT NULL)
              END
            )
            WHEN 'allocation' THEN (
              service_type IS NULL AND
              llm_id IS NULL AND image_id IS NULL AND voice_id IS NULL AND 
              animation_id IS NULL AND video_id IS NULL AND music_id IS NULL AND 
              assembly_id IS NULL
            )
            WHEN 'purchase' THEN (
              service_type IS NULL AND
              llm_id IS NULL AND image_id IS NULL AND voice_id IS NULL AND 
              animation_id IS NULL AND video_id IS NULL AND music_id IS NULL AND 
              assembly_id IS NULL
            )
          END
        )
      `);
    })
    // Make service-related columns nullable again
    .then(function() {
      return knex.schema.alterTable('token_transactions', function(table) {
        table.enu('service_type', null, {
          useNative: true,
          enumName: 'service_type',
          existingType: true
        }).nullable().alter();
      });
    });
};

exports.down = function(knex) {
  return knex.schema
    .raw('ALTER TABLE token_transactions DROP CONSTRAINT IF EXISTS valid_service_fields')
    // Add back token_cost column
    .then(function() {
      return knex.schema.alterTable('token_transactions', function(table) {
        table.integer('token_cost');
      });
    })
    // Add back the original constraint
    .then(function() {
      return knex.raw(`
        ALTER TABLE token_transactions
        ADD CONSTRAINT valid_service_id CHECK (
          CASE service_type
            WHEN 'llm' THEN (llm_id IS NOT NULL AND image_id IS NULL AND voice_id IS NULL AND animation_id IS NULL AND video_id IS NULL AND music_id IS NULL AND assembly_id IS NULL)
            WHEN 'image' THEN (llm_id IS NULL AND image_id IS NOT NULL AND voice_id IS NULL AND animation_id IS NULL AND video_id IS NULL AND music_id IS NULL AND assembly_id IS NULL)
            WHEN 'voice' THEN (llm_id IS NULL AND image_id IS NULL AND voice_id IS NOT NULL AND animation_id IS NULL AND video_id IS NULL AND music_id IS NULL AND assembly_id IS NULL)
            WHEN 'animation' THEN (llm_id IS NULL AND image_id IS NULL AND voice_id IS NULL AND animation_id IS NOT NULL AND video_id IS NULL AND music_id IS NULL AND assembly_id IS NULL)
            WHEN 'video' THEN (llm_id IS NULL AND image_id IS NULL AND voice_id IS NULL AND animation_id IS NULL AND video_id IS NOT NULL AND music_id IS NULL AND assembly_id IS NULL)
            WHEN 'music' THEN (llm_id IS NULL AND image_id IS NULL AND voice_id IS NULL AND animation_id IS NULL AND video_id IS NULL AND music_id IS NOT NULL AND assembly_id IS NULL)
            WHEN 'assembly' THEN (llm_id IS NULL AND image_id IS NULL AND voice_id IS NULL AND animation_id IS NULL AND video_id IS NULL AND music_id IS NULL AND assembly_id IS NOT NULL)
          END
        )
      `);
    });
}; 