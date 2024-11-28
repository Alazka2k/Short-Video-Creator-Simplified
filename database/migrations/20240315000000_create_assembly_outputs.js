exports.up = function(knex) {
  return knex.schema.createTable('assembly_outputs', (table) => {
    table.increments('assembly_id').primary();
    table.uuid('job_id').references('job_id').inTable('jobs').onDelete('CASCADE');
    table.string('status').notNullable().defaultTo('pending');
    table.string('video_file_url');
    table.string('project_id');  // JSON2Video project ID
    table.jsonb('assembly_config'); // Store the JSON2Video configuration
    table.jsonb('metadata');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('assembly_outputs');
}; 