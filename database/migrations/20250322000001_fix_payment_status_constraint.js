/**
 * Migration to fix the status check constraint in the payments table
 * to allow 'open' status to be used for pending payments that need to be collected
 */
exports.up = function(knex) {
  return knex.schema
    // First, drop the existing constraint
    .raw('ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_status_check')
    // Then create a new constraint with all the statuses we need
    .raw(`ALTER TABLE payments ADD CONSTRAINT payments_status_check 
          CHECK (status IN ('pending', 'completed', 'failed', 'open'))`);
};

exports.down = function(knex) {
  return knex.schema
    // Revert to the original constraint
    .raw('ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_status_check')
    // Update any rows with 'open' to 'pending' for backward compatibility
    .raw(`UPDATE payments SET status = 'pending' WHERE status = 'open'`)
    // Add back the original constraint
    .raw(`ALTER TABLE payments ADD CONSTRAINT payments_status_check 
          CHECK (status IN ('pending', 'completed', 'failed'))`);
}; 