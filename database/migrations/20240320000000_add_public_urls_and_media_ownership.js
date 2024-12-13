exports.up = async function(knex) {
  const addColumnsIfNotExist = async (tableName) => {
    const columns = await knex.table(tableName).columnInfo();
    const alterations = [];

    if (!columns.storage_key) {
      alterations.push(knex.schema.alterTable(tableName, table => {
        table.string('storage_key', 1024);
      }));
    }
    if (!columns.public_url) {
      alterations.push(knex.schema.alterTable(tableName, table => {
        table.string('public_url', 1024);
      }));
    }
    if (!columns.user_id) {
      alterations.push(knex.schema.alterTable(tableName, table => {
        table.integer('user_id').unsigned().references('user_id').inTable('users');
      }));
    }

    return Promise.all(alterations);
  };

  const tables = [
    'voice_outputs',
    'image_outputs',
    'video_outputs',
    'animation_outputs',
    'music_outputs',
    'assembly_outputs'
  ];

  for (const table of tables) {
    await addColumnsIfNotExist(table);
  }
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