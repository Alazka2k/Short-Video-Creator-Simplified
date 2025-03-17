#!/bin/bash

# Exit on error
set -e

# Load environment variables
source .env.staging

# Configuration
APP_DIR="/var/www/narravid-staging"
FRONTEND_DIR="$APP_DIR/frontend"
BACKEND_DIR="$APP_DIR/backend"
LOG_FILE="/var/log/narravid/deploy-staging.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# Logging function
log() {
    echo "[$TIMESTAMP] $1" | tee -a "$LOG_FILE"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    log "Please run as root"
    exit 1
fi

# Create log directory if it doesn't exist
mkdir -p /var/log/narravid

# 1. Update system packages
log "Updating system packages..."
apt-get update && apt-get upgrade -y

# 2. Pull latest changes
log "Pulling latest changes..."
cd "$APP_DIR"
git checkout staging
git pull origin staging

# 3. Frontend deployment
log "Deploying frontend..."
cd "$FRONTEND_DIR"
log "Installing frontend dependencies..."
npm ci
log "Building frontend..."
npm run build
log "Clearing frontend cache..."
rm -rf .cache

# 4. Backend deployment
log "Deploying backend..."
cd "$BACKEND_DIR"
log "Installing backend dependencies..."
npm ci
log "Running database migrations..."
npx knex migrate:latest --env staging
log "Running database seeds if needed..."
if [ -f "seeds/staging-seed.js" ]; then
    npx knex seed:run --env staging
fi

# 5. Update Auth0 settings
log "Updating Auth0 settings..."
node scripts/update-auth0-settings.js --env staging
node scripts/set-auth-config.js --env staging

# 6. Update PM2 processes
log "Updating PM2 processes..."
pm2 reload ecosystem.config.js --env staging

# 7. Verify Nginx configuration
log "Verifying Nginx configuration..."
nginx -t
if [ $? -eq 0 ]; then
    log "Reloading Nginx..."
    systemctl reload nginx
else
    log "Nginx configuration test failed!"
    exit 1
fi

# 8. Clear application cache
log "Clearing application cache..."
redis-cli flushall

# 9. Verify deployment
log "Verifying deployment..."
# Check frontend
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://staging.narravid.io/health)
if [ $FRONTEND_STATUS -eq 200 ]; then
    log "Frontend is running successfully"
else
    log "Frontend verification failed with status $FRONTEND_STATUS"
    exit 1
fi

# Check backend
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://api.staging.narravid.io/health)
if [ $API_STATUS -eq 200 ]; then
    log "Backend API is running successfully"
else
    log "Backend API verification failed with status $API_STATUS"
    exit 1
fi

log "Deployment completed successfully!"

# Optional: Send notification
if [ -n "$SLACK_WEBHOOK_URL" ]; then
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"🚀 Staging deployment completed successfully at $TIMESTAMP\"}" \
        "$SLACK_WEBHOOK_URL"
fi 