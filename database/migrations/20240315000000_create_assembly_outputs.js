exports.up = function(knex) {
  return knex.schema.hasTable('assembly_outputs').then(exists => {
    if (!exists) {
      return knex.schema.createTable('assembly_outputs', table => {
        table.increments('assembly_id').primary();
        table.uuid('job_id');
        table.string('status').notNullable().defaultTo('pending');
        table.string('video_file_url');
        table.string('project_id');
        table.jsonb('assembly_config');
        table.jsonb('metadata');
        table.timestamps(true, true);
      });
    }
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('assembly_outputs');
}; 