exports.up = function(knex) {
  return knex.schema
    // First step: Add the new generalized columns
    .table('token_transactions', function(table) {
      // Add more general description and external service info
      table.string('description', 255).nullable();
      table.string('external_service_name', 100).nullable();
      
      // Add generalized entity relationship columns
      table.string('related_entity_type', 50).nullable();
      table.string('related_entity_id').nullable();
      
      // Add payment reference (only for allocations)
      table.integer('payment_id').unsigned().nullable();
    })
    // Second step: Copy data from specific columns to general columns
    .then(function() {
      return knex.raw(`
        UPDATE token_transactions
        SET related_entity_type = 
          CASE
            WHEN llm_id IS NOT NULL THEN 'llm'
            WHEN image_id IS NOT NULL THEN 'image'
            WHEN voice_id IS NOT NULL THEN 'voice'
            WHEN animation_id IS NOT NULL THEN 'animation'
            WHEN video_id IS NOT NULL THEN 'video'
            WHEN music_id IS NOT NULL THEN 'music'
            WHEN assembly_id IS NOT NULL THEN 'assembly'
            ELSE NULL
          END,
        related_entity_id = 
          CASE
            WHEN llm_id IS NOT NULL THEN llm_id::text
            WHEN image_id IS NOT NULL THEN image_id::text
            WHEN voice_id IS NOT NULL THEN voice_id::text
            WHEN animation_id IS NOT NULL THEN animation_id::text
            WHEN video_id IS NOT NULL THEN video_id::text
            WHEN music_id IS NOT NULL THEN music_id::text
            WHEN assembly_id IS NOT NULL THEN assembly_id::text
            ELSE NULL
          END
      `);
    })
    // Third step: Rename amount to token_amount for clarity (if not already done)
    .then(function() {
      // Check if the column is currently named 'amount'
      return knex.schema.hasColumn('token_transactions', 'amount')
        .then(function(exists) {
          if (exists) {
            return knex.schema.table('token_transactions', function(table) {
              table.renameColumn('amount', 'token_amount');
            });
          }
          return Promise.resolve();
        });
    });
};

exports.down = function(knex) {
  return knex.schema.table('token_transactions', function(table) {
    // Remove the added columns
    table.dropColumn('description');
    table.dropColumn('external_service_name');
    table.dropColumn('related_entity_type');
    table.dropColumn('related_entity_id');
    table.dropColumn('payment_id');
    
    // Revert renamed columns if the rename was performed
    knex.schema.hasColumn('token_transactions', 'token_amount')
      .then(function(exists) {
        if (exists) {
          return knex.schema.table('token_transactions', function(table) {
            table.renameColumn('token_amount', 'amount');
          });
        }
      });
  });
}; 