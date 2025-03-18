// knexfile.js

if (!process.env.NODE_ENV) {
  throw new Error(
    'NODE_ENV environment variable is required.\n' +
    'Please set it to one of: development, staging, production\n' +
    'Example: NODE_ENV=development npx knex migrate:latest'
  );
}

/*# For Windows PowerShell:
$env:NODE_ENV="development" ; npx knex migrate:latest

# For Windows Command Prompt:
set NODE_ENV=development && npx knex migrate:latest

# For Unix-like systems:
NODE_ENV=development npx knex migrate:latest*/

const config = require('./backend/shared/utils/config');

/**
 * @type { Object.<string, import("knex").Knex.Config> }
 */
module.exports = {
  development: {
    client: 'pg',
    connection: {
      host: config.db?.host || process.env.DB_HOST,
      user: config.db?.user || process.env.DB_USER,
      password: config.db?.password || process.env.DB_PASSWORD,
      database: config.db?.name || process.env.DB_NAME,
      port: config.db?.port || process.env.DB_PORT
    },
    migrations: {
      directory: './database/migrations',
    },
    seeds: {
      directory: './database/seeds',
    },
  },

  staging: {
    client: 'pg',
    connection: {
      host: config.db?.host || process.env.DB_HOST,
      user: config.db?.user || process.env.DB_USER,
      password: config.db?.password || process.env.DB_PASSWORD,
      database: config.db?.name || process.env.DB_NAME,
      port: config.db?.port || process.env.DB_PORT,
      ssl: { rejectUnauthorized: false }
    },
    migrations: {
      directory: './database/migrations',
    },
    seeds: {
      directory: './database/seeds',
    },
    pool: {
      min: 2,
      max: 10
    }
  },

  production: {
    client: 'pg',
    connection: {
      host: config.db?.host || process.env.DB_HOST,
      user: config.db?.user || process.env.DB_USER,
      password: config.db?.password || process.env.DB_PASSWORD,
      database: config.db?.name || process.env.DB_NAME,
      port: config.db?.port || process.env.DB_PORT,
      ssl: { rejectUnauthorized: false }
    },
    migrations: {
      directory: './database/migrations',
    },
    seeds: {
      directory: './database/seeds',
    },
    pool: {
      min: 2,
      max: 10
    }
  }
};
