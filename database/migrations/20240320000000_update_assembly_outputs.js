exports.up = async function(knex) {
  // Check if the old column exists
  const hasVideoFileUrl = await knex.schema
    .raw(`SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'assembly_outputs' 
          AND column_name = 'video_file_url'`)
    .then(result => result.rows.length > 0);

  // Check if the new column exists
  const hasFilePath = await knex.schema
    .raw(`SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'assembly_outputs' 
          AND column_name = 'file_path'`)
    .then(result => result.rows.length > 0);

  if (hasVideoFileUrl && !hasFilePath) {
    // Only rename if old column exists and new doesn't
    return knex.schema.alterTable('assembly_outputs', table => {
      table.renameColumn('video_file_url', 'file_path');
    });
  } else if (!hasVideoFileUrl && !hasFilePath) {
    // If neither column exists, create the new one
    return knex.schema.alterTable('assembly_outputs', table => {
      table.string('file_path');
    });
  }
  // If file_path already exists, do nothing
};

exports.down = async function(knex) {
  // Check if the columns exist before trying to rename
  const hasFilePath = await knex.schema
    .raw(`SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'assembly_outputs' 
          AND column_name = 'file_path'`)
    .then(result => result.rows.length > 0);

  if (hasFilePath) {
    return knex.schema.alterTable('assembly_outputs', table => {
      table.renameColumn('file_path', 'video_file_url');
    });
  }
}; 