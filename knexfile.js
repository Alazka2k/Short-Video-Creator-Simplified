// knexfile.js

require('dotenv').config();

const nodeEnv = process.env.NODE_ENV;
const envPrefix = nodeEnv.toUpperCase();

module.exports = {
  [nodeEnv]: {
    client: 'pg',
    connection: {
      host: process.env[`${envPrefix}_DB_HOST`],
      user: process.env[`${envPrefix}_DB_USER`],
      password: process.env[`${envPrefix}_DB_PASSWORD`],
      database: process.env[`${envPrefix}_DB_NAME`],
      port: process.env[`${envPrefix}_DB_PORT`]
    },
    migrations: {
      directory: './database/migrations',
    },
    seeds: {
      directory: './database/seeds',
    },
  },
};
