/**
 * Migration to simplify job status strategy
 * 
 * This migration:
 * 1. Updates any jobs with status 'completed_with_errors' to 'completed' (keeping their error info)
 * 2. Updates the constraint to remove 'completed_with_errors' as a valid status
 */
exports.up = function(knex) {
  return knex.schema
    // First update any jobs with 'completed_with_errors' status to 'completed'
    .raw(`
      UPDATE jobs 
      SET status = 'completed' 
      WHERE status = 'completed_with_errors'
    `)
    // Then drop the existing constraint
    .raw('ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_status_check')
    // Add the updated constraint without 'completed_with_errors'
    .raw(`
      ALTER TABLE jobs ADD CONSTRAINT jobs_status_check 
      CHECK (status IN ('pending', 'processing', 'in_progress', 'completed', 'failed'))
    `);
};

exports.down = function(knex) {
  return knex.schema
    // Drop the new constraint
    .raw('ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_status_check')
    // Add back the previous constraint with 'completed_with_errors'
    .raw(`
      ALTER TABLE jobs ADD CONSTRAINT jobs_status_check 
      CHECK (status IN ('pending', 'processing', 'in_progress', 'completed', 'failed', 'completed_with_errors'))
    `);
}; 