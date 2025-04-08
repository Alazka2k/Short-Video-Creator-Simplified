// File: database/seeds/05_batch_admin_user.js

exports.seed = async function(knex) {
  console.log('Seeding system users (API and Batch)...');
  
  // Check if the system users already exist
  const existingUsers = await knex('users')
    .whereIn('email', ['api@system.local', 'batch@system.local'])
    .select('email');
  
  const existingEmails = existingUsers.map(user => user.email);
  
  const systemUsers = [
    {
      email: 'api@system.local',
      full_name: 'API System User',
      auth0_id: 'api',
      provider: 'system'
    },
    {
      email: 'batch@system.local',
      full_name: 'Batch System User',
      auth0_id: 'batch',
      provider: 'system'
    }
  ];

  for (const userData of systemUsers) {
    if (!existingEmails.includes(userData.email)) {
      console.log(`Creating system user: ${userData.email}`);
      
      try {
        // Create the system user
        const result = await knex('users')
          .insert({
            ...userData,
            created_at: new Date(),
            updated_at: new Date(),
            last_login: new Date(),
            video_preferences: null,
            notification_settings: null,
            api_settings: null
          })
          .returning('user_id');
        
        if (!result || result.length === 0) {
          throw new Error(`Failed to create user ${userData.email}: No ID returned`);
        }
        
        const userId = result[0].user_id;
        console.log(`Created user with ID: ${userId}`);
        
        // Assign role_id 1 to the system user
        await knex('user_roles')
          .insert({
            user_id: userId,
            role_id: 1  // Using role_id 1 directly
          });
        
        console.log(`Successfully created system user: ${userData.email} with ID: ${userId} and assigned role_id 1`);
      } catch (error) {
        console.error(`Error creating system user ${userData.email}:`, error);
        throw error;
      }
    } else {
      console.log(`System user ${userData.email} already exists, skipping creation`);
    }
  }
}; 