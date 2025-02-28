exports.up = async function(knex) {
  // Update existing storage_keys and public_urls to use correct format
  await knex.raw(`
    UPDATE video_outputs 
    SET 
      storage_key = CASE 
        WHEN file_path IS NOT NULL 
        THEN regexp_replace(
          regexp_replace(
            regexp_replace(file_path, '^.*?\\\\output\\\\', ''),  -- Remove data\output\ prefix
            '\\\\', '/'),                                         -- Replace backslashes with forward slashes
          '^', 'video/')                                          -- Ensure video/ prefix
        ELSE storage_key 
      END,
      public_url = CASE 
        WHEN file_path IS NOT NULL 
        THEN 'https://short-video-creator-dev.s3.eu-central-1.amazonaws.com/' || 
             regexp_replace(
               regexp_replace(
                 regexp_replace(file_path, '^.*?\\\\output\\\\', ''),
                 '\\\\', '/'),
               '^', 'video/')
        ELSE public_url 
      END
    WHERE 
      file_path IS NOT NULL 
      AND (
        storage_key LIKE 'data\\output\\%' 
        OR storage_key LIKE 'data/output/%'
        OR storage_key IS NULL
        OR public_url NOT LIKE '%amazonaws.com%'
        OR public_url IS NULL
      )
  `);
};

exports.down = function(knex) {
  // No down migration needed as we're just fixing incorrect paths
  return Promise.resolve();
}; 