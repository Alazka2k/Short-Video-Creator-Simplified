/**
 * Migration: Add Stripe Integration Fields
 * 
 * This migration enhances the existing database schema to support Stripe integration
 * by adding minimal required fields and renaming existing ones for consistency.
 * Preserves all existing functionality while enabling Stripe payment processing.
 */

exports.up = async function(knex) {
  console.log('Adding Stripe integration fields...');
  
  // Add stripe_customer_id to users table
  await knex.schema.alterTable('users', function(table) {
    table.string('stripe_customer_id', 255).nullable()
      .comment('Stripe Customer ID for payment processing');
    table.index('stripe_customer_id', 'idx_users_stripe_customer_id');
  });
  
  // Rename and add Stripe subscription fields to user_subscriptions table
  await knex.schema.alterTable('user_subscriptions', function(table) {
    // Rename existing external_subscription_id to stripe_subscription_id
    table.renameColumn('external_subscription_id', 'stripe_subscription_id');
    
    // Add new Stripe-specific fields
    table.string('stripe_status', 50).nullable()
      .comment('Stripe subscription status (active, past_due, canceled, etc.)');
    table.boolean('cancel_at_period_end').defaultTo(false)
      .comment('Whether subscription will cancel at period end');
    
    // Add index for the renamed column
    table.index('stripe_subscription_id', 'idx_user_subscriptions_stripe_subscription_id');
  });
  
  // Rename and add Stripe payment fields to payments table
  await knex.schema.alterTable('payments', function(table) {
    // Rename existing external_payment_id to stripe_payment_intent_id
    table.renameColumn('external_payment_id', 'stripe_payment_intent_id');
    
    // Add additional Stripe payment tracking fields
    table.string('stripe_invoice_id', 255).nullable()
      .comment('Stripe Invoice ID for subscription payments');
    table.string('stripe_charge_id', 255).nullable()
      .comment('Stripe Charge ID for completed payments');
    table.string('receipt_url', 500).nullable()
      .comment('Stripe receipt URL for customer access');
    
    // Add indexes for the renamed and new columns
    table.index('stripe_payment_intent_id', 'idx_payments_stripe_payment_intent_id');
    table.index('stripe_invoice_id', 'idx_payments_stripe_invoice_id');
  });
  
  // Create webhook_events table for idempotency and debugging
  await knex.schema.createTable('webhook_events', function(table) {
    table.string('event_id', 255).primary()
      .comment('Stripe event ID for idempotency');
    table.string('event_type', 100).notNullable()
      .comment('Type of Stripe event (invoice.paid, subscription.updated, etc.)');
    table.timestamp('received_at').defaultTo(knex.fn.now())
      .comment('When the webhook was received');
    table.timestamp('processed_at').nullable()
      .comment('When the webhook was successfully processed');
    table.integer('processing_attempts').defaultTo(0)
      .comment('Number of processing attempts');
    table.text('last_error').nullable()
      .comment('Last error message if processing failed');
    table.jsonb('event_data').nullable()
      .comment('Full event data for debugging');
      
    table.index('event_type', 'idx_webhook_events_event_type');
    table.index('received_at', 'idx_webhook_events_received_at');
    table.index('processed_at', 'idx_webhook_events_processed_at');
  });
  
  console.log('✅ Stripe integration fields added successfully');
  console.log('✅ Renamed external_subscription_id → stripe_subscription_id');
  console.log('✅ Renamed external_payment_id → stripe_payment_intent_id');
};

exports.down = async function(knex) {
  console.log('Rolling back Stripe integration fields...');
  
  // Rollback in reverse order
  await knex.schema.dropTableIfExists('webhook_events');
  
  await knex.schema.alterTable('payments', function(table) {
    table.dropIndex('stripe_payment_intent_id', 'idx_payments_stripe_payment_intent_id');
    table.dropIndex('stripe_invoice_id', 'idx_payments_stripe_invoice_id');
    table.dropColumn('stripe_invoice_id');
    table.dropColumn('stripe_charge_id');
    table.dropColumn('receipt_url');
    // Rename back to original
    table.renameColumn('stripe_payment_intent_id', 'external_payment_id');
  });
  
  await knex.schema.alterTable('user_subscriptions', function(table) {
    table.dropIndex('stripe_subscription_id', 'idx_user_subscriptions_stripe_subscription_id');
    table.dropColumn('stripe_status');
    table.dropColumn('cancel_at_period_end');
    // Rename back to original
    table.renameColumn('stripe_subscription_id', 'external_subscription_id');
  });
  
  await knex.schema.alterTable('users', function(table) {
    table.dropIndex('stripe_customer_id', 'idx_users_stripe_customer_id');
    table.dropColumn('stripe_customer_id');
  });
  
  console.log('✅ Stripe integration rollback completed');
}; 