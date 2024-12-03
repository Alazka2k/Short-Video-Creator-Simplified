exports.up = function(knex) {
  return knex.schema.alterTable('voice_outputs', table => {
    // Rename voice_file_url to file_path
    table.renameColumn('voice_file_url', 'file_path');
    // Rename voice_service_id to voice_id
    table.renameColumn('voice_service_id', 'elevenlabs_voice_id');
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('voice_outputs', table => {
    // Revert the changes
    table.renameColumn('file_path', 'voice_file_url');
    table.renameColumn('elevenlabs_voice_id', 'voice_service_id');
  });
}; 