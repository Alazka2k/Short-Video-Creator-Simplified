// File: database/seeds/04_token_packages.js

exports.seed = async function(knex) {
  console.log('Seeding token packages...');
  
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
        name: 'Starter Pack',
        description: 'A quick boost to get you through a small project.',
        features: [
          'Works with any plan - Supplements your monthly allocation seamlessly',
          'Instant availability - Tokens added immediately to your account'
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
        name: 'Creator Pack',
        description: 'Perfect for completing a series of social media posts.',
        features: [
          'Great value - Cost-effective for consistent creators',
          'Universal compatibility - Use with any subscription tier'
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
        name: 'Pro Pack',
        description: 'The best value for creators with consistent monthly needs.',
        features: [
          'Premium value - Better cost per token than smaller packs',
          'Any plan compatible - Enhances all subscription tiers'
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
        name: 'Studio Pack',
        description: 'For agencies and professionals with high-volume production.',
        features: [
          'Best value overall - Maximum tokens',
          'Universal plan support - Works with every subscription level'
        ]
      })
    }
  ];
  
  // Use a transaction and upsert logic to avoid foreign key constraint errors
  await knex.transaction(async (trx) => {
    console.log('Upserting token packages...');
    for (const pkg of tokenPackages) {
      await trx('token_packages')
        .insert(pkg)
        .onConflict('package_id')
        .merge();
    }
  });
  
  console.log('Successfully seeded token packages');
}; 