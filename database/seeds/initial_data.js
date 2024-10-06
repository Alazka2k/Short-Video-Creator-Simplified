// File: database/seeds/initial_data.js

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

  // Insert roles
  const [adminRole, userRole] = await knex('roles').insert([
    { role_name: 'admin', description: 'Administrator with full access' },
    { role_name: 'user', description: 'Regular user with limited access' },
  ]).returning(['role_id']);

  // Insert users
  const [alice, bob] = await knex('users').insert([
    {
      first_name: 'Alice',
      last_name: 'Smith',
      email: 'alice@example.com',
      password_hash: 'hashed_password_alice', // Replace with actual hashed password
    },
    {
      first_name: 'Bob',
      last_name: 'Johnson',
      email: 'bob@example.com',
      password_hash: 'hashed_password_bob', // Replace with actual hashed password
    },
  ]).returning(['user_id']);

  // Insert user roles
  await knex('user_roles').insert([
    { user_id: alice.user_id, role_id: adminRole.role_id },
    { user_id: bob.user_id, role_id: userRole.role_id },
  ]);

  // Insert plans
  const [freePlan, premiumTier1, premiumTier2] = await knex('plans').insert([
    {
      plan_name: 'Free',
      monthly_token_allocation: 100,
      price: 0.0,
      description: 'Free plan with limited tokens',
    },
    {
      plan_name: 'Premium Tier 1',
      monthly_token_allocation: 1000,
      price: 9.99,
      description: 'Premium plan with more tokens',
    },
    {
      plan_name: 'Premium Tier 2',
      monthly_token_allocation: 5000,
      price: 19.99,
      description: 'Premium plan with maximum tokens',
    },
  ]).returning(['plan_id']);

  // Insert user subscriptions
  await knex('user_subscriptions').insert([
    {
      user_id: alice.user_id,
      plan_id: premiumTier1.plan_id,
      start_date: knex.fn.now(),
      status: 'active',
    },
    {
      user_id: bob.user_id,
      plan_id: freePlan.plan_id,
      start_date: knex.fn.now(),
      status: 'active',
    },
  ]);

  // Insert tokens
  await knex('tokens').insert([
    { user_id: alice.user_id, balance: 1000 },
    { user_id: bob.user_id, balance: 100 },
  ]);

  // Insert jobs
  const [job1, job2] = await knex('jobs').insert([
    {
      user_id: alice.user_id,
      status: 'pending',
      service_sequence: JSON.stringify(['llm', 'image', 'voice']),
      metadata: JSON.stringify({ priority: 'high' }),
    },
    {
      user_id: bob.user_id,
      status: 'in_progress',
      service_sequence: JSON.stringify(['llm', 'voice']),
      metadata: JSON.stringify({ priority: 'normal' }),
    },
  ]).returning(['job_id']);

  // Insert token transactions
  await knex('token_transactions').insert([
    {
      user_id: alice.user_id,
      transaction_type: 'deduction',
      amount: -10,
      job_id: job1.job_id,
    },
    {
      user_id: bob.user_id,
      transaction_type: 'deduction',
      amount: -5,
      job_id: job2.job_id,
    },
  ]);

  // Insert payments
  await knex('payments').insert([
    {
      user_id: alice.user_id,
      amount: 9.99,
      currency: 'USD',
      payment_method: 'credit_card',
      status: 'completed',
    },
    {
      user_id: bob.user_id,
      amount: 0,
      currency: 'USD',
      payment_method: 'free_plan',
      status: 'completed',
    },
  ]);

  // Insert LLM inputs
  const [llmInput1, llmInput2] = await knex('llm_inputs').insert([
    {
      job_id: job1.job_id,
      prompt: 'Create a video about artificial intelligence in healthcare',
      parameters: JSON.stringify({ temperature: 0.7, max_tokens: 1000 }),
    },
    {
      job_id: job2.job_id,
      prompt: 'Generate a script for a product advertisement',
      parameters: JSON.stringify({ temperature: 0.8, max_tokens: 800 }),
    },
  ]).returning(['llm_input_id']);

  // Insert LLM outputs
  const [llmOutput1, llmOutput2] = await knex('llm_outputs').insert([
    {
      llm_input_id: llmInput1.llm_input_id,
      title: 'AI in Healthcare: Revolutionizing Patient Care',
      description: 'Explore how AI is transforming healthcare...',
      hashtags: '#AIinHealthcare #MedTech #FutureMedicine',
      music_title: 'Digital Healing',
      music_lyrics: 'In the realm of ones and zeros, health finds a new ally...',
      music_tags: 'electronic, ambient, hopeful',
    },
    {
      llm_input_id: llmInput2.llm_input_id,
      title: 'Introducing EcoClean: The Future of Green Cleaning',
      description: 'Discover EcoClean, the revolutionary eco-friendly cleaning solution...',
      hashtags: '#EcoClean #GreenLiving #SustainableCleaning',
      music_title: 'Fresh Start',
      music_lyrics: 'A world so clean, a future so bright...',
      music_tags: 'upbeat, positive, energetic',
    },
  ]).returning(['llm_output_id']);

  // Insert LLM scenes
  const [scene1, scene2, scene3, scene4] = await knex('llm_scenes').insert([
    {
      llm_output_id: llmOutput1.llm_output_id,
      scene_number: 1,
      description: 'A futuristic hospital room with AI-powered equipment',
      visual_prompt: 'Sleek hospital room with holographic displays and robotic assistants',
      video_prompt: 'Camera pans across the room, showcasing various AI technologies',
      camera_movement: 'pan',
    },
    {
      llm_output_id: llmOutput1.llm_output_id,
      scene_number: 2,
      description: 'AI analyzing complex medical data',
      visual_prompt: 'Abstract visualization of AI processing medical images and data',
      video_prompt: 'Zoom in on a 3D brain scan being analyzed by AI',
      camera_movement: 'zoom',
    },
    {
      llm_output_id: llmOutput2.llm_output_id,
      scene_number: 1,
      description: 'Before: A cluttered, dirty room',
      visual_prompt: 'Messy living room with stains and clutter',
      video_prompt: 'Slow pan across the messy room, highlighting problem areas',
      camera_movement: 'pan',
    },
    {
      llm_output_id: llmOutput2.llm_output_id,
      scene_number: 2,
      description: 'After: The same room, now spotlessly clean',
      visual_prompt: 'The same living room, now clean, organized, and bright',
      video_prompt: 'Quick transition to the clean room, with a sweeping camera movement',
      camera_movement: 'sweep',
    },
  ]).returning(['scene_id']);

  // Insert image outputs
  await knex('image_outputs').insert([
    {
      job_id: job1.job_id,
      scene_id: scene1.scene_id,
      original_url: 'https://example.com/original_hospital_room.png',
      image_url: 'https://example.com/ai_hospital_room.png',
      file_name: 'ai_hospital_room.png',
      metadata: JSON.stringify({ width: 1920, height: 1080, format: 'png' }),
    },
    {
      job_id: job1.job_id,
      scene_id: scene2.scene_id,
      original_url: 'https://example.com/original_brain_scan.png',
      image_url: 'https://example.com/ai_brain_scan.png',
      file_name: 'ai_brain_scan.png',
      metadata: JSON.stringify({ width: 1920, height: 1080, format: 'png' }),
    },
  ]);

  // Insert voice outputs
  await knex('voice_outputs').insert([
    {
      job_id: job1.job_id,
      scene_id: scene1.scene_id,
      voice_file_url: 'https://example.com/voice_ai_hospital.mp3',
      voice_service_id: 'elevenlabs_voice_1',
      metadata: JSON.stringify({ duration: 15.5, format: 'mp3' }),
    },
    {
      job_id: job2.job_id,
      scene_id: scene3.scene_id,
      voice_file_url: 'https://example.com/voice_ecoclean_before.mp3',
      voice_service_id: 'elevenlabs_voice_2',
      metadata: JSON.stringify({ duration: 10.2, format: 'mp3' }),
    },
  ]);

  // Insert music outputs
  await knex('music_outputs').insert([
    {
      job_id: job1.job_id,
      music_file_url: 'https://example.com/digital_healing.mp3',
      title: 'Digital Healing',
      tags: 'electronic, ambient, hopeful',
      instrumental: true,
      metadata: JSON.stringify({ duration: 60, format: 'mp3' }),
    },
    {
      job_id: job2.job_id,
      music_file_url: 'https://example.com/fresh_start.mp3',
      title: 'Fresh Start',
      tags: 'upbeat, positive, energetic',
      instrumental: true,
      metadata: JSON.stringify({ duration: 45, format: 'mp3' }),
    },
  ]);

  // Insert animation outputs
  await knex('animation_outputs').insert([
    {
      job_id: job1.job_id,
      scene_id: scene2.scene_id,
      original_pattern: '{0,0,1,0.1,0.1,1.1,0.2,0.2,1.2,...}',
      animation_file_url: 'https://example.com/brain_scan_animation.mp4',
      metadata: JSON.stringify({ duration: 10, format: 'mp4' }),
    },
    {
      job_id: job2.job_id,
      scene_id: scene4.scene_id,
      original_pattern: '{1,0,0,0.9,-0.1,0.1,0.8,-0.2,0.2,...}',
      animation_file_url: 'https://example.com/room_cleaning_animation.mp4',
      metadata: JSON.stringify({ duration: 8, format: 'mp4' }),
    },
  ]);

  // Insert video outputs
  await knex('video_outputs').insert([
    {
      job_id: job1.job_id,
      scene_id: scene1.scene_id,
      video_prompt: 'Pan across futuristic hospital room',
      camera_movement: 'pan',
      aspect_ratio: '16:9',
      video_file_url: 'https://example.com/ai_hospital_room_video.mp4',
      metadata: JSON.stringify({ duration: 15, format: 'mp4', resolution: '1920x1080' }),
    },
    {
      job_id: job2.job_id,
      scene_id: scene3.scene_id,
      video_prompt: 'Show before and after cleaning transformation',
      camera_movement: 'sweep',
      aspect_ratio: '16:9',
      video_file_url: 'https://example.com/ecoclean_transformation_video.mp4',
      metadata: JSON.stringify({ duration: 20, format: 'mp4', resolution: '1920x1080' }),
    },
  ]);
};