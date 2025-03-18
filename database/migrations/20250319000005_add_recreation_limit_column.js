exports.up = function(knex) {
  return knex.schema.alterTable('plans', function(table) {
    // Add recreation feature flag
    table.boolean('recreation_enabled').notNullable().defaultTo(false);
    
    // Add recreation content types as JSON array
    table.jsonb('recreation_content_types').nullable();
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('plans', function(table) {
    table.dropColumn('recreation_enabled');
    table.dropColumn('recreation_content_types');
  });
}; 