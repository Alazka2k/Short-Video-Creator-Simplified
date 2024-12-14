exports.up = function(knex) {
  return knex('permissions')
    .insert([
      { name: 'read:profile', description: 'Read user profile' },
      { name: 'update:profile', description: 'Update user profile' },
      { name: 'perform:logout', description: 'Perform logout' }
    ])
    .then(() => {
      // Assign these permissions to default user role
      return knex('role_permissions')
        .insert([
          { role_id: 1, permission_id: knex('permissions').where('name', 'read:profile').select('id') },
          { role_id: 1, permission_id: knex('permissions').where('name', 'update:profile').select('id') },
          { role_id: 1, permission_id: knex('permissions').where('name', 'perform:logout').select('id') }
        ]);
    });
};

exports.down = function(knex) {
  return knex('permissions')
    .whereIn('name', ['read:profile', 'update:profile', 'perform:logout'])
    .delete();
}; 