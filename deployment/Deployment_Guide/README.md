# Short-Video-Creator-Simplified Staging Deployment Guide

This guide provides comprehensive instructions for deploying the application to a staging environment. It covers all aspects of the deployment process, from initial setup to monitoring and maintenance.

## Table of Contents

1. [Prerequisites and Initial Setup](01_Prerequisites.md)
   - Server Requirements
   - Initial Server Setup
   - Repository Setup
   - PM2 Setup
   - Directory Structure
   - Dependencies Management

2. [Environment Setup](02_Environment_Setup.md)
   - Environment Variables
   - Directory Setup
   - SSL Certificates
   - Nginx Configuration
   - Database Setup
   - Redis Setup
   - Auth0 Configuration
   - AWS S3 Setup
   - Firewall Configuration

3. [Deployment Process](03_Deployment_Process.md)
   - Initial Deployment
   - Regular Deployment Steps
   - Automated Deployment
   - Rollback Process
   - Monitoring Deployment
   - Verification Steps

4. [Troubleshooting and Monitoring](04_Troubleshooting.md)
   - Pre-Deployment Checklist
   - Common Issues and Solutions
   - Monitoring Setup
   - Security Considerations
   - Emergency Procedures
   - Regular Maintenance

## Quick Start

1. **Initial Setup**
```bash
# Connect to server
ssh deploy@YOUR_SERVER_IP

# Clone repository
cd /var/www/narravid-staging
git clone https://github.com/your-repo/Short-Video-Creator-Simplified.git .
git checkout staging
```

2. **Environment Setup**
```bash
# Copy and configure environment file
cp .env.staging .env
nano .env

# Install dependencies
npm install
cd frontend && npm install && cd ..
```

3. **Deploy Application**
```bash
# Run deployment script
chmod +x deployment/scripts/deploy-staging.sh
sudo deployment/scripts/deploy-staging.sh
```

## Important Notes

### Configuration Files
- `ecosystem.config.js`: PM2 process configuration (copy from `deployment/scripts/`)
- `.env.staging`: Environment variables
- `nginx-staging.conf`: Nginx configuration
- `deployment/scripts/deploy-staging.sh`: Deployment script

### Dependencies
- Root `package.json`: Service dependencies
- Frontend `package.json`: Frontend dependencies
- Both need to be installed separately
- Always run `npm install` after pulling changes

### Service Management
```bash
# Start services
pm2 start ecosystem.config.js --env staging

# Monitor services
pm2 monit

# View logs
pm2 logs
```

### Health Checks
```bash
# Frontend
curl -I https://staging.narravid.io/health

# API
curl -I https://api.staging.narravid.io/health
```

## Directory Structure

```
/var/www/narravid-staging/
├── frontend/              # Frontend application
├── backend/              # Backend services
├── deployment/
│   ├── scripts/
│   │   ├── deploy-staging.sh
│   │   ├── nginx-staging.conf
│   │   └── ecosystem.config.js
│   └── Deployment_Guide/
│       ├── README.md
│       ├── 01_Prerequisites.md
│       ├── 02_Environment_Setup.md
│       ├── 03_Deployment_Process.md
│       └── 04_Troubleshooting.md
├── ecosystem.config.js    # PM2 configuration
├── .env.staging          # Environment variables
└── package.json          # Root dependencies
```

## Security Considerations

1. **Authentication**
   - Auth0 token configuration
   - Refresh token rotation
   - MFA setup (if required)
   - Regular credential rotation

2. **Infrastructure**
   - SSL certificate monitoring
   - Firewall configuration
   - Regular security updates
   - Access control management

3. **Monitoring**
   - System resource monitoring
   - Application logs
   - Security alerts
   - Performance metrics

## Maintenance Schedule

### Daily
- Monitor error logs
- Check service health
- Verify backups
- Review Auth0 logs

### Weekly
- Review system resources
- Check SSL certificates
- Update security patches
- Analyze performance

### Monthly
- Rotate credentials
- Review security policies
- Test disaster recovery
- Update documentation

## Support

For issues or assistance:
- System Administrator: [Contact Info]
- Database Administrator: [Contact Info]
- Auth0 Support: [Contact Info]
- AWS Support: [Contact Info] 