module.exports = {
  apps: [
    {
      name: 'narravid-api-staging',
      script: 'backend/src/server.js',
      instances: 2,
      exec_mode: 'cluster',
      watch: false,
      env_staging: {
        NODE_ENV: 'staging',
        PORT: 3000,
        // Other environment variables will be loaded from .env.staging
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        // Other environment variables will be loaded from .env.production
      },
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: '/var/log/narravid/api-error.log',
      out_file: '/var/log/narravid/api-out.log',
      max_memory_restart: '1G',
      exp_backoff_restart_delay: 100,
      time: true
    },
    {
      name: 'narravid-worker-staging',
      script: 'backend/src/worker.js',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      env_staging: {
        NODE_ENV: 'staging',
        // Other environment variables will be loaded from .env.staging
      },
      env_production: {
        NODE_ENV: 'production',
        // Other environment variables will be loaded from .env.production
      },
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: '/var/log/narravid/worker-error.log',
      out_file: '/var/log/narravid/worker-out.log',
      max_memory_restart: '2G',
      exp_backoff_restart_delay: 100,
      time: true
    },
    {
      name: 'narravid-scheduler-staging',
      script: 'backend/src/scheduler.js',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      env_staging: {
        NODE_ENV: 'staging',
        // Other environment variables will be loaded from .env.staging
      },
      env_production: {
        NODE_ENV: 'production',
        // Other environment variables will be loaded from .env.production
      },
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: '/var/log/narravid/scheduler-error.log',
      out_file: '/var/log/narravid/scheduler-out.log',
      max_memory_restart: '500M',
      exp_backoff_restart_delay: 100,
      time: true
    }
  ]
}; 