exports.up = function (knex) {
    return knex.schema
      // Add prompt column to jobs table
      .alterTable('jobs', function (table) {
        table.text('prompt');
      })
      // Add job_id column to llm_scenes table
      .alterTable('llm_scenes', function (table) {
        table.uuid('job_id').references('job_id').inTable('jobs').onDelete('CASCADE');
      })
      // Populate the new columns with existing data
      .raw(`
        UPDATE jobs
        SET prompt = metadata->>'inputPrompt'
        WHERE metadata->>'inputPrompt' IS NOT NULL;
  
        UPDATE llm_scenes
        SET job_id = llm_outputs.job_id
        FROM llm_outputs
        WHERE llm_scenes.llm_output_id = llm_outputs.llm_output_id;
      `)
      // Create an index on job_id in llm_scenes
      .raw('CREATE INDEX idx_llm_scenes_job_id ON llm_scenes(job_id)');
  };
  
  exports.down = function (knex) {
    return knex.schema
      .alterTable('llm_scenes', function (table) {
        table.dropColumn('job_id');
      })
      .alterTable('jobs', function (table) {
        table.dropColumn('prompt');
      })
      .raw('DROP INDEX IF EXISTS idx_llm_scenes_job_id');
  };