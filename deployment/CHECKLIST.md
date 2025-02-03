# Deployment Environment Checklist

## Pre-Deployment
- [ ] Run auth settings update script
- [ ] Verify token expiration settings
- [ ] Check refresh token rotation is enabled (staging/prod)
- [ ] Verify API permissions and scopes
- [ ] Test token refresh flow
- [ ] Verify CORS configuration in API Gateway
- [ ] Check environment variables are properly set for each service

## Environment-Specific Settings
### Development
```bash
npm run deploy:auth:dev
# Verify CORS allows http://localhost:4000
```

### Staging
```bash
npm run deploy:auth:staging
# Verify CORS allows https://staging.yourdomain.com
```

### Production
```bash
npm run deploy:auth:prod
# Verify CORS allows https://yourdomain.com
```

## Post-Deployment Verification
- [ ] Verify token expiration times
- [ ] Test authentication flow
- [ ] Verify refresh token rotation
- [ ] Check API access with new tokens
- [ ] Verify CORS headers in API responses
- [ ] Test API Gateway health endpoint
- [ ] Monitor CORS logs for rejected origins
- [ ] Verify all service-to-service communications

# Deployment Checklist - Auth0 and API Configuration

## Environment Setup Overview

### Development (Local)
- Domain: dev-5e34magdrr8ridcc.eu.auth0.com
- URLs: http://localhost:4000/*
- API Gateway URL: http://localhost:3000
- No HTTPS required
- Relaxed security settings for development

### Staging
- Create separate Auth0 Application
- URLs: https://staging.yourdomain.com/*
- API Gateway URL: https://api.staging.yourdomain.com
- HTTPS required
- Mirror production security settings
- Verify API Gateway CORS configuration

### Production
- Create separate Auth0 Application
- URLs: https://yourdomain.com/*
- API Gateway URL: https://api.yourdomain.com
- HTTPS required
- Strict security settings
- Strict CORS configuration

## API Gateway Setup Process Per Environment

### 1. CORS Configuration
```
Development:
- Frontend URL: http://localhost:4000
- Allow credentials: true
- Headers: Content-Type, Authorization

Staging:
- Frontend URL: https://staging.yourdomain.com
- Allow credentials: true
- Headers: Content-Type, Authorization
- Strict HTTPS enforcement

Production:
- Frontend URL: https://yourdomain.com
- Allow credentials: true
- Headers: Content-Type, Authorization
- Strict HTTPS enforcement
```

### 2. Environment Variables in .env (root)
```env
# Development (.env)
NODE_ENV=development
DEVELOPMENT_FRONTEND_URL=http://localhost:4000
DEVELOPMENT_API_GATEWAY_PORT=3000
DEVELOPMENT_AUTH0_M2M_DOMAIN=dev-domain.auth0.com
DEVELOPMENT_AUTH0_M2M_CLIENT_ID=dev-client-id
DEVELOPMENT_AUTH0_M2M_AUDIENCE=https://api.dev-domain.com
DEVELOPMENT_AUTH0_M2M_CLIENT_SECRET=development-secret

# Staging (.env.staging)
NODE_ENV=staging
STAGING_FRONTEND_URL=https://staging.yourdomain.com
STAGING_AUTH0_M2M_DOMAIN=staging-domain.auth0.com
STAGING_AUTH0_M2M_CLIENT_ID=staging-client-id
STAGING_AUTH0_M2M_AUDIENCE=https://api.staging-domain.com
STAGING_AUTH0_M2M_CLIENT_SECRET=staging-secret

# Production (.env.production)
NODE_ENV=production
PRODUCTION_FRONTEND_URL=https://yourdomain.com
PRODUCTION_AUTH0_M2M_DOMAIN=prod-domain.auth0.com
PRODUCTION_AUTH0_M2M_CLIENT_ID=prod-client-id
PRODUCTION_AUTH0_M2M_AUDIENCE=https://api.prod-domain.com
PRODUCTION_AUTH0_M2M_CLIENT_SECRET=prod-secret
```

## Deployment Steps

1. **Pre-Deployment**
   - Create new Auth0 application for target environment
   - Configure all URIs with correct domain
   - Update environment variables
   - Test configuration with staging environment first
   - Verify API Gateway CORS configuration
   - Test service-to-service communication

2. **During Deployment**
   - Verify environment variables are properly set
   - Ensure SSL certificates are valid (staging/prod)
   - Update DNS settings if needed
   - Monitor API Gateway logs for CORS issues
   - Check service health endpoints

3. **Post-Deployment**
   - Verify login flow works
   - Test logout functionality
   - Confirm token refresh works
   - Monitor Auth0 logs for errors
   - Test API authentication
   - Verify CORS for all frontend-to-API communications
   - Check API Gateway logs for any CORS rejections

## Security Considerations

1. **Production Hardening**
   - Enable Refresh Token Rotation
   - Reduce token lifetimes
   - Enable breach detection
   - Configure appropriate CORS settings
   - Enable MFA if required
   - Ensure strict CORS origin checking
   - Monitor for unauthorized origin attempts

2. **Monitoring**
   - Set up Auth0 alerts for suspicious activities
   - Monitor failed login attempts
   - Track token usage and revocation
   - Set up error tracking and logging
   - Monitor API Gateway CORS logs
   - Track service-to-service communication errors

3. **Compliance**
   - Document all configuration changes
   - Maintain separate configurations per environment
   - Regular security reviews
   - Keep Auth0 SDKs updated
   - Document CORS policies
   - Maintain list of allowed origins

## Rollback Plan

1. **Preparation**
   - Maintain previous working configuration
   - Document all changes
   - Keep old environment variables
   - Backup CORS configurations

2. **Rollback Steps**
   - Revert Auth0 configuration changes
   - Restore previous environment variables
   - Clear token cache if needed
   - Force re-authentication if required
   - Restore previous CORS settings
   - Verify API Gateway configuration

## Regular Maintenance

1. **Monthly**
   - Review and rotate secrets if needed
   - Check for deprecated features
   - Update Auth0 SDK versions
   - Review security settings
   - Review CORS logs for unexpected patterns
   - Test cross-origin requests

2. **Quarterly**
   - Full security audit
   - Review token lifetimes
   - Update documentation
   - Test disaster recovery plan
   - Review and update CORS policies
   - Verify all service endpoints
   - Test all environment configurations 