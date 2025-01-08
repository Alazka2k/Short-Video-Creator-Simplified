# Deployment Environment Checklist

## Pre-Deployment
- [ ] Run auth settings update script
- [ ] Verify token expiration settings
- [ ] Check refresh token rotation is enabled (staging/prod)
- [ ] Verify API permissions and scopes
- [ ] Test token refresh flow

## Environment-Specific Settings
### Development
```bash
npm run deploy:auth:dev
```

### Staging
```bash
npm run deploy:auth:staging
```

### Production
```bash
npm run deploy:auth:prod
```

## Post-Deployment Verification
- [ ] Verify token expiration times
- [ ] Test authentication flow
- [ ] Verify refresh token rotation
- [ ] Check API access with new tokens 

# Deployment Checklist - Auth0 Configuration

## Environment Setup Overview

### Development (Local)
- Domain: dev-5e34magdrr8ridcc.eu.auth0.com
- URLs: http://localhost:4000/*
- No HTTPS required
- Relaxed security settings for development

### Staging
- Create separate Auth0 Application
- URLs: https://staging.yourdomain.com/*
- HTTPS required
- Mirror production security settings

### Production
- Create separate Auth0 Application
- URLs: https://yourdomain.com/*
- HTTPS required
- Strict security settings

## Auth0 Setup Process Per Environment

### 1. Application Creation
- Create separate Auth0 applications for each environment
- Use naming convention: "Video Creator (Environment)"
  - Video Creator (Frontend Dev)
  - Video Creator (Frontend Staging)
  - Video Creator (Frontend Prod)

### 2. URI Configuration
```
Development:
- Allowed Callback URLs: http://localhost:4000/dashboard
- Allowed Logout URLs: http://localhost:4000,http://localhost:4000/login
- Allowed Web Origins: http://localhost:4000
- Allowed Origins (CORS): http://localhost:4000

Staging:
- Application Login URI: https://staging.yourdomain.com/login
- Allowed Callback URLs: https://staging.yourdomain.com/dashboard
- Allowed Logout URLs: https://staging.yourdomain.com,https://staging.yourdomain.com/login
- Allowed Web Origins: https://staging.yourdomain.com
- Allowed Origins (CORS): https://staging.yourdomain.com

Production:
- Application Login URI: https://yourdomain.com/login
- Allowed Callback URLs: https://yourdomain.com/dashboard
- Allowed Logout URLs: https://yourdomain.com,https://yourdomain.com/login
- Allowed Web Origins: https://yourdomain.com
- Allowed Origins (CORS): https://yourdomain.com
```

### 3. Security Settings
```
Development:
- Token Endpoint Auth Method: None
- Grant Types: Authorization Code, Refresh Token, Implicit
- ID Token Expiration: 36000 seconds (10 hours)
- Refresh Token Rotation: Optional

Staging/Production:
- Token Endpoint Auth Method: None
- Grant Types: Authorization Code, Refresh Token
- ID Token Expiration: 3600 seconds (1 hour)
- Refresh Token Rotation: Enabled
- Token Sender-Constraining: Required
- Authorization Requests: Consider enabling PAR/JAR
```

### 4. Environment Variables in .env
```env
# Development (.env.development)
NEXT_PUBLIC_DEVELOPMENT_AUTH0_DOMAIN=dev-xxx.auth0.com
NEXT_PUBLIC_DEVELOPMENT_AUTH0_CLIENT_ID=your-dev-client-id
NEXT_PUBLIC_DEVELOPMENT_AUTH0_AUDIENCE=https://api.dev-xxx.com

# Staging (.env.staging)
NEXT_PUBLIC_STAGING_AUTH0_DOMAIN=staging-xxx.auth0.com
NEXT_PUBLIC_STAGING_AUTH0_CLIENT_ID=your-staging-client-id
NEXT_PUBLIC_STAGING_AUTH0_AUDIENCE=https://api.staging-xxx.com

# Production (.env.production)
NEXT_PUBLIC_PRODUCTION_AUTH0_DOMAIN=xxx.auth0.com
NEXT_PUBLIC_PRODUCTION_AUTH0_CLIENT_ID=your-prod-client-id
NEXT_PUBLIC_PRODUCTION_AUTH0_AUDIENCE=https://api.xxx.com
```
### 5. Environment Variables for Frontend
```env.staging / env.production
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_AUTH0_DOMAIN=prod-domain.auth0.com
NEXT_PUBLIC_AUTH0_CLIENT_ID=prod-client-id
NEXT_PUBLIC_AUTH0_AUDIENCE=https://api.prod-domain.com
```

## Deployment Steps

1. **Pre-Deployment**
   - Create new Auth0 application for target environment
   - Configure all URIs with correct domain
   - Update environment variables
   - Test configuration with staging environment first

2. **During Deployment**
   - Verify environment variables are properly set
   - Ensure SSL certificates are valid (staging/prod)
   - Update DNS settings if needed

3. **Post-Deployment**
   - Verify login flow works
   - Test logout functionality
   - Confirm token refresh works
   - Monitor Auth0 logs for errors
   - Test API authentication

## Security Considerations

1. **Production Hardening**
   - Enable Refresh Token Rotation
   - Reduce token lifetimes
   - Enable breach detection
   - Configure appropriate CORS settings
   - Enable MFA if required

2. **Monitoring**
   - Set up Auth0 alerts for suspicious activities
   - Monitor failed login attempts
   - Track token usage and revocation
   - Set up error tracking and logging

3. **Compliance**
   - Document all configuration changes
   - Maintain separate configurations per environment
   - Regular security reviews
   - Keep Auth0 SDKs updated

## Rollback Plan

1. **Preparation**
   - Maintain previous working configuration
   - Document all changes
   - Keep old environment variables

2. **Rollback Steps**
   - Revert Auth0 configuration changes
   - Restore previous environment variables
   - Clear token cache if needed
   - Force re-authentication if required

## Regular Maintenance

1. **Monthly**
   - Review and rotate secrets if needed
   - Check for deprecated features
   - Update Auth0 SDK versions
   - Review security settings

2. **Quarterly**
   - Full security audit
   - Review token lifetimes
   - Update documentation
   - Test disaster recovery plan 