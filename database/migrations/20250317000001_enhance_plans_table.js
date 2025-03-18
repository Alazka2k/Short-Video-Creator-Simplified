exports.up = function(knex) {
  return knex.schema.alterTable('plans', function(table) {
    table.jsonb('features').defaultTo('{}');
    table.jsonb('restrictions').defaultTo('{}');
    table.string('billing_frequency', 10).notNullable().defaultTo('monthly');
    table.decimal('annual_price', 10, 2);
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('plans', function(table) {
    table.dropColumn('features');
    table.dropColumn('restrictions');
    table.dropColumn('billing_frequency');
    table.dropColumn('annual_price');
  });
}; 