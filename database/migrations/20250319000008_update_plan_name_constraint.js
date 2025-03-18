exports.up = function(knex) {
  return knex.schema
    // First drop the existing unique constraint
    .raw('ALTER TABLE plans DROP CONSTRAINT IF EXISTS plans_plan_name_unique')
    // Add new composite unique constraint
    .then(function() {
      return knex.schema.alterTable('plans', function(table) {
        table.unique(['plan_name', 'billing_frequency'], 'plans_plan_name_billing_frequency_unique');
      });
    });
};

exports.down = function(knex) {
  return knex.schema
    // Drop the composite unique constraint
    .raw('ALTER TABLE plans DROP CONSTRAINT IF EXISTS plans_plan_name_billing_frequency_unique')
    // Add back the original unique constraint
    .then(function() {
      return knex.schema.alterTable('plans', function(table) {
        table.unique('plan_name', 'plans_plan_name_unique');
      });
    });
}; 