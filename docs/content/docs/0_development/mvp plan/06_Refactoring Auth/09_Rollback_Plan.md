# Rollback Plan Guide

## Overview

This document provides comprehensive procedures for rolling back the authentication migration from JWT with Custom Claims back to the previous M2M + x-user-token system. This plan ensures minimal downtime and data integrity in case of critical issues during or after the migration.

## Prerequisites

- Access to production servers and databases
- Backup of all files before migration started
- Database backup from before migration
- Git repository with pre-migration commit
- Admin access to Auth0 dashboard
- Monitoring and alerting systems ready

## Rollback Trigger Criteria

### Critical Issues (Immediate Rollback Required)
- [ ] **Authentication completely broken** - Users cannot log in
- [ ] **Data corruption detected** - User data being mixed or lost
- [ ] **Security vulnerability** - Unauthorized access detected
- [ ] **Service completely down** - API Gateway not responding
- [ ] **Database corruption** - Data integrity compromised

### Major Issues (Rollback Recommended)
- [ ] **Performance degradation >50%** - Response times unacceptable
- [ ] **High error rate >10%** - Large number of failed requests
- [ ] **User complaints** - Multiple user-reported issues
- [ ] **Payment failures** - Billing/subscription issues
- [ ] **Admin functions broken** - Management tools not working

### Minor Issues (Rollback Optional)
- [ ] **Performance degradation <20%** - Slight slowdown acceptable
- [ ] **Edge case failures** - Rare scenario failures
- [ ] **UI inconsistencies** - Visual/UX issues only
- [ ] **Logging issues** - Monitoring problems only

## Rollback Phases

### Phase 1: Immediate Emergency Response (5 minutes)

#### 1.1 Stop Deployment Process
```bash
# If rollback is triggered during deployment
# Stop all deployment scripts immediately
kill -9 $(pgrep -f "deploy")
kill -9 $(pgrep -f "migration")

# Stop any running services that might be corrupting data
sudo systemctl stop api-gateway
sudo systemctl stop auth-service
```

#### 1.2 Enable Maintenance Mode
```bash
# Enable maintenance mode to prevent user access
sudo cp /var/www/maintenance.html /var/www/html/index.html

# Or redirect traffic away from affected services
sudo nginx -s reload -c /etc/nginx/nginx.maintenance.conf
```

#### 1.3 Alert Team
```bash
# Send immediate alerts to the team
curl -X POST "https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK" \
  -H 'Content-type: application/json' \
  --data '{"text":"🚨 CRITICAL: Authentication migration rollback initiated"}'

# Send email alert
echo "Authentication migration rollback in progress" | \
  mail -s "CRITICAL: System Rollback" admin@narravid.io
```

### Phase 2: Auth0 Configuration Rollback (10 minutes)

#### 2.1 Disable Auth0 Actions
```javascript
// Auth0 Dashboard Steps:
// 1. Go to Actions > Flows > Login
// 2. Remove the "Add Custom Claims" action
// 3. Save and deploy the flow

// Or via Management API:
const auth0 = require('auth0');
const management = new auth0.ManagementClient({
  domain: process.env.AUTH0_DOMAIN,
  clientId: process.env.AUTH0_CLIENT_ID,
  clientSecret: process.env.AUTH0_CLIENT_SECRET
});

// Remove custom claims action from login flow
await management.flows.update(
  { id: 'login' },
  {
    actions: [] // Empty actions array removes all actions
  }
);
```

#### 2.2 Restore Original Auth0 Application Settings
```bash
# Restore Auth0 application configuration using backup
# These values should be documented from before migration

# Via Auth0 CLI (if available)
auth0 apps update YOUR_APP_ID \
  --callbacks "http://localhost:3000,https://narravid.io" \
  --allowed-logout-urls "http://localhost:3000,https://narravid.io" \
  --allowed-origins "http://localhost:3000,https://narravid.io" \
  --token-endpoint-auth-method "client_secret_basic"
```

#### 2.3 Verify Auth0 Configuration
```bash
# Test Auth0 configuration
curl -X GET "https://${AUTH0_DOMAIN}/.well-known/openid_configuration"

# Verify application settings
curl -X GET "https://${AUTH0_DOMAIN}/api/v2/clients/${AUTH0_CLIENT_ID}" \
  -H "Authorization: Bearer ${AUTH0_MANAGEMENT_TOKEN}"
```

### Phase 3: Database Rollback (15 minutes)

#### 3.1 Stop All Database Connections
```bash
# Stop all services that might be writing to database
sudo systemctl stop api-gateway
sudo systemctl stop auth-service
sudo systemctl stop job-service
sudo systemctl stop subscription-service

# Kill any remaining connections
sudo -u postgres psql -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'narravid_db' AND pid <> pg_backend_pid();"
```

#### 3.2 Restore Database from Backup
```bash
# Restore database from pre-migration backup
BACKUP_FILE="/var/backups/db/pre-migration-backup-$(date +%Y%m%d).sql"

# Create new backup of current state (just in case)
sudo -u postgres pg_dump narravid_db > "/var/backups/db/rollback-backup-$(date +%Y%m%d-%H%M).sql"

# Restore from pre-migration backup
sudo -u postgres psql -c "DROP DATABASE IF EXISTS narravid_db;"
sudo -u postgres psql -c "CREATE DATABASE narravid_db;"
sudo -u postgres psql narravid_db < "$BACKUP_FILE"

# Verify restoration
sudo -u postgres psql narravid_db -c "SELECT COUNT(*) FROM users;"
sudo -u postgres psql narravid_db -c "SELECT version FROM schema_migrations ORDER BY version DESC LIMIT 1;"
```

#### 3.3 Verify Database Integrity
```bash
# Run database integrity checks
sudo -u postgres psql narravid_db -c "ANALYZE;"
sudo -u postgres psql narravid_db -c "VACUUM ANALYZE;"

# Check for any corruption
sudo -u postgres psql narravid_db -c "SELECT relname FROM pg_class WHERE relkind = 'r' AND NOT pg_table_is_visible(oid);"
```

### Phase 4: Code Rollback (20 minutes)

#### 4.1 Git Repository Rollback
```bash
# Navigate to project directory
cd /var/www/narravid

# Identify the pre-migration commit
PRE_MIGRATION_COMMIT=$(git log --oneline --grep="PRE-MIGRATION" | head -1 | cut -d' ' -f1)
echo "Rolling back to commit: $PRE_MIGRATION_COMMIT"

# Create rollback branch for tracking
git checkout -b rollback-$(date +%Y%m%d-%H%M)

# Hard reset to pre-migration state
git reset --hard $PRE_MIGRATION_COMMIT

# Force push to update deployment branch
git push origin main --force
```

#### 4.2 Restore Middleware Files
```bash
# Restore deleted middleware files from backup
BACKUP_DIR="/var/backups/code/pre-migration"

# Restore auth0.js middleware
cp "$BACKUP_DIR/backend/api-gateway/middleware/auth0.js" \
   "backend/api-gateway/middleware/auth0.js"

# Restore userTokenExtractor.js middleware
cp "$BACKUP_DIR/backend/api-gateway/middleware/userTokenExtractor.js" \
   "backend/api-gateway/middleware/userTokenExtractor.js"

# Restore requireUserToken.js middleware
cp "$BACKUP_DIR/backend/api-gateway/middleware/requireUserToken.js" \
   "backend/api-gateway/middleware/requireUserToken.js"

# Remove unifiedAuth.js if it was created during migration
rm -f "backend/api-gateway/middleware/unifiedAuth.js"
```

#### 4.3 Restore Route Configuration
```bash
# Restore all route files from backup
cp -r "$BACKUP_DIR/backend/api-gateway/routes/" \
      "backend/api-gateway/routes/"

# Restore server.js configuration
cp "$BACKUP_DIR/backend/api-gateway/server.js" \
   "backend/api-gateway/server.js"

# Restore auth service files
cp -r "$BACKUP_DIR/backend/services/auth-service/" \
      "backend/services/auth-service/"
```

#### 4.4 Restore Frontend Configuration
```bash
# Restore frontend authentication files
cp "$BACKUP_DIR/frontend/src/lib/auth/AuthContext.tsx" \
   "frontend/src/lib/auth/AuthContext.tsx"

cp "$BACKUP_DIR/frontend/src/lib/hooks/useAuth.ts" \
   "frontend/src/lib/hooks/useAuth.ts"

cp "$BACKUP_DIR/frontend/src/app/api/auth/" \
   "frontend/src/app/api/auth/" -r

# Restore environment configuration
cp "$BACKUP_DIR/.env.local" ".env.local"
cp "$BACKUP_DIR/.env.production" ".env.production"
```

### Phase 5: Service Restart and Verification (15 minutes)

#### 5.1 Rebuild and Restart Services
```bash
# Clear any cache and rebuild
npm ci
npm run build

# Clear Docker images and rebuild
docker-compose down
docker system prune -f
docker-compose build --no-cache

# Restart services in correct order
docker-compose up -d database
sleep 30

docker-compose up -d auth-service
sleep 15

docker-compose up -d subscription-service
docker-compose up -d job-service
sleep 15

docker-compose up -d api-gateway
sleep 10

# Start frontend
pm2 restart frontend
```

#### 5.2 Verify Service Health
```bash
# Check all services are responding
curl -f http://localhost:3000/health || echo "❌ API Gateway down"
curl -f http://localhost:3001/health || echo "❌ Auth Service down"
curl -f http://localhost:3002/health || echo "❌ Subscription Service down"
curl -f http://localhost:3003/health || echo "❌ Job Service down"

# Check database connectivity
sudo -u postgres psql narravid_db -c "SELECT 1;" || echo "❌ Database connection failed"

# Check frontend
curl -f http://localhost:3000 || echo "❌ Frontend down"
```

#### 5.3 Test Authentication Flow
```bash
# Test login endpoint
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}' || echo "❌ Login failed"

# Test profile endpoint with M2M token
M2M_TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/token | jq -r '.access_token')
USER_TOKEN="your-test-user-token"

curl -X GET http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer $M2M_TOKEN" \
  -H "x-user-token: $USER_TOKEN" || echo "❌ Profile access failed"

# Test job creation
curl -X POST http://localhost:3000/api/job/jobs \
  -H "Authorization: Bearer $M2M_TOKEN" \
  -H "x-user-token: $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Job","type":"video"}' || echo "❌ Job creation failed"
```

### Phase 6: Traffic Restoration (10 minutes)

#### 6.1 Disable Maintenance Mode
```bash
# Restore original index.html
sudo rm /var/www/html/index.html
sudo systemctl reload nginx

# Or restore nginx configuration
sudo cp /etc/nginx/nginx.conf.backup /etc/nginx/nginx.conf
sudo nginx -s reload
```

#### 6.2 Gradual Traffic Restoration
```bash
# Enable traffic to 10% of users first
sudo sed -i 's/proxy_pass.*/proxy_pass http:\/\/backend 10%;/' /etc/nginx/nginx.conf
sudo nginx -s reload
sleep 300  # Wait 5 minutes

# If no issues, enable for 50% of users
sudo sed -i 's/proxy_pass.*/proxy_pass http:\/\/backend 50%;/' /etc/nginx/nginx.conf
sudo nginx -s reload
sleep 300  # Wait 5 minutes

# If no issues, enable for 100% of users
sudo sed -i 's/proxy_pass.*/proxy_pass http:\/\/backend;/' /etc/nginx/nginx.conf
sudo nginx -s reload
```

#### 6.3 Monitor Traffic and Errors
```bash
# Monitor error logs
tail -f /var/log/nginx/error.log &
tail -f /var/log/api-gateway/error.log &
tail -f /var/log/auth-service/error.log &

# Monitor response times
watch -n 5 'curl -w "@curl-format.txt" -s -o /dev/null http://localhost:3000/health'

# Monitor error rates
watch -n 10 'grep -c "ERROR" /var/log/api-gateway/app.log | tail -10'
```

## Verification Checklist

### Technical Verification
- [ ] All services responding to health checks
- [ ] Database connectivity restored
- [ ] Authentication flow working (M2M + x-user-token)
- [ ] User sessions working correctly
- [ ] Job creation and management working
- [ ] Subscription endpoints working
- [ ] Admin functions accessible
- [ ] Payment processing working
- [ ] File uploads/downloads working
- [ ] Email notifications working

### User Experience Verification  
- [ ] Users can log in successfully
- [ ] Dashboard loads correctly
- [ ] Job creation works
- [ ] Job details accessible
- [ ] Subscription management works
- [ ] Token usage displayed correctly
- [ ] Settings pages accessible
- [ ] Logout works correctly
- [ ] Cross-browser compatibility
- [ ] Mobile experience working

### Business Function Verification
- [ ] New user registration working
- [ ] Subscription payments processing
- [ ] Token deduction working
- [ ] Plan limitations enforced
- [ ] Admin controls accessible
- [ ] Reporting functions working
- [ ] Backup processes running
- [ ] Monitoring alerts working
- [ ] Security scans passing
- [ ] Performance within acceptable limits

## Post-Rollback Actions

### Immediate Actions (Within 1 hour)
```bash
# 1. Document the rollback
echo "$(date): Authentication migration rollback completed" >> /var/log/rollback.log

# 2. Notify stakeholders
curl -X POST "https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK" \
  -H 'Content-type: application/json' \
  --data '{"text":"✅ Authentication rollback completed successfully"}'

# 3. Update status page
curl -X POST "https://api.statuspage.io/v1/pages/YOUR_PAGE_ID/incidents" \
  -H "Authorization: OAuth YOUR_TOKEN" \
  -d "name=Authentication System Rollback&status=resolved"

# 4. Create incident report
cat > /tmp/incident-report-$(date +%Y%m%d).md << EOF
# Authentication Migration Rollback Incident Report

**Date**: $(date)
**Duration**: [FILL IN]
**Impact**: [FILL IN]
**Root Cause**: [FILL IN]

## Timeline
[FILL IN TIMELINE]

## Resolution
Authentication system rolled back to previous M2M + x-user-token architecture.

## Follow-up Actions
[FILL IN ACTIONS]
EOF
```

### Short-term Actions (Within 24 hours)
1. **Conduct Post-Incident Review**
   - Review what went wrong
   - Identify improvements needed
   - Update migration plan
   - Document lessons learned

2. **Update Documentation**
   - Update rollback procedures based on experience
   - Document any issues encountered
   - Update migration timeline
   - Share learnings with team

3. **Plan Next Attempt**
   - Address root causes
   - Update testing procedures
   - Plan additional safeguards
   - Schedule next migration attempt

### Long-term Actions (Within 1 week)
1. **Improve Migration Process**
   - Enhanced testing procedures
   - Better monitoring during migration
   - Improved rollback automation
   - Additional safeguards

2. **System Improvements**
   - Address identified issues
   - Improve system resilience
   - Enhanced monitoring
   - Better error handling

## Rollback Testing

### Pre-Production Rollback Test
```bash
#!/bin/bash
# Test rollback procedure in staging environment

echo "🧪 Starting rollback procedure test..."

# 1. Simulate migration failure
echo "Simulating migration failure..."
sudo systemctl stop api-gateway

# 2. Execute rollback procedure
echo "Executing rollback procedure..."
./scripts/rollback.sh --test-mode

# 3. Verify rollback success
echo "Verifying rollback..."
./scripts/verify-rollback.sh

echo "✅ Rollback test completed"
```

### Automated Rollback Script
```bash
#!/bin/bash
# scripts/automated-rollback.sh

set -e  # Exit on any error

BACKUP_DIR="/var/backups/pre-migration"
LOG_FILE="/var/log/rollback-$(date +%Y%m%d-%H%M).log"

log() {
    echo "$(date): $1" | tee -a "$LOG_FILE"
}

rollback_step() {
    local step_name="$1"
    local step_command="$2"
    
    log "🔄 Starting: $step_name"
    if eval "$step_command"; then
        log "✅ Completed: $step_name"
    else
        log "❌ Failed: $step_name"
        exit 1
    fi
}

# Execute rollback steps
rollback_step "Stop Services" "sudo systemctl stop api-gateway auth-service"
rollback_step "Restore Database" "sudo -u postgres psql narravid_db < $BACKUP_DIR/database.sql"
rollback_step "Restore Code" "git reset --hard $(cat $BACKUP_DIR/commit-hash.txt)"
rollback_step "Restore Files" "cp -r $BACKUP_DIR/middleware/* backend/api-gateway/middleware/"
rollback_step "Restart Services" "sudo systemctl start auth-service api-gateway"
rollback_step "Verify Health" "./scripts/verify-health.sh"

log "🎉 Rollback completed successfully!"
```

## Communication Plan

### Internal Communication
```markdown
# Rollback Communication Template

**To**: Engineering Team, Product Team, Executive Team
**Subject**: Authentication Migration Rollback - [STATUS]

## Summary
The authentication migration has been rolled back due to [REASON].

## Current Status
- ✅ Services restored and operational
- ✅ User access restored
- ✅ Data integrity verified
- ⏳ Post-incident review scheduled

## Impact
- **Users Affected**: [NUMBER]
- **Duration**: [TIME]
- **Services Impacted**: [LIST]

## Next Steps
1. [ACTION 1]
2. [ACTION 2]
3. [ACTION 3]

## Timeline for Next Attempt
TBD - will be communicated after post-incident review.
```

### Customer Communication
```markdown
# Customer Communication Template

**Subject**: Service Restoration Complete

Dear Narravid Users,

We have successfully resolved the authentication issues you may have experienced earlier today. All services are now fully operational.

**What happened**: During a planned system upgrade, we encountered technical issues that affected user authentication.

**What we did**: We immediately rolled back the changes and restored full service functionality.

**Current status**: All systems are operating normally. No user data was affected.

We apologize for any inconvenience this may have caused. If you continue to experience any issues, please contact our support team.

Thank you for your patience.

The Narravid Team
```

## Prevention Measures

### Enhanced Testing
- [ ] More comprehensive staging environment testing
- [ ] Automated rollback testing
- [ ] Load testing before production deployment
- [ ] Security testing with new authentication
- [ ] Cross-browser compatibility testing

### Better Monitoring
- [ ] Real-time authentication success/failure rates
- [ ] Database performance monitoring
- [ ] API response time monitoring
- [ ] Error rate alerting
- [ ] User experience monitoring

### Improved Rollback Procedures
- [ ] Automated rollback triggers
- [ ] Faster rollback execution
- [ ] Better communication procedures
- [ ] Pre-positioned rollback artifacts
- [ ] Regular rollback procedure testing

## Success Criteria for Next Attempt

### Pre-Migration Requirements
- [ ] All rollback procedures tested successfully
- [ ] Enhanced monitoring in place
- [ ] Automated rollback triggers configured
- [ ] Team trained on new procedures
- [ ] Customer communication plan ready

### Migration Requirements
- [ ] Gradual rollout plan (1% → 10% → 50% → 100%)
- [ ] Real-time monitoring during migration
- [ ] Automated health checks every 5 minutes
- [ ] Ready rollback team standing by
- [ ] Customer communication prepared

### Post-Migration Requirements
- [ ] 24-hour monitoring period
- [ ] Performance metrics within 10% of baseline
- [ ] Error rates below 1%
- [ ] No customer complaints
- [ ] All functionality verified

---

**Remember**: The goal of rollback is to restore service quickly and safely. When in doubt, prioritize user safety and data integrity over speed. 