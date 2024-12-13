exports.up = function(knex) {
  return Promise.all([
    knex.schema.hasTable('roles').then(exists => {
      if (!exists) {
        return knex.schema.createTable('roles', table => {
          table.increments('role_id').primary();
          table.string('role_name').notNullable().unique();
          table.text('description');
          table.timestamps(true, true);
        });
      }
    }),
    knex.schema.hasTable('permissions').then(exists => {
      if (!exists) {
        return knex.schema.createTable('permissions', table => {
          table.increments('id').primary();
          table.string('name').notNullable().unique();
          table.string('description');
          table.string('resource_type');
          table.string('action');
          table.timestamps(true, true);
        });
      }
    }),
    knex.schema.hasTable('role_permissions').then(exists => {
      if (!exists) {
        return knex.schema.createTable('role_permissions', table => {
          table.integer('role_id').references('role_id').inTable('roles');
          table.integer('permission_id').references('id').inTable('permissions');
          table.primary(['role_id', 'permission_id']);
        });
      }
    }),
    knex.schema.hasTable('user_roles').then(exists => {
      if (!exists) {
        return knex.schema.createTable('user_roles', table => {
          table.integer('user_id').references('id').inTable('users');
          table.integer('role_id').references('role_id').inTable('roles');
          table.primary(['user_id', 'role_id']);
          table.timestamps(true, true);
        });
      }
    })
  ]);
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('user_roles')
    .dropTableIfExists('role_permissions')
    .dropTableIfExists('permissions')
    .dropTableIfExists('roles');
}; 