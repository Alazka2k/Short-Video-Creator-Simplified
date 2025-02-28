exports.up = async function(knex) {
  // First check if video_file_url still exists (it shouldn't, but let's be safe)
  const hasVideoFileUrl = await knex.schema
    .raw(`SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'video_outputs' 
          AND column_name = 'video_file_url'`)
    .then(result => result.rows.length > 0);

  if (hasVideoFileUrl) {
    // If video_file_url still exists, copy its data to file_path and drop it
    await knex.schema.alterTable('video_outputs', table => {
      // Copy data from video_file_url to file_path if file_path is null
      knex.raw(`
        UPDATE video_outputs 
        SET file_path = video_file_url 
        WHERE file_path IS NULL AND video_file_url IS NOT NULL
      `).then();
      
      // Drop the old column
      table.dropColumn('video_file_url');
    });
  }

  // Ensure storage_key and public_url exist with correct length
  const columns = await knex('video_outputs').columnInfo();
  
  if (!columns.storage_key) {
    await knex.schema.alterTable('video_outputs', table => {
      table.string('storage_key', 1024);
    });
  }
  
  if (!columns.public_url) {
    await knex.schema.alterTable('video_outputs', table => {
      table.string('public_url', 1024);
    });
  }

  // Update storage_key and public_url from file_path if they're null
  await knex.raw(`
    UPDATE video_outputs 
    SET 
      storage_key = CASE 
        WHEN storage_key IS NULL AND file_path IS NOT NULL 
        THEN regexp_replace(
          regexp_replace(
            regexp_replace(file_path, '^.*?\\\\output\\\\', ''),  -- Remove data\output\ prefix
            '\\\\', '/'),                                         -- Replace backslashes with forward slashes
          '^', 'video/')                                          -- Ensure video/ prefix
        ELSE storage_key 
      END,
      public_url = CASE 
        WHEN (public_url IS NULL OR public_url NOT LIKE '%amazonaws.com%') AND file_path IS NOT NULL 
        THEN 'https://short-video-creator-dev.s3.eu-central-1.amazonaws.com/' || 
             CASE 
               WHEN storage_key IS NOT NULL THEN storage_key
               ELSE regexp_replace(
                 regexp_replace(
                   regexp_replace(file_path, '^.*?\\\\output\\\\', ''),
                   '\\\\', '/'),
                 '^', 'video/')
             END
        ELSE public_url 
      END
    WHERE file_path IS NOT NULL
  `);
};

exports.down = function(knex) {
  return knex.schema.alterTable('video_outputs', table => {
    // We don't want to recreate video_file_url in down migration
    // as we've standardized on file_path
    table.dropColumn('storage_key');
    table.dropColumn('public_url');
  });
}; 