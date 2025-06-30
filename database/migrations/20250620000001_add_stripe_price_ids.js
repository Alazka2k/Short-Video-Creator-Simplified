/**
 * Migration: Add Stripe Price IDs to Plans and Token Packages
 * 
 * This migration adds stripe_price_id columns to both the plans and token_packages tables
 * to store the Stripe price IDs for faster lookups during Checkout creation and webhook processing.
 */

exports.up = async function(knex) {
  console.log('Adding stripe_price_id columns...');
  
  // Add stripe_price_id to plans table
  await knex.schema.alterTable('plans', function(table) {
    table.string('stripe_price_id', 255).nullable()
      .comment('Stripe Price ID for this plan - used for Checkout sessions and webhook verification');
    
    // Add index for faster lookups
    table.index('stripe_price_id', 'idx_plans_stripe_price_id');
  });
  
  // Add stripe_price_id to token_packages table
  await knex.schema.alterTable('token_packages', function(table) {
    table.string('stripe_price_id', 255).nullable()
      .comment('Stripe Price ID for this token package - used for one-time purchases');
    
    // Add index for faster lookups
    table.index('stripe_price_id', 'idx_token_packages_stripe_price_id');
  });
  
  console.log('Successfully added stripe_price_id columns to plans and token_packages tables');
};

exports.down = async function(knex) {
  console.log('Removing stripe_price_id columns...');
  
  // Remove stripe_price_id from plans table
  await knex.schema.alterTable('plans', function(table) {
    table.dropIndex('stripe_price_id', 'idx_plans_stripe_price_id');
    table.dropColumn('stripe_price_id');
  });
  
  // Remove stripe_price_id from token_packages table
  await knex.schema.alterTable('token_packages', function(table) {
    table.dropIndex('stripe_price_id', 'idx_token_packages_stripe_price_id');
    table.dropColumn('stripe_price_id');
  });
  
  console.log('Successfully removed stripe_price_id columns');
}; 