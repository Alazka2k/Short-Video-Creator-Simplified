# Prerequisites and Initial Setup

## Server Requirements
- Hetzner CX22 server with Ubuntu 22.04
- Domain name (narravid.io) registered and accessible
- Auth0 tenant for staging environment
- AWS S3 bucket for staging environment
- Git access to the repository

## Initial Server Setup
```bash
# Update system packages
apt-get update && apt-get upgrade -y

# Install required packages
apt-get install -y nginx nodejs npm postgresql redis-server certbot python3-certbot-nginx git

# Install PM2 globally
npm install -g pm2

# Create deployment user
adduser deploy
usermod -aG sudo deploy

# Create application directory
mkdir -p /var/www/narravid-staging
chown -R deploy:deploy /var/www/narravid-staging
```

## Repository Setup
```bash
# Switch to deploy user
su - deploy

# Clone the repository
cd /var/www/narravid-staging
git clone https://github.com/your-repo/Short-Video-Creator-Simplified.git .

# Switch to staging branch
git checkout staging
git pull origin staging

# Install Node.js dependencies
npm install  # Install root dependencies
cd frontend
npm install  # Install frontend dependencies
cd ..
```

## PM2 Setup
1. The `ecosystem.config.js` will be available after cloning the repository in:
```
/var/www/narravid-staging/deployment/scripts/ecosystem.config.js
```

2. Copy it to the project root:
```bash
cp deployment/scripts/ecosystem.config.js .
```

3. Before using PM2, ensure:
- Node.js and npm are installed (done in initial setup)
- PM2 is installed globally (done in initial setup)
- Application dependencies are installed (done in repository setup)
- Environment variables are set (covered in Environment Setup guide)
- Database is migrated (covered in Environment Setup guide)

4. PM2 Basic Commands:
```bash
# List all processes
pm2 list

# Start all applications
pm2 start ecosystem.config.js --env staging

# Restart all applications
pm2 restart all

# Stop all applications
pm2 stop all

# View logs
pm2 logs

# Monitor processes
pm2 monit
```

## Directory Structure After Setup
```
/var/www/narravid-staging/
├── frontend/           # Frontend application
├── backend/           # Backend services
├── deployment/
│   ├── scripts/
│   │   ├── ecosystem.config.js
│   │   └── ...
│   └── Deployment_Guide/
│       ├── 01_Prerequisites.md
│       ├── 02_Environment_Setup.md
│       ├── 03_Deployment_Process.md
│       └── 04_Troubleshooting.md
├── ecosystem.config.js # PM2 configuration (copied from deployment/scripts)
├── .env.staging       # Environment variables (to be created)
└── package.json       # Root dependencies
```

## Note on Dependencies
- Root package.json: Contains dependencies for running and managing all services
- Frontend package.json: Contains frontend-specific dependencies
- Both need to be installed separately (done in repository setup)
- Always run `npm install` in both locations after pulling new changes 