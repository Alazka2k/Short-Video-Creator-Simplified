exports.up = function(knex) {
  return knex.schema
    // First add temporary columns
    .alterTable('llm_outputs', table => {
      table.uuid('temp_llm_id');
    })
    .alterTable('llm_scenes', table => {
      table.uuid('temp_llm_id');
    })
    // Copy data to temporary columns
    .raw('UPDATE llm_outputs SET temp_llm_id = job_id')
    .raw('UPDATE llm_scenes SET temp_llm_id = job_id')
    // Drop foreign key constraints
    .alterTable('llm_scenes', table => {
      table.dropForeign(['job_id']);
    })
    .alterTable('llm_outputs', table => {
      table.dropForeign(['job_id']);
    })
    // Drop original columns
    .alterTable('llm_outputs', table => {
      table.dropColumn('job_id');
    })
    .alterTable('llm_scenes', table => {
      table.dropColumn('job_id');
    })
    // Add new columns with correct names
    .alterTable('llm_outputs', table => {
      table.uuid('llm_id');
      table.uuid('job_id').references('job_id').inTable('jobs').onDelete('CASCADE');
    })
    .alterTable('llm_scenes', table => {
      table.uuid('llm_id');
      table.uuid('job_id').references('job_id').inTable('jobs').onDelete('CASCADE');
    })
    // Copy data from temporary columns
    .raw('UPDATE llm_outputs SET llm_id = temp_llm_id')
    .raw('UPDATE llm_scenes SET llm_id = temp_llm_id')
    // Drop temporary columns
    .alterTable('llm_outputs', table => {
      table.dropColumn('temp_llm_id');
    })
    .alterTable('llm_scenes', table => {
      table.dropColumn('temp_llm_id');
    });
};

exports.down = function(knex) {
  return knex.schema
    // First add temporary columns
    .alterTable('llm_outputs', table => {
      table.uuid('temp_job_id');
    })
    .alterTable('llm_scenes', table => {
      table.uuid('temp_job_id');
    })
    // Copy data to temporary columns
    .raw('UPDATE llm_outputs SET temp_job_id = llm_id')
    .raw('UPDATE llm_scenes SET temp_job_id = llm_id')
    // Drop columns
    .alterTable('llm_outputs', table => {
      table.dropColumn('job_id');
      table.dropColumn('llm_id');
    })
    .alterTable('llm_scenes', table => {
      table.dropColumn('job_id');
      table.dropColumn('llm_id');
    })
    // Add back original column
    .alterTable('llm_outputs', table => {
      table.uuid('job_id').references('job_id').inTable('jobs').onDelete('CASCADE');
    })
    .alterTable('llm_scenes', table => {
      table.uuid('job_id').references('job_id').inTable('jobs').onDelete('CASCADE');
    })
    // Copy data back
    .raw('UPDATE llm_outputs SET job_id = temp_job_id')
    .raw('UPDATE llm_scenes SET job_id = temp_job_id')
    // Drop temporary columns
    .alterTable('llm_outputs', table => {
      table.dropColumn('temp_job_id');
    })
    .alterTable('llm_scenes', table => {
      table.dropColumn('temp_job_id');
    });
}; 