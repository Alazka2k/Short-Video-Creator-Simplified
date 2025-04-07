/**
 * Migration: Create Batch Job Tables
 * 
 * This migration creates the necessary tables for batch job processing:
 * - batch_jobs: Stores job metadata
 * - batch_job_executions: Records job execution history
 * - batch_job_logs: Stores logs for job executions
 */

exports.up = function(knex) {
  return knex.schema
    // Drop existing tables if they exist
    .dropTableIfExists('batch_job_logs')
    .then(function() {
      return knex.schema.dropTableIfExists('batch_job_executions');
    })
    .then(function() {
      return knex.schema.dropTableIfExists('batch_jobs');
    })
    // Create batch_jobs table
    .then(function() {
      return knex.schema.createTable('batch_jobs', function(table) {
        table.string('id', 50).primary();
        table.string('name', 100).notNullable();
        table.text('description');
        table.jsonb('parameters');
        table.timestamp('last_updated').notNullable();
      });
    })
    // Create batch_job_executions table
    .then(function() {
      return knex.schema.createTable('batch_job_executions', function(table) {
        table.increments('id').primary();
        table.string('batch_id', 50).notNullable().references('id').inTable('batch_jobs');
        table.timestamp('start_time').notNullable();
        table.timestamp('end_time');
        table.string('status', 20).notNullable();
        table.jsonb('result');
        table.text('error');
        table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
      });
    })
    // Create batch_job_logs table
    .then(function() {
      return knex.schema.createTable('batch_job_logs', function(table) {
        table.increments('id').primary();
        table.string('batch_id', 50).notNullable().references('id').inTable('batch_jobs');
        table.integer('execution_id').references('id').inTable('batch_job_executions');
        table.string('level', 10).notNullable();
        table.text('message').notNullable();
        table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
      });
    })
    // Add indexes for better query performance
    .then(function() {
      return knex.schema.raw('CREATE INDEX idx_batch_job_executions_batch_id ON batch_job_executions(batch_id)');
    })
    .then(function() {
      return knex.schema.raw('CREATE INDEX idx_batch_job_executions_status ON batch_job_executions(status)');
    })
    .then(function() {
      return knex.schema.raw('CREATE INDEX idx_batch_job_logs_batch_id ON batch_job_logs(batch_id)');
    })
    .then(function() {
      return knex.schema.raw('CREATE INDEX idx_batch_job_logs_execution_id ON batch_job_logs(execution_id)');
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('batch_job_logs')
    .then(function() {
      return knex.schema.dropTableIfExists('batch_job_executions');
    })
    .then(function() {
      return knex.schema.dropTableIfExists('batch_jobs');
    });
}; 