/**
 * Migration to add payment_provider column to payments table
 * 
 * This separates the provider (e.g., 'stripe', 'paypal') from the payment method (e.g., 'credit_card', 'bank_transfer')
 * Previously, payment_provider was incorrectly stored in the payment_method column,
 * but this migration adds a dedicated column for it.
 */
exports.up = function(knex) {
  return knex.schema.alterTable('payments', function(table) {
    // Add payment_provider column
    table.string('payment_provider', 50).nullable();
    
    // Initially, copy existing values from payment_method to payment_provider
    // as historically we've been storing the provider in the method column
  }).then(function() {
    return knex.raw(`
      UPDATE payments 
      SET payment_provider = payment_method
      WHERE payment_provider IS NULL
    `);
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('payments', function(table) {
    // Remove the payment_provider column
    table.dropColumn('payment_provider');
  });
};
