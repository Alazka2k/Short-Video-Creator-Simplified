exports.seed = async function(knex) {
  // Clear existing entries
  await knex('role_permissions').del();
  await knex('permissions').del();

  // Get existing roles and their IDs
  const roles = await knex('roles').select('role_id', 'role_name as name');
  const freeRole = roles.find(r => r.name === 'free');
  const proRole = roles.find(r => r.name === 'pro');
  const enterpriseRole = roles.find(r => r.name === 'enterprise');

  if (!freeRole || !proRole || !enterpriseRole) {
    throw new Error('Required roles not found in database');
  }

  // Insert permissions
  const permissions = await knex('permissions').insert([
    { 
      name: 'create_video',
      description: 'Create new videos',
      resource_type: 'videos',
      action: 'create'
    },
    { 
      name: 'use_templates',
      description: 'Use premium templates',
      resource_type: 'templates',
      action: 'use'
    },
    { 
      name: 'api_access',
      description: 'Access API endpoints',
      resource_type: 'api',
      action: 'access'
    }
  ]).returning('id');

  // Assign permissions to roles
  await knex('role_permissions').insert([
    // Free tier permissions
    { role_id: freeRole.role_id, permission_id: permissions[0].id },
    
    // Pro tier permissions
    { role_id: proRole.role_id, permission_id: permissions[0].id },
    { role_id: proRole.role_id, permission_id: permissions[1].id },
    
    // Enterprise tier permissions
    { role_id: enterpriseRole.role_id, permission_id: permissions[0].id },
    { role_id: enterpriseRole.role_id, permission_id: permissions[1].id },
    { role_id: enterpriseRole.role_id, permission_id: permissions[2].id }
  ]);
}; 