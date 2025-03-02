exports.up = async function(knex) {
  // First check if assembly_outputs table exists
  const hasTable = await knex.schema.hasTable('assembly_outputs');
  
  if (!hasTable) {
    await knex.schema.createTable('assembly_outputs', table => {
      table.uuid('assembly_id').primary();
      table.uuid('job_id').notNullable();
      table.integer('user_id');
      table.string('status').notNullable().defaultTo('pending');
      table.string('storage_key', 1024);
      table.string('public_url', 1024);
      table.jsonb('metadata').defaultTo('{}');
      table.timestamps(true, true);
      
      // Add foreign key for job_id
      table.foreign('job_id').references('jobs.job_id');
    });
  }

  // Check if project_id exists and rename it to creatomate_id
  const hasProjectId = await knex.schema
    .raw(`SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'assembly_outputs' 
          AND column_name = 'project_id'`)
    .then(result => result.rows.length > 0);

  if (hasProjectId) {
    // Rename project_id to creatomate_id
    await knex.schema.alterTable('assembly_outputs', table => {
      table.renameColumn('project_id', 'creatomate_id');
    });
  } else {
    // Add creatomate_id if neither column exists
    await knex.schema.alterTable('assembly_outputs', table => {
      table.string('creatomate_id', 255).nullable();
    });
  }

  // Add template_id column if it doesn't exist
  const hasTemplateId = await knex.schema
    .raw(`SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'assembly_outputs' 
          AND column_name = 'template_id'`)
    .then(result => result.rows.length > 0);

  if (!hasTemplateId) {
    await knex.schema.alterTable('assembly_outputs', table => {
      table.string('template_id', 255).nullable();
    });
  }

  // Add assembly_config column if it doesn't exist
  const hasAssemblyConfig = await knex.schema
    .raw(`SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'assembly_outputs' 
          AND column_name = 'assembly_config'`)
    .then(result => result.rows.length > 0);

  if (!hasAssemblyConfig) {
    await knex.schema.alterTable('assembly_outputs', table => {
      table.jsonb('assembly_config').defaultTo('{}');
    });
  }

  // Update column comment to reflect Creatomate usage
  await knex.raw(`
    COMMENT ON COLUMN assembly_outputs.creatomate_id IS 'Stores the Creatomate render ID for tracking render status and results';
  `);
};

exports.down = async function(knex) {
  const hasTable = await knex.schema.hasTable('assembly_outputs');
  
  if (hasTable) {
    // First check if creatomate_id exists
    const hasCreatomateId = await knex.schema
      .raw(`SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'assembly_outputs' 
            AND column_name = 'creatomate_id'`)
      .then(result => result.rows.length > 0);

    await knex.schema.alterTable('assembly_outputs', table => {
      // Rename creatomate_id back to project_id if it exists
      if (hasCreatomateId) {
        table.renameColumn('creatomate_id', 'project_id');
      }

      table.dropColumn('template_id');
      table.dropColumn('assembly_config');
    });
  }
}; 