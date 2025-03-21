exports.up = function(knex) {
  return knex.schema
    // First, drop the service_type enum type if it exists
    .raw(`DROP TYPE IF EXISTS service_type;`)
    
    // Create transaction_type enum if it doesn't exist
    .raw(`DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transaction_type') THEN
          CREATE TYPE transaction_type AS ENUM (
            'allocation',
            'deduction',
            'purchase',
            'adjustment',
            'expiration'
          );
        END IF;
      END $$;
    `)
    
    // Update the transaction_type column to use the enum
    .raw(`ALTER TABLE token_transactions 
          ALTER COLUMN transaction_type TYPE transaction_type 
          USING transaction_type::transaction_type;`)
    
    // Add check constraint for token_amount based on transaction_type
    .raw(`ALTER TABLE token_transactions 
          ADD CONSTRAINT check_token_amount_sign 
          CHECK (
            (transaction_type = 'deduction' AND token_amount < 0) OR
            (transaction_type IN ('allocation', 'purchase', 'adjustment') AND token_amount > 0) OR
            (transaction_type = 'expiration' AND token_amount <= 0)
          );`)
    
    // Add constraint for related entity fields
    .raw(`ALTER TABLE token_transactions 
          ADD CONSTRAINT check_related_entity 
          CHECK (
            (related_entity_type IS NULL AND related_entity_id IS NULL) OR
            (related_entity_type IS NOT NULL AND related_entity_id IS NOT NULL)
          );`);
};

exports.down = function(knex) {
  return knex.schema
    // Drop the constraints
    .raw(`ALTER TABLE token_transactions DROP CONSTRAINT IF EXISTS check_token_amount_sign;`)
    .raw(`ALTER TABLE token_transactions DROP CONSTRAINT IF EXISTS check_related_entity;`)
    
    // Drop the transaction_type enum
    .raw(`ALTER TABLE token_transactions ALTER COLUMN transaction_type TYPE VARCHAR(50);`)
    .raw(`DROP TYPE IF EXISTS transaction_type;`);
}; 