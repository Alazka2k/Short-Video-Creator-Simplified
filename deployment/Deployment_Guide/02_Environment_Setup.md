# Environment Setup

## Environment Variables

Create `.env.staging` in the project root:

```bash
# Application
NODE_ENV=staging
PORT=3000
API_PORT=3001

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=staging_user
DB_PASSWORD=your_secure_password
DB_NAME=short_video_creator_staging
DB_SSL=false

# Auth0
AUTH0_DOMAIN=narravid-staging.auth0.com
AUTH0_CLIENT_ID=your_frontend_client_id
AUTH0_AUDIENCE=https://api.staging.narravid.io
AUTH0_M2M_CLIENT_ID=your_m2m_client_id
AUTH0_M2M_CLIENT_SECRET=your_m2m_client_secret

# AWS S3
AWS_REGION=eu-central-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_BUCKET_NAME=short-video-creator-staging

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# URLs
FRONTEND_URL=https://staging.narravid.io
API_URL=https://api.staging.narravid.io
```

## Directory Setup
```bash
# Create application directory
mkdir -p /var/www/narravid-staging
chown -R deploy:deploy /var/www/narravid-staging

# Create log directory
mkdir -p /var/log/narravid
chown -R deploy:deploy /var/log/narravid

# Create SSL certificate directory
mkdir -p /var/www/letsencrypt
chown -R www-data:www-data /var/www/letsencrypt
```

## SSL Certificates
```bash
# Install SSL certificates
certbot --nginx -d staging.narravid.io -d api.staging.narravid.io

# Verify auto-renewal
certbot renew --dry-run
```

## Nginx Configuration
```bash
# Copy Nginx configuration
cp deployment/scripts/nginx-staging.conf /etc/nginx/sites-available/narravid-staging

# Create symbolic link
ln -s /etc/nginx/sites-available/narravid-staging /etc/nginx/sites-enabled/

# Test and reload Nginx
nginx -t && systemctl reload nginx
```

## Database Setup
```bash
# Connect to PostgreSQL
sudo -u postgres psql

# Create database and user
CREATE DATABASE short_video_creator_staging;
CREATE USER staging_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE short_video_creator_staging TO staging_user;

# Exit PostgreSQL
\q
```

## Redis Setup
```bash
# Start Redis server
systemctl start redis-server
systemctl enable redis-server

# Verify Redis is running
redis-cli ping  # Should return PONG
```

## Firewall Configuration
```bash
# Configure UFW
ufw allow 22
ufw allow 80
ufw allow 443
ufw enable

# Verify firewall status
ufw status
```

## Auth0 Configuration

1. **Create Applications**
   - Create Single Page Application for frontend
   - Create Machine to Machine application for backend
   - Configure callback URLs and allowed origins

2. **Configure Auth0 Settings**
   The project includes two important Auth0 configuration scripts:

   a. **Token and Rotation Settings** (`set-auth-config.js`):
   ```bash
   # This script configures environment-specific token settings:
   # - Staging:
   #   - Token expiration: 24 hours
   #   - Implicit flow expiration: 1 hour
   #   - Refresh token rotation: enabled
   
   # Run for staging environment
   node deployment/scripts/set-auth-config.js staging
   ```

   b. **Update Auth0 Application Settings** (`update-auth0-settings.js`):
   ```bash
   # This script updates Auth0 application settings including:
   # - Token lifetimes
   # - Refresh token configuration
   # - API permissions
   
   # Run for staging environment
   npm run deploy:auth:staging
   
   # Or directly with node
   node deployment/scripts/update-auth0-settings.js staging
   ```

   These scripts should be run:
   - During initial environment setup
   - After changing Auth0 configuration
   - When deploying major updates
   - When rotating security credentials

3. **Verify Auth0 Configuration**
```bash
# Check token configuration
curl -X GET https://staging.narravid.io/auth/verify

# Test authentication flow
curl -X POST https://staging.narravid.io/auth/login

# Verify token refresh
curl -X POST https://staging.narravid.io/auth/refresh
```

## AWS S3 Configuration

1. **Update CORS Configuration**
```bash
# Copy CORS configuration
cp deployment/config/cors-config.json .

# Update CORS settings
aws s3api put-bucket-cors --bucket short-video-creator-staging --cors-configuration file://cors-config.json
```

## Verify Setup

1. **Check Services**
```bash
# Check PostgreSQL
sudo systemctl status postgresql

# Check Redis
sudo systemctl status redis-server

# Check Nginx
sudo systemctl status nginx

# Check SSL certificates
sudo certbot certificates
```

2. **Test Connections**
```bash
# Test database connection
psql -h localhost -U staging_user -d short_video_creator_staging

# Test Redis connection
redis-cli -a your_redis_password ping

# Test frontend URL
curl -I https://staging.narravid.io

# Test API URL
curl -I https://api.staging.narravid.io
``` 