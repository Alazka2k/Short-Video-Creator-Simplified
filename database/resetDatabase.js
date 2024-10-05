// resetDatabase.js

const { exec } = require('child_process');
const prompt = require('prompt');
require('dotenv').config();
const path = require('path');

const nodeEnv = process.env.NODE_ENV || 'development';
console.log(`Environment: ${nodeEnv}`);

const envPrefix = nodeEnv.toUpperCase();

const dbName = process.env[`${envPrefix}_DB_NAME`];
const dbUser = process.env[`${envPrefix}_DB_USER`];
const dbPassword = process.env[`${envPrefix}_DB_PASSWORD`];
const dbHost = process.env[`${envPrefix}_DB_HOST`] || '127.0.0.1';
const dbPort = process.env[`${envPrefix}_DB_PORT`] || '5432';

prompt.start();

prompt.get(
  {
    name: 'confirm',
    description: `This will DROP the "${dbName}" database in the "${nodeEnv}" environment. Are you sure you want to proceed? (yes/no)`,
    required: true,
    pattern: /^(yes|no)$/i,
    message: 'Please enter "yes" or "no"',
  },
  async function (err, result) {
    if (err) {
      console.error('Prompt failed:', err);
      process.exit(1);
    }

    if (result.confirm.toLowerCase() !== 'yes') {
      console.log('Operation cancelled.');
      process.exit(0);
    }

    // Proceed with resetting the database
    (async () => {
      try {
        console.log(`Terminating all connections to "${dbName}"...`);
        await executeCommand(
          `psql -U ${dbUser} -h ${dbHost} -p ${dbPort} -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${dbName}' AND pid <> pg_backend_pid();"`
        );

        console.log(`Dropping database "${dbName}"...`);
        await executeCommand(`dropdb -U ${dbUser} -h ${dbHost} -p ${dbPort} ${dbName}`);

        console.log(`Creating database "${dbName}"...`);
        await executeCommand(`createdb -U ${dbUser} -h ${dbHost} -p ${dbPort} ${dbName}`);

        console.log('Running migrations...');
        await executeCommand(`npx knex migrate:latest --env ${nodeEnv}`);

        // Only run seeds in the development environment
        if (nodeEnv === 'development') {
          console.log('Running seeds...');
          await executeCommand(`npx knex seed:run --env ${nodeEnv}`);
        } else {
          console.log(`Skipping seed files in the "${nodeEnv}" environment.`);
        }

        console.log('Database reset successful.');
      } catch (error) {
        console.error('Error resetting the database:', error);
      }
    })();
  }
);

// Function to execute shell commands
function executeCommand(command) {
  return new Promise((resolve, reject) => {
    exec(
      command,
      { env: { ...process.env, PGPASSWORD: dbPassword } },
      (error, stdout, stderr) => {
        if (error) {
          console.error(`Error executing command: ${command}`);
          console.error(stderr);
          reject(error);
        } else {
          console.log(stdout);
          resolve(stdout);
        }
      }
    );
  });
}
