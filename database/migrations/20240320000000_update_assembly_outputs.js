exports.up = function(knex) {
  return knex.schema.table('assembly_outputs', function(table) {
    // Rename existing column
    table.renameColumn('video_file_url', 'file_path');
  });
};

exports.down = function(knex) {
  return knex.schema.table('assembly_outputs', function(table) {
    table.renameColumn('file_path', 'video_file_url');
  });
}; 