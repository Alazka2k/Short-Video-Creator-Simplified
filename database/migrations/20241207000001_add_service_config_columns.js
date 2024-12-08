exports.up = function(knex) {
  return knex.schema.alterTable('jobs', function(table) {
    // Service configuration columns
    table.boolean('skip_voice').defaultTo(false);
    table.boolean('skip_music').defaultTo(false);
    table.boolean('skip_image').defaultTo(false);
    table.boolean('skip_visualization').defaultTo(false);
    // Visualization type as enum
    table.enu('visualization_type', ['video', 'animation', null]).nullable();
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('jobs', function(table) {
    table.dropColumn('skip_voice');
    table.dropColumn('skip_music');
    table.dropColumn('skip_image');
    table.dropColumn('skip_visualization');
    table.dropColumn('visualization_type');
  });
}; 