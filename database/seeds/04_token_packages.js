// File: database/seeds/04_token_packages.js

exports.seed = async function(knex) {
  console.log('Seeding token packages...');
  
  // Delete all existing token packages first
  await knex('token_packages').del();
  
  // Note: stripe_price_id values correspond to the Stripe Price IDs created for each token package
  // These IDs are used for direct Stripe Checkout integration and webhook verification
  
  // Define token packages
  const tokenPackages = [
    {
      package_id: 1,
      package_name: 'Starter Pack',
      token_allocation: 1000,
      price: 9.99,
      active: true,
      stripe_price_id: 'price_1Rc1S6LNIN3RdSe9P2J8eKE0',
      marketing_description: JSON.stringify({
        features: [
          '1,000 additional tokens',
          'Never expires',
          'Use with any subscription'
        ]
      })
    },
    {
      package_id: 2,
      package_name: 'Creator Pack',
      token_allocation: 2500,
      price: 24.99,
      active: true,
      stripe_price_id: 'price_1Rc1T1LNIN3RdSe9ipl3BesU',
      marketing_description: JSON.stringify({
        features: [
          '2,500 additional tokens',
          'Never expires',
          'Use with any subscription',
          'Best value for basic users'
        ]
      })
    },
    {
      package_id: 3,
      package_name: 'Pro Pack',
      token_allocation: 6000,
      price: 39.99,
      active: true,
      stripe_price_id: 'price_1Rc1ThLNIN3RdSe9Sw813QvO',
      marketing_description: JSON.stringify({
        features: [
          '6,000 additional tokens',
          'Never expires',
          'Use with any subscription',
          'Perfect for power users'
        ]
      })
    },
    {
      package_id: 4,
      package_name: 'Studio Pack',
      token_allocation: 15000,
      price: 99.99,
      active: true,
      stripe_price_id: 'price_1Rc1UYLNIN3RdSe9NTJ6wEE7',
      marketing_description: JSON.stringify({
        features: [
          '15,000 additional tokens',
          'Never expires',
          'Use with any subscription',
          'Best value for professionals'
        ]
      })
    }
  ];
  
  // Insert the token packages
  await knex('token_packages').insert(tokenPackages);
  
  console.log('Successfully seeded token packages');
}; 