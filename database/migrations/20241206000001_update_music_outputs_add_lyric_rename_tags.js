exports.up = function(knex) {
  return knex.schema.alterTable('music_outputs', function(table) {
    // Add lyric column
    table.text('lyric');
    // Rename tags column to style
    table.renameColumn('tags', 'style');
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('music_outputs', function(table) {
    // Remove lyric column
    table.dropColumn('lyric');
    // Revert style column back to tags
    table.renameColumn('style', 'tags');
  });
}; 