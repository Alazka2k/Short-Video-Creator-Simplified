# Environment Configuration Guide

## Overview

This document details all environment variables, configuration settings, and deployment requirements for the JWT with Custom Claims authentication migration.

## Production Environment

### Domain Configuration
- **Frontend Domain**: `narravid.io`
- **API Domain**: `narravid.io/api` (same domain)
- **Auth0 Domain**: `[your-tenant].auth0.com`
- **Protocol**: HTTPS (required for production)

## Environment Variables

### Auth0 Configuration

#### Frontend (.env.local)
```bash
# Auth0 SPA Configuration
NEXT_PUBLIC_AUTH0_DOMAIN=[your-tenant].auth0.com
NEXT_PUBLIC_AUTH0_CLIENT_ID=[your-spa-client-id]
NEXT_PUBLIC_AUTH0_AUDIENCE=https://narravid.io/api
NEXT_PUBLIC_AUTH0_REDIRECT_URI=https://narravid.io
NEXT_PUBLIC_AUTH0_SCOPE="openid profile email"

# Custom Claims Configuration
NEXT_PUBLIC_CUSTOM_CLAIMS_NAMESPACE=https://short-video-creator.com/

# API Configuration
NEXT_PUBLIC_API_BASE_URL=https://narravid.io/api
```

#### Backend Services (.env)
```bash
# Auth0 API Configuration
AUTH0_DOMAIN=[your-tenant].auth0.com
AUTH0_AUDIENCE=https://narravid.io/api
AUTH0_ISSUER=https://[your-tenant].auth0.com/
AUTH0_ALGORITHMS=RS256

# Custom Claims Configuration
CUSTOM_CLAIMS_NAMESPACE=https://short-video-creator.com/

# M2M Application (for Action calls)
AUTH0_M2M_CLIENT_ID=[your-m2m-client-id]
AUTH0_M2M_CLIENT_SECRET=[your-m2m-client-secret]
AUTH0_M2M_AUDIENCE=https://narravid.io/api

# Service Authentication
SERVICE_AUTH_TOKEN=[your-service-auth-token]
JWT_SECRET=[your-jwt-secret]

# Database Configuration
DATABASE_URL=postgresql://user:password@host:port/database
DATABASE_SSL=true

# Redis Configuration (for caching)
REDIS_URL=redis://host:port
REDIS_PASSWORD=[your-redis-password]

# Application URLs
FRONTEND_URL=https://narravid.io
BACKEND_URL=https://narravid.io/api
```

### Auth0 Action Secrets

Configure these in Auth0 Dashboard → Actions → Your Action → Secrets:

```bash
# Backend API Configuration
BACKEND_URL=https://narravid.io/api
BACKEND_M2M_TOKEN=[your-m2m-token-for-actions]
SERVICE_AUTH_TOKEN=[your-service-auth-token]

# Optional: Additional Configuration
API_TIMEOUT=5000
MAX_RETRIES=3
ENABLE_LOGGING=true
```

### Microservices Configuration

#### API Gateway (.env)
```bash
# Service URLs
AUTH_SERVICE_URL=http://localhost:3001
SUBSCRIPTION_SERVICE_URL=http://localhost:3002
JOB_SERVICE_URL=http://localhost:3003
ASSEMBLY_SERVICE_URL=http://localhost:3004

# Auth0 Configuration
AUTH0_DOMAIN=[your-tenant].auth0.com
AUTH0_AUDIENCE=https://narravid.io/api
CUSTOM_CLAIMS_NAMESPACE=https://short-video-creator.com/

# Port Configuration
PORT=3000
NODE_ENV=production

# CORS Configuration
ALLOWED_ORIGINS=https://narravid.io
CORS_CREDENTIALS=true

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

#### Auth Service (.env)
```bash
# Database Configuration
DATABASE_URL=postgresql://user:password@host:port/auth_db

# Auth0 Configuration
AUTH0_DOMAIN=[your-tenant].auth0.com
AUTH0_M2M_CLIENT_ID=[your-m2m-client-id]
AUTH0_M2M_CLIENT_SECRET=[your-m2m-client-secret]
AUTH0_AUDIENCE=https://narravid.io/api

# JWT Configuration
JWT_SECRET=[your-jwt-secret]
JWT_EXPIRATION=1h
REFRESH_TOKEN_EXPIRATION=7d

# Service Configuration
PORT=3001
SERVICE_NAME=auth-service
```

#### Subscription Service (.env)
```bash
# Database Configuration
DATABASE_URL=postgresql://user:password@host:port/subscription_db

# Stripe Configuration
STRIPE_SECRET_KEY=[your-stripe-secret-key]
STRIPE_WEBHOOK_SECRET=[your-stripe-webhook-secret]
STRIPE_PUBLISHABLE_KEY=[your-stripe-publishable-key]

# Auth Configuration
AUTH0_DOMAIN=[your-tenant].auth0.com
AUTH0_AUDIENCE=https://narravid.io/api
CUSTOM_CLAIMS_NAMESPACE=https://short-video-creator.com/

# Service Configuration
PORT=3002
SERVICE_NAME=subscription-service
```

## Configuration Files

### Auth0 SPA Application Configuration

```json
{
  "name": "Narravid Frontend",
  "description": "Short Video Creator Frontend Application",
  "app_type": "spa",
  "callbacks": [
    "https://narravid.io",
    "https://narravid.io/dashboard",
    "http://localhost:3000"
  ],
  "allowed_logout_urls": [
    "https://narravid.io",
    "http://localhost:3000"
  ],
  "allowed_origins": [
    "https://narravid.io",
    "http://localhost:3000"
  ],
  "web_origins": [
    "https://narravid.io",
    "http://localhost:3000"
  ],
  "grant_types": [
    "authorization_code",
    "implicit",
    "refresh_token"
  ],
  "token_endpoint_auth_method": "none"
}
```

### Auth0 M2M Application Configuration

```json
{
  "name": "Narravid Backend API",
  "description": "Machine-to-Machine app for backend services",
  "app_type": "non_interactive",
  "grant_types": [
    "client_credentials"
  ],
  "token_endpoint_auth_method": "client_secret_post"
}
```

### Auth0 API Configuration

```json
{
  "name": "Narravid API",
  "identifier": "https://narravid.io/api",
  "signing_alg": "RS256",
  "scopes": [
    {
      "value": "read:users",
      "description": "Read user information"
    },
    {
      "value": "create:users", 
      "description": "Create new users"
    },
    {
      "value": "update:users",
      "description": "Update user information"
    },
    {
      "value": "manage:subscriptions",
      "description": "Manage user subscriptions"
    },
    {
      "value": "manage:tokens",
      "description": "Manage user tokens"
    }
  ]
}
```

## Docker Configuration

### Frontend Dockerfile.env
```dockerfile
# Build-time environment variables
ARG NEXT_PUBLIC_AUTH0_DOMAIN
ARG NEXT_PUBLIC_AUTH0_CLIENT_ID
ARG NEXT_PUBLIC_AUTH0_AUDIENCE
ARG NEXT_PUBLIC_API_BASE_URL
ARG NEXT_PUBLIC_CUSTOM_CLAIMS_NAMESPACE

# Set environment variables
ENV NEXT_PUBLIC_AUTH0_DOMAIN=$NEXT_PUBLIC_AUTH0_DOMAIN
ENV NEXT_PUBLIC_AUTH0_CLIENT_ID=$NEXT_PUBLIC_AUTH0_CLIENT_ID
ENV NEXT_PUBLIC_AUTH0_AUDIENCE=$NEXT_PUBLIC_AUTH0_AUDIENCE
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_CUSTOM_CLAIMS_NAMESPACE=$NEXT_PUBLIC_CUSTOM_CLAIMS_NAMESPACE
```

### Backend docker-compose.yml
```yaml
version: '3.8'

services:
  api-gateway:
    environment:
      - AUTH0_DOMAIN=${AUTH0_DOMAIN}
      - AUTH0_AUDIENCE=${AUTH0_AUDIENCE}
      - CUSTOM_CLAIMS_NAMESPACE=${CUSTOM_CLAIMS_NAMESPACE}
      - SERVICE_AUTH_TOKEN=${SERVICE_AUTH_TOKEN}
      - DATABASE_URL=${DATABASE_URL}
    ports:
      - "3000:3000"
    
  auth-service:
    environment:
      - AUTH0_DOMAIN=${AUTH0_DOMAIN}
      - AUTH0_M2M_CLIENT_ID=${AUTH0_M2M_CLIENT_ID}
      - AUTH0_M2M_CLIENT_SECRET=${AUTH0_M2M_CLIENT_SECRET}
      - JWT_SECRET=${JWT_SECRET}
      - DATABASE_URL=${AUTH_DATABASE_URL}
    ports:
      - "3001:3001"
      
  subscription-service:
    environment:
      - AUTH0_DOMAIN=${AUTH0_DOMAIN}
      - AUTH0_AUDIENCE=${AUTH0_AUDIENCE}
      - CUSTOM_CLAIMS_NAMESPACE=${CUSTOM_CLAIMS_NAMESPACE}
      - STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}
      - DATABASE_URL=${SUBSCRIPTION_DATABASE_URL}
    ports:
      - "3002:3002"
```

## Nginx Configuration

### nginx.conf (Production)
```nginx
server {
    listen 443 ssl http2;
    server_name narravid.io;
    
    # SSL Configuration
    ssl_certificate /path/to/ssl/cert.pem;
    ssl_certificate_key /path/to/ssl/key.pem;
    
    # Frontend
    location / {
        proxy_pass http://frontend:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # API Gateway
    location /api/ {
        proxy_pass http://api-gateway:3000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # CORS Headers
        add_header Access-Control-Allow-Origin "https://narravid.io" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Authorization, Content-Type, x-user-token" always;
        add_header Access-Control-Allow-Credentials true always;
        
        # Handle preflight requests
        if ($request_method = 'OPTIONS') {
            return 204;
        }
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name narravid.io;
    return 301 https://$server_name$request_uri;
}
```

## Database Configuration

### PostgreSQL Configuration

#### Connection String Format
```bash
# Production
DATABASE_URL=postgresql://username:password@host:5432/database_name?ssl=true&sslmode=require

# Local Development
DATABASE_URL=postgresql://username:password@localhost:5432/database_name
```

#### Required Database Settings
```sql
-- Connection settings
max_connections = 100
shared_buffers = 256MB
effective_cache_size = 1GB

-- SSL settings (production)
ssl = on
ssl_cert_file = 'server.crt'
ssl_key_file = 'server.key'

-- Logging
log_statement = 'mod'
log_duration = on
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d '
```

## SSL/TLS Configuration

### Let's Encrypt (Recommended for Production)
```bash
# Install certbot
sudo apt-get install certbot python3-certbot-nginx

# Generate certificate
sudo certbot --nginx -d narravid.io

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### SSL Configuration Checklist
- [ ] SSL certificate valid and not expired
- [ ] HTTPS redirect configured
- [ ] HSTS headers enabled
- [ ] TLS 1.2+ only
- [ ] Strong cipher suites configured

## Monitoring Configuration

### Environment Variables for Monitoring
```bash
# Logging Configuration
LOG_LEVEL=info
LOG_FORMAT=json
LOG_DESTINATION=file

# Metrics Configuration
ENABLE_METRICS=true
METRICS_PORT=9090
METRICS_PATH=/metrics

# Health Check Configuration
HEALTH_CHECK_PATH=/health
HEALTH_CHECK_TIMEOUT=5000

# Error Tracking
SENTRY_DSN=[your-sentry-dsn]
SENTRY_ENVIRONMENT=production
```

### Log Aggregation
```yaml
# Fluentd configuration for log aggregation
apiVersion: v1
kind: ConfigMap
metadata:
  name: fluentd-config
data:
  fluent.conf: |
    <source>
      @type tail
      path /var/log/containers/*.log
      pos_file /var/log/fluentd-containers.log.pos
      tag kubernetes.*
      format json
    </source>
    
    <filter kubernetes.**>
      @type kubernetes_metadata
    </filter>
    
    <match **>
      @type elasticsearch
      host elasticsearch
      port 9200
      index_name narravid-logs
    </match>
```

## Security Configuration

### Security Headers
```nginx
# Security headers in Nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.auth0.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://[your-tenant].auth0.com https://narravid.io;" always;
```

### Rate Limiting
```bash
# API Gateway rate limiting
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100  # 100 requests per window
RATE_LIMIT_SKIP_SUCCESSFUL=false
RATE_LIMIT_HEADERS=true
```

## Deployment Configuration

### CI/CD Environment Variables
```bash
# GitHub Actions / GitLab CI
AUTH0_DOMAIN_PROD=[your-tenant].auth0.com
AUTH0_CLIENT_ID_PROD=[your-spa-client-id]
AUTH0_AUDIENCE_PROD=https://narravid.io/api
DATABASE_URL_PROD=[your-production-db-url]
STRIPE_SECRET_KEY_PROD=[your-stripe-secret-key]

# Development
AUTH0_DOMAIN_DEV=[your-dev-tenant].auth0.com
AUTH0_CLIENT_ID_DEV=[your-dev-spa-client-id]
AUTH0_AUDIENCE_DEV=https://dev.narravid.io/api
```

### Feature Flags
```bash
# Feature toggles for gradual rollout
ENABLE_CUSTOM_CLAIMS=true
ENABLE_NEW_AUTH_MIDDLEWARE=true
ENABLE_JWT_VALIDATION=true
ROLLBACK_TO_OLD_AUTH=false

# A/B Testing
AUTH_MIGRATION_PERCENTAGE=100  # 0-100
```

## Backup Configuration

### Database Backup
```bash
# Automated backup script
#!/bin/bash
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump $DATABASE_URL > $BACKUP_DIR/narravid_backup_$DATE.sql
```

### Configuration Backup
```bash
# Backup environment files
tar -czf config_backup_$(date +%Y%m%d).tar.gz \
  .env \
  docker-compose.yml \
  nginx.conf \
  auth0-config.json
```

## Testing Configuration

### Test Environment Variables
```bash
# Test environment
NODE_ENV=test
AUTH0_DOMAIN=test-tenant.auth0.com
AUTH0_CLIENT_ID=test-client-id
DATABASE_URL=postgresql://test:test@localhost:5432/test_db

# Mock configuration
MOCK_AUTH0=true
MOCK_STRIPE=true
MOCK_EXTERNAL_APIS=true
```

## Configuration Validation

### Startup Validation Script
```javascript
// config-validator.js
const requiredEnvVars = [
  'AUTH0_DOMAIN',
  'AUTH0_AUDIENCE',
  'CUSTOM_CLAIMS_NAMESPACE',
  'DATABASE_URL',
  'SERVICE_AUTH_TOKEN'
];

requiredEnvVars.forEach(envVar => {
  if (!process.env[envVar]) {
    console.error(`Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
});

console.log('✅ All required environment variables are set');
```

## Next Steps

1. **Review** all environment variables for your specific setup
2. **Configure** Auth0 applications and APIs
3. **Set up** production infrastructure
4. **Test** configuration in staging environment
5. **Deploy** to production with monitoring

## Support

For configuration issues:
- Check [Troubleshooting Guide](./12_Troubleshooting.md)
- Verify environment variable syntax
- Test connections to external services
- Review logs for configuration errors