exports.up = async function(knex) {
  // Add default role if not exists
  const roleExists = await knex('roles').where('role_id', 1).first();
  if (!roleExists) {
    await knex('roles').insert({
      role_id: 1,
      role_name: 'user',
      description: 'Default user role'
    });
  }

  // Add default plan if not exists
  const planExists = await knex('plans').where('plan_id', 1).first();
  if (!planExists) {
    await knex('plans').insert({
      plan_id: 1,
      name: 'Free Trial',
      description: 'Free 30-day trial',
      monthly_video_limit: 10,
      price: 0
    });
  }
};

exports.down = function(knex) {
  return knex.schema
    .raw('DELETE FROM roles WHERE role_id = 1')
    .raw('DELETE FROM plans WHERE plan_id = 1');
}; 