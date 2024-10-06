// database/migrations/YYYYMMDDHHMMSS_initial_schema.js

exports.up = function (knex) {
    return knex.schema
  
      // 1. Core Tables
      .createTable('users', function (table) {
        table.increments('user_id').primary();
        table.string('first_name', 50).notNullable();
        table.string('last_name', 50).notNullable();
        table.string('email', 255).unique().notNullable();
        table.string('password_hash', 255).notNullable();
        table.timestamps(true, true); // Adds created_at and updated_at columns
      })
  
      .createTable('roles', function (table) {
        table.increments('role_id').primary();
        table.string('role_name', 50).unique().notNullable();
        table.text('description');
      })
  
      .createTable('user_roles', function (table) {
        table.integer('user_id').unsigned().notNullable();
        table.integer('role_id').unsigned().notNullable();
        table.primary(['user_id', 'role_id']);
        table
          .foreign('user_id')
          .references('user_id')
          .inTable('users')
          .onDelete('CASCADE');
        table
          .foreign('role_id')
          .references('role_id')
          .inTable('roles')
          .onDelete('CASCADE');
      })
  
      // 2. Jobs Table
      .createTable('jobs', function (table) {
        table.increments('job_id').primary();
        table.integer('user_id').unsigned().references('user_id').inTable('users').onDelete('CASCADE');
        table.timestamps(true, true);
        table.string('status', 20).notNullable().checkIn(['pending', 'in_progress', 'completed', 'failed']);
        table.jsonb('service_sequence');
        table.jsonb('metadata');
      })
  
      // 3. Billing and Payment Tables
      .createTable('plans', function (table) {
        table.increments('plan_id').primary();
        table.string('plan_name', 100).unique().notNullable();
        table.integer('monthly_token_allocation').notNullable();
        table.decimal('price', 10, 2).notNullable();
        table.text('description');
      })
  
      .createTable('user_subscriptions', function (table) {
        table.increments('subscription_id').primary();
        table
          .integer('user_id')
          .unsigned()
          .references('user_id')
          .inTable('users')
          .onDelete('CASCADE');
        table
          .integer('plan_id')
          .unsigned()
          .references('plan_id')
          .inTable('plans');
        table.date('start_date').notNullable();
        table.date('end_date');
        table
          .string('status', 20)
          .notNullable()
          .checkIn(['active', 'canceled']);
        table.timestamps(true, true);
      })
  
      .createTable('tokens', function (table) {
        table.increments('token_id').primary();
        table
          .integer('user_id')
          .unsigned()
          .unique()
          .references('user_id')
          .inTable('users')
          .onDelete('CASCADE');
        table.integer('balance').notNullable().defaultTo(0);
        table.timestamp('last_updated').defaultTo(knex.fn.now());
      })
  
      .createTable('token_transactions', function (table) {
        table.increments('transaction_id').primary();
        table
          .integer('user_id')
          .unsigned()
          .references('user_id')
          .inTable('users')
          .onDelete('CASCADE');
        table
          .string('transaction_type', 20)
          .notNullable()
          .checkIn(['allocation', 'deduction', 'purchase']);
        table.integer('amount').notNullable();
        table.timestamp('transaction_date').defaultTo(knex.fn.now());
        table
          .integer('job_id')
          .unsigned()
          .references('job_id')
          .inTable('jobs');
      })
  
      .createTable('payments', function (table) {
        table.increments('payment_id').primary();
        table
          .integer('user_id')
          .unsigned()
          .references('user_id')
          .inTable('users')
          .onDelete('CASCADE');
        table.decimal('amount', 10, 2).notNullable();
        table.string('currency', 10).notNullable();
        table.string('payment_method', 100).notNullable();
        table.timestamp('payment_date').defaultTo(knex.fn.now());
        table
          .string('status', 20)
          .notNullable()
          .checkIn(['pending', 'completed', 'failed']);
      })
  
      // 4. Service-Specific Tables
      // LLM Service Tables
      .createTable('llm_inputs', function (table) {
        table.increments('llm_input_id').primary();
        table
          .integer('job_id')
          .unsigned()
          .references('job_id')
          .inTable('jobs')
          .onDelete('CASCADE');
        table.text('prompt').notNullable();
        table.jsonb('parameters');
        table.timestamp('created_at').defaultTo(knex.fn.now());
      })
  
      .createTable('llm_outputs', function (table) {
        table.increments('llm_output_id').primary();
        table
          .integer('llm_input_id')
          .unsigned()
          .references('llm_input_id')
          .inTable('llm_inputs')
          .onDelete('CASCADE');
        table
          .integer('job_id')
          .unsigned()
          .references('job_id')
          .inTable('jobs')
          .onDelete('CASCADE');
        table.string('title', 255);
        table.text('description');
        table.string('hashtags', 255);
        table.string('music_title', 255);
        table.text('music_lyrics');
        table.string('music_tags', 255);
        table.timestamp('created_at').defaultTo(knex.fn.now());
      })
  
      .createTable('llm_scenes', function (table) {
        table.increments('scene_id').primary();
        table
          .integer('llm_output_id')
          .unsigned()
          .references('llm_output_id')
          .inTable('llm_outputs')
          .onDelete('CASCADE');
        table.integer('scene_number').notNullable();
        table.text('description');
        table.text('visual_prompt');
        table.text('video_prompt');
        table.string('camera_movement', 100);
        table.timestamp('created_at').defaultTo(knex.fn.now());
      })
  
      // Image Service Tables
      .createTable('image_outputs', function (table) {
        table.increments('image_id').primary();
        table
          .integer('job_id')
          .unsigned()
          .references('job_id')
          .inTable('jobs')
          .onDelete('CASCADE');
        table
          .integer('scene_id')
          .unsigned()
          .references('scene_id')
          .inTable('llm_scenes')
          .onDelete('CASCADE');
        table.text('original_url');
        table.text('image_url');
        table.string('file_name', 255);
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.jsonb('metadata');
      })
  
      // Voice Service Tables
      .createTable('voice_outputs', function (table) {
        table.increments('voice_id').primary();
        table
          .integer('job_id')
          .unsigned()
          .references('job_id')
          .inTable('jobs')
          .onDelete('CASCADE');
        table
          .integer('scene_id')
          .unsigned()
          .references('scene_id')
          .inTable('llm_scenes')
          .onDelete('CASCADE');
        table.text('voice_file_url');
        table.string('voice_service_id', 255);
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.jsonb('metadata');
      })
  
      // Music Service Tables
      .createTable('music_outputs', function (table) {
        table.increments('music_output_id').primary();
        table
          .integer('job_id')
          .unsigned()
          .references('job_id')
          .inTable('jobs')
          .onDelete('CASCADE');
        table.text('music_file_url');
        table.string('title', 255);
        table.string('tags', 255);
        table.boolean('instrumental');
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.jsonb('metadata');
      })
  
      // Animation Service Tables
      .createTable('animation_outputs', function (table) {
        table.increments('animation_id').primary();
        table
          .integer('job_id')
          .unsigned()
          .references('job_id')
          .inTable('jobs')
          .onDelete('CASCADE');
        table
          .integer('scene_id')
          .unsigned()
          .references('scene_id')
          .inTable('llm_scenes')
          .onDelete('CASCADE');
        table.text('original_pattern');
        table.text('animation_file_url');
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.jsonb('metadata');
      })
  
      // Video Service Tables
      .createTable('video_outputs', function (table) {
        table.increments('video_id').primary();
        table
          .integer('job_id')
          .unsigned()
          .references('job_id')
          .inTable('jobs')
          .onDelete('CASCADE');
        table
          .integer('scene_id')
          .unsigned()
          .references('scene_id')
          .inTable('llm_scenes')
          .onDelete('CASCADE');
        table.text('video_prompt');
        table.string('camera_movement', 100);
        table.string('aspect_ratio', 10);
        table.text('video_file_url');
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.jsonb('metadata');
      });
  };
  
  exports.down = function (knex) {
    return knex.schema
      // Drop tables in reverse order
      .dropTableIfExists('video_outputs')
      .dropTableIfExists('animation_outputs')
      .dropTableIfExists('music_outputs')
      .dropTableIfExists('voice_outputs')
      .dropTableIfExists('image_outputs')
      .dropTableIfExists('llm_scenes')
      .dropTableIfExists('llm_outputs')
      .dropTableIfExists('llm_inputs')
      .dropTableIfExists('payments')
      .dropTableIfExists('token_transactions')
      .dropTableIfExists('tokens')
      .dropTableIfExists('user_subscriptions')
      .dropTableIfExists('plans')
      .dropTableIfExists('jobs')
      .dropTableIfExists('user_roles')
      .dropTableIfExists('roles')
      .dropTableIfExists('users');
  };
  