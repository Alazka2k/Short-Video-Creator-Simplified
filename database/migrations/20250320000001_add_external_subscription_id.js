exports.up = function(knex) {
  return knex.schema.table('user_subscriptions', function(table) {
    // Add external_subscription_id column
    table.string('external_subscription_id', 255);
  });
};

exports.down = function(knex) {
  return knex.schema.table('user_subscriptions', function(table) {
    // Remove the external_subscription_id column
    table.dropColumn('external_subscription_id');
  });
}; 