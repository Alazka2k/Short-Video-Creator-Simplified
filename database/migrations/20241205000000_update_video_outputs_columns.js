exports.up = function(knex) {
  return knex.schema.alterTable('video_outputs', function(table) {
    table.renameColumn('video_file_url', 'file_path');
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('video_outputs', function(table) {
    table.renameColumn('file_path', 'video_file_url');
  });
}; 