exports.up = function(knex) {
  return knex.schema.alterTable('plans', function(table) {
    // Operational limits
    table.integer('max_scenes_per_job').nullable();
    table.integer('max_jobs_per_month').nullable();
    table.string('video_quality', 10).nullable();
    table.integer('visual_selection_count').nullable();
    table.integer('voice_selection_count').nullable();
    table.integer('template_selection_count').nullable();
    
    // Feature flags
    table.boolean('has_watermark').notNullable().defaultTo(true);
    table.boolean('script_settings_enabled').notNullable().defaultTo(false);
    
    // Support level
    table.enu('support_level', ['community', 'email_24h', 'priority_12h']).notNullable().defaultTo('community');
    
    // Content type permissions - using a JSON array for flexibility
    table.jsonb('allowed_content_types').notNullable().defaultTo('["image", "text"]');
    
    // Keep description for marketing features and other non-operational data
    table.text('marketing_description').nullable();
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('plans', function(table) {
    table.dropColumn('max_scenes_per_job');
    table.dropColumn('max_jobs_per_month');
    table.dropColumn('video_quality');
    table.dropColumn('visual_selection_count');
    table.dropColumn('voice_selection_count');
    table.dropColumn('template_selection_count');
    table.dropColumn('has_watermark');
    table.dropColumn('script_settings_enabled');
    table.dropColumn('support_level');
    table.dropColumn('allowed_content_types');
    table.dropColumn('marketing_description');
  });
}; 