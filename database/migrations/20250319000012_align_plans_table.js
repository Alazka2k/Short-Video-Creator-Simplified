exports.up = function(knex) {
  return knex.schema.alterTable('plans', function(table) {
    // Remove unnecessary columns
    table.dropColumn('plan_type');
    table.dropColumn('token_allocation');
    table.dropColumn('description');

    // Add new columns
    table.boolean('active').notNullable().defaultTo(true);
    
    // Add timestamps if they don't exist
    if (!knex.schema.hasColumn('plans', 'created_at', 'updated_at')) {
      table.timestamps(true, true, true);
    }
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('plans', function(table) {
    // Add back removed columns
    table.enu('plan_type', ['subscription', 'token_package']).notNullable().defaultTo('subscription');
    table.integer('token_allocation').nullable();
    table.text('description').nullable();
    
    // Remove added columns
    table.dropColumn('active');
    
    // We won't remove timestamps as they're generally useful
  });
}; 