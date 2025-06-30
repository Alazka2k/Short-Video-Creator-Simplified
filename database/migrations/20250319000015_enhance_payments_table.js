exports.up = function(knex) {
  return knex.schema.alterTable('payments', function(table) {
    // Add payment type to track what the payment was for
    table.enu('payment_type', [
      'subscription_initial', // First payment for a subscription
      'subscription_renewal', // Recurring payment for a subscription
      'token_package'        // One-time token package purchase
    ]).nullable();
    
    // Add related entity ID columns
    table.integer('plan_id').unsigned().nullable().references('plan_id').inTable('plans');
    table.integer('package_id').unsigned().nullable().references('package_id').inTable('token_packages');
    table.integer('subscription_id').unsigned().nullable().references('subscription_id').inTable('user_subscriptions');
    
    // Add external payment ID from payment processor (e.g., Stripe)
    table.string('stripe_payment_intent_id').nullable();
    
    // Add billing period for subscription payments
    table.date('billing_period_start').nullable();
    table.date('billing_period_end').nullable();
    
    // Add metadata for additional payment information
    table.jsonb('payment_metadata').nullable();
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('payments', function(table) {
    // Remove the columns
    table.dropColumn('payment_type');
    table.dropColumn('plan_id');
    table.dropColumn('package_id');
    table.dropColumn('subscription_id');
    table.dropColumn('stripe_payment_intent_id');
    table.dropColumn('billing_period_start');
    table.dropColumn('billing_period_end');
    table.dropColumn('payment_metadata');
  });
}; 