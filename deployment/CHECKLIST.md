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