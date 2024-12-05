exports.up = function(knex) {
  return knex.schema.alterTable('animation_outputs', table => {
    // Rename animation_output_url to file_path
    table.renameColumn('animation_file_url', 'file_path');
    
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('animation_outputs', table => {
    
    // Revert the column rename
    table.renameColumn('file_path', 'animation_file_url');
  });
}; 