exports.up = function(knex) {
  return knex.schema.alterTable('user_subscriptions', table => {
    table.timestamp('current_period_start');
    table.timestamp('current_period_end');
    table.timestamp('canceled_at');
    table.timestamp('ended_at');
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('user_subscriptions', table => {
    table.dropColumn('current_period_start');
    table.dropColumn('current_period_end');
    table.dropColumn('canceled_at');
    table.dropColumn('ended_at');
  });
}; 