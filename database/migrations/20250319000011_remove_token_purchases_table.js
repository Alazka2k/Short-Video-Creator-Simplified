exports.up = function(knex) {
  return knex.schema.dropTableIfExists('token_purchases');
};

exports.down = function(knex) {
  // Recreate the token_purchases table if needed to rollback
  return knex.schema.createTable('token_purchases', function(table) {
    table.uuid('purchase_id').primary();
    table.uuid('user_id').notNullable();
    table.integer('package_id').unsigned().notNullable();
    table.foreign('package_id').references('token_packages.package_id');
    table.decimal('price_paid', 10, 2).notNullable();
    table.integer('tokens_added').notNullable();
    table.timestamp('purchase_date').notNullable().defaultTo(knex.fn.now());
    table.string('payment_method').nullable();
    table.string('payment_id').nullable();
    table.string('status').notNullable().defaultTo('completed');
    table.jsonb('metadata').nullable();
    table.timestamps(true, true);
  });
}; 