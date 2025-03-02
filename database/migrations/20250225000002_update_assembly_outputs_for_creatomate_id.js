exports.up = async function(knex) {
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

  // Update column comment to reflect Creatomate usage
  await knex.raw(`
    COMMENT ON COLUMN assembly_outputs.creatomate_id IS 'Stores the Creatomate render ID for tracking render status and results';
  `);
};

exports.down = async function(knex) {
  const hasCreatomateId = await knex.schema
    .raw(`SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'assembly_outputs' 
          AND column_name = 'creatomate_id'`)
    .then(result => result.rows.length > 0);

  if (hasCreatomateId) {
    await knex.schema.alterTable('assembly_outputs', table => {
      // Rename creatomate_id back to project_id if it exists
      table.renameColumn('creatomate_id', 'project_id');
    });
  }
};

