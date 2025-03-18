exports.up = function(knex) {
  return knex.schema.raw(`
    DO $$
    BEGIN
      -- Add created_at column if it doesn't exist
      IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'plans' AND column_name = 'created_at'
      ) THEN
        ALTER TABLE plans ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
      END IF;

      -- Add updated_at column if it doesn't exist
      IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'plans' AND column_name = 'updated_at'
      ) THEN
        ALTER TABLE plans ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
      END IF;
    END $$;
  `);
};

exports.down = function(knex) {
  return knex.schema.alterTable('plans', function(table) {
    // Drop the timestamp columns if they exist
    table.dropColumn('updated_at');
    table.dropColumn('created_at');
  });
}; 