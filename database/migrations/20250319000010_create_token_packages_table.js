exports.up = function(knex) {
  return knex.schema
    // Create the new token_packages table
    .createTable('token_packages', function(table) {
      table.increments('package_id').primary();
      table.string('package_name').notNullable();
      table.integer('token_allocation').notNullable();
      table.decimal('price', 10, 2).notNullable();
      table.boolean('active').notNullable().defaultTo(true);
      table.jsonb('marketing_description').nullable();
      table.timestamps(true, true);
    })
    // Create token_purchases table to track customer purchases
    .createTable('token_purchases', function(table) {
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

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('token_purchases')
    .dropTableIfExists('token_packages');
}; 