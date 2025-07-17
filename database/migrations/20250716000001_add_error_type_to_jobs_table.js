/**
 * Migration: Add error_type to jobs table
 *
 * This migration adds an 'error_type' column to the 'jobs' table.
 * This field allows for better categorization and debugging of job failures
 * by distinguishing between different kinds of errors (e.g., business logic vs. system errors).
 */

exports.up = async function(knex) {
  console.log('Adding error_type column to jobs table...');
  
  await knex.schema.alterTable('jobs', function(table) {
    table.string('error_type', 255).nullable()
      .comment('Categorizes the type of error (e.g., BUSINESS_ERROR, SYSTEM_ERROR)');
    table.index('error_type', 'idx_jobs_error_type');
  });
  
  console.log('✅ error_type column added successfully.');
};

exports.down = async function(knex) {
  console.log('Rolling back error_type column from jobs table...');
  
  await knex.schema.alterTable('jobs', function(table) {
    table.dropIndex('error_type', 'idx_jobs_error_type');
    table.dropColumn('error_type');
  });
  
  console.log('✅ error_type column rollback completed.');
}; 