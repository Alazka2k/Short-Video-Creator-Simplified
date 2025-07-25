// File: database/seeds/03_update_plans.js

exports.seed = async function(knex) {
  console.log('Starting plan update process...');
  
  // Get existing plans to preserve IDs that might be referenced
  console.log('Fetching existing plans...');
  const existingPlans = await knex('plans').select('plan_id');
  const existingPlanIds = existingPlans.map(plan => plan.plan_id);
  
  console.log(`Found ${existingPlanIds.length} existing plans with IDs: ${existingPlanIds.join(', ')}`);
  
  // Update the Free Tier with the latest specs
  console.log('Updating Free Tier...');
  await knex('plans')
    .where('plan_id', 1)
    .update({
      plan_name: 'Free Tier',
      billing_frequency: 'monthly',
      monthly_token_allocation: 300,
      price: 0.00,
      monthly_price: 0.00,
      annual_price: 0.00,
      active: true,
      // Operational limits
      max_scenes_per_job: 5,
      max_jobs_per_month: 10,
      video_quality: null,
      visual_selection_count: 2,
      voice_selection_count: 3,
      template_selection_count: 3,
      // Feature flags
      has_watermark: true,
      script_settings_enabled: false,
      recreation_enabled: false,
      recreation_content_types: JSON.stringify([]),
      // Support and content types
      support_level: 'community',
      allowed_content_types: JSON.stringify(['image', 'text', 'voice']),
      // Marketing description
      marketing_description: JSON.stringify({
        tier_name: 'Free',
        description: 'For anyone to get started and explore the platform.',
        features: [
          { "title": "AI-powered script", "text": "Transform ideas into compelling narratives", "highlight": true },
          { "title": "Professional voiceovers", "text": "Choose from three premium AI voices", "highlight": true },
          { "title": "Export & download", "text": "Own your content completely", "highlight": true },
          { "title": "Consistent image creation", "text": "Access to two signature visual styles", "highlight": false },
          { "title": "Background music", "text": "Enhance your stories with perfect soundtracks", "highlight": false },
          { "title": "Limited video assembly", "text": "Automated scene transitions", "highlight": false },
          { "title": "Watermark", "text": "Content includes Narravid watermark", "highlight": false }
        ],
        is_popular: false
      }),
      // Tier ID - Free Tier is tier 1
      tier_id: 1
    });
  
  // Note: stripe_price_id values correspond to the Stripe Price IDs created for each plan
  // These IDs are used for direct Stripe Checkout integration and webhook verification
  // Plan ID mapping: Basic (2=monthly, 3=yearly), Creator (4=monthly, 5=yearly), Professional (6=monthly, 7=yearly)
  
  // Define all plans we want to ensure exist
  const plansToUpsert = [
    // Basic Tier - Monthly
    {
      plan_id: 2,
      plan_name: 'Basic Tier',
      billing_frequency: 'monthly',
      monthly_token_allocation: 2500,
      price: 24.99, // Monthly price
      monthly_price: 24.99,
      annual_price: 299.88, // Total annual price
      active: true,
      // Stripe Integration
      stripe_price_id: 'price_1RbLUVLNIN3RdSe9NYWTUWQ6',
      // Operational limits
      max_scenes_per_job: 13,
      max_jobs_per_month: 45,
      video_quality: '540p',
      visual_selection_count: 9,
      voice_selection_count: 9,
      template_selection_count: 10,
      // Feature flags
      has_watermark: false,
      script_settings_enabled: true,
      recreation_enabled: false,
      recreation_content_types: JSON.stringify([]),
      // Support and content types
      support_level: 'community',
      allowed_content_types: JSON.stringify(['image', 'voice', 'animation', 'video', 'music']),
      // Marketing description
      marketing_description: JSON.stringify({
        tier_name: 'Basic',
        description: 'For creators making regular content for social media.',
        features: [
            { "title": "Everything in Free, plus:", "text": "Get all the benefits of the free tier and more.", "highlight": false},
            { "title": "AI video generation", "text": "Transform static images into dynamic videos", "highlight": true },
            { "title": "No watermarks", "text": "Professional, branded content that's truly yours", "highlight": true },
            { "title": "YouTube Shorts & TikTok", "text": "Perfect scene lengths and formats", "highlight": true },
            { "title": "Nine premium visual styles", "text": "From cinematic to anime, comic to realistic", "highlight": false },
            { "title": "Nine professional AI voices", "text": "Match your brand's personality perfectly", "highlight": false },
            { "title": "Advanced script settings", "text": "Fine-tune tone, style, and pacing", "highlight": false }
        ],
        is_popular: false
      }),
      // Tier ID - Basic Tier is tier 2
      tier_id: 2
    },
    // Basic Tier - Yearly
    {
      plan_id: 3,
      plan_name: 'Basic Tier',
      billing_frequency: 'yearly',
      monthly_token_allocation: 2500,
      price: 239.88, // Yearly price (Monthly price of 19.99)
      monthly_price: 19.99,
      annual_price: 239.88, // Total annual price
      active: true,
      // Stripe Integration
      stripe_price_id: 'price_1Rc0wRLNIN3RdSe9ZnpVoMcg',
      // Operational limits
      max_scenes_per_job: 13,
      max_jobs_per_month: 45,
      video_quality: '540p',
      visual_selection_count: 9,
      voice_selection_count: 9,
      template_selection_count: 10,
      // Feature flags
      has_watermark: false,
      script_settings_enabled: true,
      recreation_enabled: false,
      recreation_content_types: JSON.stringify([]),
      // Support and content types
      support_level: 'community',
      allowed_content_types: JSON.stringify(['image', 'voice', 'animation', 'video', 'music']),
      // Marketing description
      marketing_description: JSON.stringify({
        tier_name: 'Basic',
        description: 'For creators making regular content for social media.',
        features: [
            { "title": "Everything in Free, plus:", "text": "Get all the benefits of the free tier and more.", "highlight": false},
            { "title": "AI video generation", "text": "Transform static images into dynamic videos", "highlight": true },
            { "title": "No watermarks", "text": "Professional, branded content that's truly yours", "highlight": true },
            { "title": "YouTube Shorts & TikTok length", "text": "Perfect scene lengths and formats", "highlight": true },
            { "title": "Nine premium visual styles", "text": "From cinematic to anime, comic to realistic", "highlight": false },
            { "title": "Nine professional AI voices", "text": "Match your brand's personality perfectly", "highlight": false },
            { "title": "Advanced script settings", "text": "Fine-tune tone, style, and pacing", "highlight": false }
        ],
        is_popular: false
      }),
      // Tier ID - Basic Tier is tier 2
      tier_id: 2
    },
    // Creator Tier - Monthly
    {
      plan_id: 4,
      plan_name: 'Creator Tier',
      billing_frequency: 'monthly',
      monthly_token_allocation: 6500,
      price: 39.99, // Monthly price
      monthly_price: 39.99,
      annual_price: 479.88, // Total annual price
      active: true,
      // Stripe Integration
      stripe_price_id: 'price_1Rc13kLNIN3RdSe9eFjGFvZt',
      // Operational limits
      max_scenes_per_job: 20,
      max_jobs_per_month: null, // Unlimited
      video_quality: '540p',
      visual_selection_count: null, // Unlimited
      voice_selection_count: null, // Unlimited
      template_selection_count: null, // Unlimited
      // Feature flags
      has_watermark: false,
      script_settings_enabled: true,
      recreation_enabled: true,
      recreation_content_types: JSON.stringify(['image', 'voice', 'music']),
      // Support and content types
      support_level: 'email_24h',
      allowed_content_types: JSON.stringify(['image', 'voice', 'animation', 'video', 'music']),
      // Marketing description
      marketing_description: JSON.stringify({
        tier_name: 'Creator',
        description: 'For professionals creating high-quality, long-form content.',
        features: [
            { "title": "Everything in Basic, plus:", "text": "Build on top of the Basic plan's features.", "highlight": false },
            { "title": "Extended scene support", "text": "Create longer, more detailed narratives", "highlight": true },
            { "title": "Unlimited production runs", "text": "No monthly limits on your creativity", "highlight": true },
            { "title": "Priority email support", "text": "Get expert help within 24 hours", "highlight": true },
            { "title": "Unlimited visual styles", "text": "Access to our complete style library", "highlight": false },
            { "title": "Unlimited voice selection", "text": "Every AI voice at your disposal", "highlight": false },
            { "title": "Unlimited templates", "text": "All assembly options and transitions", "highlight": false }
        ],
        is_popular: true
      }),
      // Tier ID - Creator Tier is tier 3
      tier_id: 3
    },
    // Creator Tier - Yearly
    {
      plan_id: 5,
      plan_name: 'Creator Tier',
      billing_frequency: 'yearly',
      monthly_token_allocation: 6500,
      price: 419.88, // Total annual price (Monthly price of 34.99)
      monthly_price: 34.99,
      annual_price: 419.88, // Total annual price
      active: true,
      // Stripe Integration
      stripe_price_id: 'price_1Rc14pLNIN3RdSe9ROUoOdL7',
      // Operational limits
      max_scenes_per_job: 20,
      max_jobs_per_month: null, // Unlimited
      video_quality: '540p',
      visual_selection_count: null, // Unlimited
      voice_selection_count: null, // Unlimited
      template_selection_count: null, // Unlimited
      // Feature flags
      has_watermark: false,
      script_settings_enabled: true,
      recreation_enabled: true,
      recreation_content_types: JSON.stringify(['image', 'voice', 'music']),
      // Support and content types
      support_level: 'email_24h',
      allowed_content_types: JSON.stringify(['image', 'voice', 'animation', 'video', 'music']),
      // Marketing description
      marketing_description: JSON.stringify({
        tier_name: 'Creator',
        description: 'For professionals creating high-quality, long-form content.',
        features: [
            { "title": "Everything in Basic, plus:", "text": "Build on top of the Basic plan's features.", "highlight": false },
            { "title": "Extended scene support", "text": "Create longer, more detailed narratives", "highlight": true },
            { "title": "Unlimited production runs", "text": "No monthly limits on your creativity", "highlight": true },
            { "title": "Priority email support", "text": "Get expert help within 24 hours", "highlight": true },
            { "title": "Unlimited visual styles", "text": "Access to our complete style library", "highlight": false },
            { "title": "Unlimited voice selection", "text": "Every AI voice at your disposal", "highlight": false },
            { "title": "Unlimited templates", "text": "All assembly options and transitions", "highlight": false }
        ],
        is_popular: true
      }),
      // Tier ID - Creator Tier is tier 3
      tier_id: 3
    },
    // Professional Tier - Monthly
    {
      plan_id: 6,
      plan_name: 'Professional Tier',
      billing_frequency: 'monthly',
      monthly_token_allocation: 10000,
      price: 59.99, // Monthly price
      monthly_price: 59.99,
      annual_price: 599.88, // Total annual price (corrected)
      active: false,
      // Stripe Integration
      stripe_price_id: 'price_1Rc171LNIN3RdSe9byp0jlqa',
      // Operational limits
      max_scenes_per_job: null, // Unlimited
      max_jobs_per_month: null, // Unlimited
      video_quality: '720p',
      visual_selection_count: null, // Unlimited
      voice_selection_count: null, // Unlimited
      template_selection_count: null, // Unlimited
      // Feature flags
      has_watermark: false,
      script_settings_enabled: true,
      recreation_enabled: true,
      recreation_content_types: JSON.stringify(['image', 'voice', 'animation', 'video', 'music']),
      // Support and content types
      support_level: 'email_24h',
      allowed_content_types: JSON.stringify(['image', 'voice', 'animation', 'video', 'music']),
      // Marketing description
      marketing_description: JSON.stringify({
        tier_name: 'Professional',
        description: 'For businesses and agencies with high-volume needs.',
        features: [
            { "title": "Everything in Creator, plus:", "text": "The ultimate creative package.", "highlight": false },
            { "title": "Priority video processing", "text": "Faster generation times for tight deadlines", "highlight": true },
            { "title": "Direct Upload", "text": "Directly upload your created videos to your social media channels", "highlight": true },
            { "title": "Unlimited everything", "text": "No restrictions on scenes, jobs, or creativity", "highlight": false },
            { "title": "Complete content recreation", "text": "Recreate any type of content flawlessly", "highlight": false },
            { "title": "Dedicated support", "text": "Priority assistance for professional workflows", "highlight": false }
        ],
        is_popular: false
      }),
      // Tier ID - Professional Tier is tier 4
      tier_id: 4
    },
    // Professional Tier - Yearly
    {
      plan_id: 7,
      plan_name: 'Professional Tier',
      billing_frequency: 'yearly',
      monthly_token_allocation: 10000,
      price: 599.88, // Yearly price (Monthly price of 49.99)
      monthly_price: 49.99,
      annual_price: 599.88, // Total annual price
      active: false,
      // Stripe Integration
      stripe_price_id: 'price_1Rc17WLNIN3RdSe9fV4YoGHv',
      // Operational limits
      max_scenes_per_job: null, // Unlimited
      max_jobs_per_month: null, // Unlimited
      video_quality: '720p',
      visual_selection_count: null, // Unlimited
      voice_selection_count: null, // Unlimited
      template_selection_count: null, // Unlimited
      // Feature flags
      has_watermark: false,
      script_settings_enabled: true,
      recreation_enabled: true,
      recreation_content_types: JSON.stringify(['image', 'voice', 'animation', 'video', 'music']),
      // Support and content types
      support_level: 'email_24h',
      allowed_content_types: JSON.stringify(['image', 'voice', 'animation', 'video', 'music']),
      // Marketing description
      marketing_description: JSON.stringify({
        tier_name: 'Professional',
        description: 'For businesses and agencies with high-volume needs.',
        features: [
            { "title": "Everything in Creator, plus:", "text": "The ultimate creative package.", "highlight": false },
            { "title": "Priority video processing", "text": "Faster generation times for tight deadlines", "highlight": true },
            { "title": "Direct Upload", "text": "Directly upload your created videos to your social media channels", "highlight": true },
            { "title": "Unlimited everything", "text": "No restrictions on scenes, jobs, or creativity", "highlight": false },
            { "title": "Complete content recreation", "text": "Recreate any type of content flawlessly", "highlight": false },
            { "title": "Dedicated support", "text": "Priority assistance for professional workflows", "highlight": false }
        ],
        is_popular: false
      }),
      // Tier ID - Professional Tier is tier 4
      tier_id: 4
    }
  ];

  // Use upsert pattern instead of delete/insert
  console.log('Upserting plans...');
  for (const plan of plansToUpsert) {
    await knex('plans')
      .insert(plan)
      .onConflict('plan_id')
      .merge();
  }

  // Make any plans that aren't in our defined list inactive
  const definedPlanIds = [1, ...plansToUpsert.map(p => p.plan_id)];
  await knex('plans')
    .whereNotIn('plan_id', definedPlanIds)
    .update({ active: false });

  console.log('Successfully updated all plans');
}; 