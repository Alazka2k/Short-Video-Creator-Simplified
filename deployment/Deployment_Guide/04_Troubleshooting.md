# Troubleshooting and Monitoring Guide

## Pre-Deployment Checklist

### Auth0 Verification
- [ ] Token expiration settings are correct
- [ ] Refresh token rotation is enabled
- [ ] API permissions and scopes are set
- [ ] Token refresh flow works
- [ ] CORS configuration is correct
- [ ] Environment variables are properly set

### AWS S3 Verification
- [ ] Bucket exists and is accessible
- [ ] CORS settings are configured
- [ ] Bucket policies are set correctly
- [ ] CDN/CloudFront is configured
- [ ] IAM roles and policies are correct
- [ ] Signed URL generation works

### Database Verification
- [ ] Database is created and accessible
- [ ] User permissions are set correctly
- [ ] Connection pools are configured
- [ ] Backup procedures are in place
- [ ] Monitoring is set up

## Common Issues and Solutions

### Auth0 Issues
1. **Token Refresh Fails**
   ```bash
   # Check token configuration
   curl -X GET https://staging.narravid.io/auth/verify
   # Check Auth0 logs
   ```

2. **CORS Errors**
   ```bash
   # Check Nginx CORS headers
   curl -I -H "Origin: https://staging.narravid.io" https://api.staging.narravid.io
   
   # Check API Gateway logs
   tail -f /var/log/nginx/error.log
   ```

### Database Issues
1. **Connection Errors**
   ```bash
   # Check PostgreSQL status
   sudo systemctl status postgresql
   
   # Check connection
   psql -h localhost -U staging_user -d short_video_creator_staging
   ```

2. **Migration Failures**
   ```bash
   # Check migration status
   npm run migrate:status
   
   # Roll back last migration
   npm run migrate:rollback
   ```

### Service Issues
1. **Service Won't Start**
   ```bash
   # Check PM2 logs
   pm2 logs
   
   # Check system resources
   htop
   ```

2. **Service Crashes**
   ```bash
   # Check application logs
   tail -f /var/log/narravid/app.log
   
   # Monitor memory usage
   pm2 monit
   ```

## Monitoring Setup

### System Monitoring
```bash
# CPU and Memory
htop

# Disk Usage
df -h
du -sh /var/www/narravid-staging/*

# Network
netstat -tulpn
```

### Application Monitoring
```bash
# PM2 Monitoring
pm2 monit

# Log Monitoring
tail -f /var/log/narravid/*.log

# Nginx Access Logs
tail -f /var/log/nginx/access.log
```

### Database Monitoring
```bash
# Connection Count
psql -c "SELECT count(*) FROM pg_stat_activity;"

# Table Sizes
psql -c "\dt+"
```

## Security Considerations

### Production Hardening
1. **Auth0 Security**
   - Enable Refresh Token Rotation
   - Reduce token lifetimes
   - Enable breach detection
   - Configure MFA if required

2. **CORS Security**
   - Strict origin checking
   - Proper header configuration
   - Regular audit of allowed origins

3. **Infrastructure Security**
   - Regular security updates
   - Firewall configuration
   - SSL certificate monitoring
   - Access control review

### Security Monitoring
1. **Auth0 Monitoring**
   - Failed login attempts
   - Token usage and revocation
   - Suspicious activities
   - API access patterns

2. **Infrastructure Monitoring**
   - SSL certificate expiration
   - Firewall logs
   - System access logs
   - Database access logs

## Emergency Procedures

### Quick Service Recovery
```bash
# Stop all services
pm2 stop all

# Clear application caches
redis-cli flushall

# Restart services
pm2 start ecosystem.config.js --env staging
```

### Database Recovery
```bash
# Create backup
pg_dump -U staging_user -d short_video_creator_staging > backup.sql

# Restore from backup
psql -U staging_user -d short_video_creator_staging < backup.sql
```

### Emergency Contacts
- System Administrator: [Contact Info]
- Database Administrator: [Contact Info]
- Auth0 Support: [Contact Info]
- AWS Support: [Contact Info]

## Regular Maintenance

### Daily Checks
- [ ] Monitor error logs
- [ ] Check service health endpoints
- [ ] Verify backup completion
- [ ] Review Auth0 logs

### Weekly Tasks
- [ ] Review system resources
- [ ] Check SSL certificate validity
- [ ] Analyze performance metrics
- [ ] Update security patches

### Monthly Tasks
- [ ] Rotate access credentials
- [ ] Review security policies
- [ ] Test disaster recovery
- [ ] Update documentation 