exports.up = function(knex) {
  return knex.schema
    .alterTable('voice_outputs', table => {
      table.string('storage_key', 1024);  // S3 storage key
      table.string('public_url', 1024);  // S3/CDN URL
      table.integer('user_id').unsigned().references('user_id').inTable('users');  // Media ownership
    })
    .alterTable('image_outputs', table => {
      table.string('storage_key', 1024);
      table.string('public_url', 1024);
      table.integer('user_id').unsigned().references('user_id').inTable('users');
    })
    .alterTable('video_outputs', table => {
      table.string('storage_key', 1024);
      table.string('public_url', 1024);
      table.integer('user_id').unsigned().references('user_id').inTable('users');
    })
    .alterTable('animation_outputs', table => {
      table.string('storage_key', 1024);
      table.string('public_url', 1024);
      table.integer('user_id').unsigned().references('user_id').inTable('users');
    })
    .alterTable('music_outputs', table => {
      table.string('storage_key', 1024);
      table.string('public_url', 1024);
      table.integer('user_id').unsigned().references('user_id').inTable('users');
    })
    .alterTable('assembly_outputs', table => {
      table.string('storage_key', 1024);
      table.string('public_url', 1024);
      table.integer('user_id').unsigned().references('user_id').inTable('users');
    });
};

exports.down = function(knex) {
  return knex.schema
    .alterTable('voice_outputs', table => {
      table.dropColumn('storage_key');
      table.dropColumn('public_url');
      table.dropColumn('user_id');
    })
    .alterTable('image_outputs', table => {
      table.dropColumn('storage_key');
      table.dropColumn('public_url');
      table.dropColumn('user_id');
    })
    .alterTable('video_outputs', table => {
      table.dropColumn('storage_key');
      table.dropColumn('public_url');
      table.dropColumn('user_id');
    })
    .alterTable('animation_outputs', table => {
      table.dropColumn('storage_key');
      table.dropColumn('public_url');
      table.dropColumn('user_id');
    })
    .alterTable('music_outputs', table => {
      table.dropColumn('storage_key');
      table.dropColumn('public_url');
      table.dropColumn('user_id');
    })
    .alterTable('assembly_outputs', table => {
      table.dropColumn('storage_key');
      table.dropColumn('public_url');
      table.dropColumn('user_id');
    });
}; 