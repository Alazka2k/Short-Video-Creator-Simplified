exports.up = function(knex) {
  return knex.schema
    .raw(`CREATE TYPE service_type AS ENUM (
      'llm',
      'image',
      'voice',
      'animation',
      'video',
      'music',
      'assembly'
    )`)
    .then(function () {
      return knex.schema.alterTable('token_transactions', function(table) {
        // First add all columns as nullable
        table.enu('service_type', null, {
          useNative: true,
          enumName: 'service_type',
          existingType: true
        });
        table.integer('scene_id');
        table.uuid('llm_id');
        table.uuid('image_id');
        table.uuid('voice_id');
        table.uuid('animation_id');
        table.uuid('video_id');
        table.uuid('music_id');
        table.uuid('assembly_id');
        table.jsonb('metadata').defaultTo('{}');
        table.integer('token_cost');
        
        // Add indexes
        table.index('job_id', 'idx_token_transactions_job_id');
        table.index('user_id', 'idx_token_transactions_user_id');
        table.index('service_type', 'idx_token_transactions_service_type');
        table.index('transaction_date', 'idx_token_transactions_transaction_date');
      });
    })
    // Update existing rows with default values including a UUID for llm_id
    .then(function () {
      return knex.raw(`
        UPDATE token_transactions 
        SET service_type = 'llm',
            token_cost = 5,
            llm_id = gen_random_uuid()
        WHERE service_type IS NULL
      `);
    })
    // Now make the columns NOT NULL
    .then(function () {
      return knex.schema.alterTable('token_transactions', function(table) {
        table.integer('token_cost').notNullable().alter();
        table.enu('service_type', null, {
          useNative: true,
          enumName: 'service_type',
          existingType: true
        }).notNullable().alter();
      });
    })
    .then(function () {
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

exports.down = function(knex) {
  return knex.schema
    .alterTable('token_transactions', function(table) {
      table.dropConstraint('valid_service_id');
      table.dropIndex('idx_token_transactions_job_id');
      table.dropIndex('idx_token_transactions_user_id');
      table.dropIndex('idx_token_transactions_service_type');
      table.dropIndex('idx_token_transactions_transaction_date');
      table.dropColumn('service_type');
      table.dropColumn('scene_id');
      table.dropColumn('llm_id');
      table.dropColumn('image_id');
      table.dropColumn('voice_id');
      table.dropColumn('animation_id');
      table.dropColumn('video_id');
      table.dropColumn('music_id');
      table.dropColumn('assembly_id');
      table.dropColumn('metadata');
      table.dropColumn('token_cost');
    })
    .then(function () {
      return knex.raw('DROP TYPE service_type');
    });
}; 