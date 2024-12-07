exports.up = function(knex) {
  return knex.schema.alterTable('music_outputs', function(table) {
    table.renameColumn('music_file_url', 'file_path');
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('music_outputs', function(table) {
    table.renameColumn('file_path', 'music_file_url');
  });
}; 