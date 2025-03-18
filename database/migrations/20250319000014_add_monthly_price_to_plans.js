exports.up = function(knex) {
  return knex.schema.alterTable('plans', function(table) {
    // Add monthly_price column to differentiate between monthly and annual pricing
    table.decimal('monthly_price', 10, 2).nullable();
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('plans', function(table) {
    // Remove the monthly_price column
    table.dropColumn('monthly_price');
  });
}; 