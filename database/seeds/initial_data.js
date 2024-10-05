// database/seeds/initial_data.js

exports.seed = async function (knex) {
    // Deletes ALL existing entries in reverse order of dependencies
    await knex('video_outputs').del();
    await knex('animation_outputs').del();
    await knex('music_outputs').del();
    await knex('voice_outputs').del();
    await knex('image_outputs').del();
    await knex('llm_scenes').del();
    await knex('llm_outputs').del();
    await knex('llm_inputs').del();
    await knex('payments').del();
    await knex('token_transactions').del();
    await knex('tokens').del();
    await knex('user_subscriptions').del();
    await knex('plans').del();
    await knex('jobs').del();
    await knex('user_roles').del();
    await knex('roles').del();
    await knex('users').del();
  
    // Inserts roles
    await knex('roles').insert([
      { role_name: 'admin', description: 'Administrator with full access' },
      { role_name: 'user', description: 'Regular user with limited access' },
    ]);
  
    // Inserts users
    await knex('users').insert([
      {
        user_id: 1,
        first_name: 'Alice',
        last_name: 'Smith',
        email: 'alice@example.com',
        password_hash: 'hashed_password', // Replace with actual hashed password
      },
      {
        user_id: 2,
        first_name: 'Bob',
        last_name: 'Johnson',
        email: 'bob@example.com',
        password_hash: 'hashed_password', // Replace with actual hashed password
      },
    ]);
  
    // Inserts user roles
    await knex('user_roles').insert([
      { user_id: 1, role_id: 1 }, // Alice is admin
      { user_id: 2, role_id: 2 }, // Bob is user
    ]);
  
    // Inserts plans
    await knex('plans').insert([
      {
        plan_id: 1,
        plan_name: 'Free',
        monthly_token_allocation: 100,
        price: 0.0,
        description: 'Free plan with limited tokens',
      },
      {
        plan_id: 2,
        plan_name: 'Premium Tier 1',
        monthly_token_allocation: 1000,
        price: 9.99,
        description: 'Premium plan with more tokens',
      },
      {
        plan_id: 3,
        plan_name: 'Premium Tier 2',
        monthly_token_allocation: 5000,
        price: 19.99,
        description: 'Premium plan with maximum tokens',
      },
    ]);
  
    // Inserts user subscriptions
    await knex('user_subscriptions').insert([
      {
        subscription_id: 1,
        user_id: 1,
        plan_id: 2,
        start_date: knex.fn.now(),
        status: 'active',
      },
      {
        subscription_id: 2,
        user_id: 2,
        plan_id: 1,
        start_date: knex.fn.now(),
        status: 'active',
      },
    ]);
  
    // Inserts tokens
    await knex('tokens').insert([
      { token_id: 1, user_id: 1, balance: 1000 },
      { token_id: 2, user_id: 2, balance: 100 },
    ]);
  
    // Inserts jobs
    await knex('jobs').insert([
      {
        job_id: 1,
        user_id: 1,
        status: 'pending',
        service_sequence: JSON.stringify([{ service: 'llm' }, { service: 'image' }]),
        metadata: JSON.stringify({}),
      },
      {
        job_id: 2,
        user_id: 2,
        status: 'in_progress',
        service_sequence: JSON.stringify([{ service: 'llm' }, { service: 'voice' }]),
        metadata: JSON.stringify({}),
      },
    ]);
  
    // Inserts token transactions
    await knex('token_transactions').insert([
      {
        transaction_id: 1,
        user_id: 1,
        transaction_type: 'deduction',
        amount: -10,
        job_id: 1,
      },
      {
        transaction_id: 2,
        user_id: 2,
        transaction_type: 'deduction',
        amount: -5,
        job_id: 2,
      },
    ]);
  
    // Inserts LLM inputs
    await knex('llm_inputs').insert([
      {
        llm_input_id: 1,
        job_id: 1,
        prompt: 'Generate an image of a sunset over mountains.',
        parameters: JSON.stringify({}),
      },
      {
        llm_input_id: 2,
        job_id: 2,
        prompt: 'Create a voiceover for an introduction.',
        parameters: JSON.stringify({}),
      },
    ]);
  
    // Continue inserting data into other tables as needed
  };
  