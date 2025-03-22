/**
 * Migration to add timestamp columns to the payments table
 * This adds created_at and updated_at columns that are used by our application code
 */
exports.up = function(knex) {
  return knex.schema.raw(`
    DO $$
    BEGIN
      -- Add created_at column if it doesn't exist
      IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'payments' AND column_name = 'created_at'
      ) THEN
        ALTER TABLE payments ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
      END IF;

      -- Add updated_at column if it doesn't exist
      IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'payments' AND column_name = 'updated_at'
      ) THEN
        ALTER TABLE payments ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
      END IF;
    END $$;
  `);
};

exports.down = function(knex) {
  return knex.schema.alterTable('payments', function(table) {
    // Drop the timestamp columns if they exist
    table.dropColumn('updated_at');
    table.dropColumn('created_at');
  });
}; 