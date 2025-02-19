exports.up = function(knex) {
  return knex.raw(`
    -- First drop the existing constraint
    ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_status_check;
    
    -- Update any existing rows that might have invalid status values
    UPDATE jobs 
    SET status = 'failed' 
    WHERE status NOT IN ('pending', 'processing', 'completed', 'failed', 'completed_with_errors');
    
    -- Now add the new constraint
    ALTER TABLE jobs ADD CONSTRAINT jobs_status_check 
    CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'completed_with_errors'));
  `);
};

exports.down = function(knex) {
  return knex.raw(`
    -- First drop the new constraint
    ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_status_check;
    
    -- Update any rows with 'completed_with_errors' to 'failed'
    UPDATE jobs 
    SET status = 'failed' 
    WHERE status = 'completed_with_errors';
    
    -- Add back the original constraint
    ALTER TABLE jobs ADD CONSTRAINT jobs_status_check 
    CHECK (status IN ('pending', 'processing', 'completed', 'failed'));
  `);
}; 