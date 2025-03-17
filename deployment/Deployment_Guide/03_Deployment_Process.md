# Deployment Process

## Initial Deployment

### 1. Connect to Server
```bash
# SSH into the server
ssh deploy@YOUR_SERVER_IP
```

### 2. Repository Setup (First Time)
```bash
# Navigate to application directory
cd /var/www/narravid-staging

# Clone the repository
git clone https://github.com/your-repo/Short-Video-Creator-Simplified.git .

# Switch to staging branch
git checkout staging
git pull origin staging
```

### 3. Environment Setup
```bash
# Copy staging environment file
cp .env.staging .env

# Update environment variables with your values
nano .env
```

### 4. Dependencies Installation
```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### 5. Database Setup
```bash
# Run migrations
npm run migrate:staging

# Run seeds if needed
npm run seed:staging
```

### 5. Auth0 Configuration
```bash
# Configure Auth0 token settings
node deployment/scripts/set-auth-config.js staging

# Update Auth0 application settings
npm run deploy:auth:staging

# Verify configuration
curl -X GET https://staging.narravid.io/auth/verify
```

### 6. Service Configuration
```bash
# Copy PM2 ecosystem file
cp deployment/scripts/ecosystem.config.js .

# Start services
pm2 start ecosystem.config.js --env staging

# Save PM2 process list
pm2 save

# Setup PM2 to start on system boot
pm2 startup
```

## Regular Deployment

### 1. Pull Latest Changes
```bash
cd /var/www/narravid-staging
git checkout staging
git pull origin staging
```

### 2. Update Dependencies
```bash
# Update root dependencies
npm install

# Update frontend dependencies
cd frontend
npm install
cd ..
```

### 3. Update Auth0 Settings (if needed)
```bash
# Only run these if Auth0 configuration has changed
node deployment/scripts/set-auth-config.js staging
npm run deploy:auth:staging
```

### 4. Build Frontend
```bash
cd frontend
npm run build
cd ..
```

### 5. Database Updates
```bash
# Run any new migrations
npm run migrate:staging
```

### 6. Restart Services
```bash
# Reload PM2 processes
pm2 reload ecosystem.config.js --env staging
```

### 7. Verify Deployment
```bash
# Check frontend health
curl -I https://staging.narravid.io/health

# Check API health
curl -I https://api.staging.narravid.io/health

# Check PM2 status
pm2 status
```

## Automated Deployment

You can use the automated deployment script:

```bash
# Make the script executable
chmod +x deployment/scripts/deploy-staging.sh

# Run deployment
sudo deployment/scripts/deploy-staging.sh
```

## Rollback Process

If deployment fails, follow these steps:

1. **Revert Git Changes**
```bash
git reset --hard HEAD^
git checkout staging
```

2. **Revert Database**
```bash
# Rollback last migration
npm run migrate:rollback --env staging
```

3. **Restart Services**
```bash
pm2 reload ecosystem.config.js --env staging
```

4. **Verify System Status**
```bash
# Check services
pm2 status

# Check logs
pm2 logs

# Check frontend and API health
curl -I https://staging.narravid.io/health
curl -I https://api.staging.narravid.io/health
```

## Monitoring Deployment
```bash
# View PM2 logs
pm2 logs

# Monitor processes
pm2 monit

# Check Nginx access logs
tail -f /var/log/nginx/access.log

# Check application logs
tail -f /var/log/narravid/*.log

# Monitor system resources
htop
``` 