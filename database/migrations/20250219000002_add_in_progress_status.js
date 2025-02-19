exports.up = function(knex) {
  return knex.raw(`
    -- First drop the existing constraint
    ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_status_check;
    
    -- Now add the new constraint with 'in_progress'
    ALTER TABLE jobs ADD CONSTRAINT jobs_status_check 
    CHECK (status IN ('pending', 'processing', 'in_progress', 'completed', 'failed', 'completed_with_errors'));
  `);
};

exports.down = function(knex) {
  return knex.raw(`
    -- First drop the new constraint
    ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_status_check;
    
    -- Update any rows with 'in_progress' to 'processing'
    UPDATE jobs 
    SET status = 'processing' 
    WHERE status = 'in_progress';
    
    -- Add back the previous constraint
    ALTER TABLE jobs ADD CONSTRAINT jobs_status_check 
    CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'completed_with_errors'));
  `);
}; 