# Frontend Deployment Strategy

This document outlines the complete strategy for deploying the frontend application to production environments. It covers all necessary steps, configurations, and potential issues to ensure smooth and efficient deployments.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Configuration](#environment-configuration)
3. [Build Configuration](#build-configuration)
4. [Deployment Platforms](#deployment-platforms)
5. [Domain Configuration](#domain-configuration)
6. [Common Issues and Solutions](#common-issues-and-solutions)
7. [Continuous Integration/Continuous Deployment](#continuous-integrationcontinuous-deployment)
8. [Post-Deployment Verification](#post-deployment-verification)

## Prerequisites

Before deploying the frontend application, ensure you have:

- Access to the repository with proper permissions
- Required environment variables documented and available
- Access to the deployment platform (Vercel, AWS, etc.)
- Domain registrar access (if configuring custom domains)
- Authentication provider credentials (Auth0, etc.)

## Environment Configuration

### Required Environment Variables

The application requires the following environment variables:

```
# Application URLs
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXT_PUBLIC_API_URL=https://api.your-domain.com

# Auth0 Configuration
NEXT_PUBLIC_AUTH0_DOMAIN=your-tenant.auth0.com
NEXT_PUBLIC_AUTH0_AUDIENCE=https://your-api-identifier
NEXT_PUBLIC_AUTH0_SPA_CLIENT_ID=your-client-id
AUTH0_M2M_CLIENT_ID=your-m2m-client-id
AUTH0_M2M_CLIENT_SECRET=your-m2m-client-secret

# Beehiiv Newsletter Integration
BEEHIIV_PUBLICATION_ID=your-publication-id
BEEHIIV_API_KEY=your-api-key

# Email Configuration
SMTP_HOST=your-smtp-host
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-smtp-username
SMTP_PASSWORD=your-smtp-password
CONTACT_FROM_EMAIL=no-reply@your-domain.com
CONTACT_TO_EMAIL=contact@your-domain.com
CONTACT_REPLY_TO=contact@your-domain.com
```

### Environment Validation

Our application includes automatic environment validation in development mode. In `lib/debug/env-logger.ts`, the application logs the presence of required variables and warns about missing configurations.

For security reasons, sensitive values are not logged in production environments.

## Build Configuration

### Next.js Configuration

The `next.config.js` file contains critical settings for the build process:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Rendering strategy - options: 'server', 'static', or 'hybrid'
  output: 'hybrid',
  
  // Middleware configuration
  skipMiddlewareUrlNormalize: true,
  skipTrailingSlashRedirect: true,
  
  // Disable linting and type checking during builds for faster deployments
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // CORS and security headers configuration
  async headers() {
    return [
      // CORS headers for API routes and authenticated areas
      // ...header configurations
    ]
  }
}
```

### Dynamic vs Static Rendering

For pages requiring authentication or user-specific data, use the following export in the page file:

```typescript
// Add this to pages that should not be statically generated
export { dynamic, fetchCache, revalidate } from '@/lib/config';
```

These flags are defined in `lib/config.ts`:

```typescript
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;
```

### Package.json Scripts

Ensure these scripts are properly configured in your package.json:

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "next lint"
}
```

### Vercel Configuration

The `vercel.json` file customizes the build and install process:

```json
{
  "installCommand": "npm cache clean --force && npm config set registry https://registry.npmjs.org/ && npm install --no-audit --no-fund --legacy-peer-deps",
  "buildCommand": "npm install -g cross-env && npm run build",
  "framework": "nextjs"
}
```

## Deployment Platforms

### Vercel (Recommended)

Vercel is optimized for Next.js applications and provides the simplest deployment process.

#### Deployment Steps:

1. Import your project from GitHub, GitLab, or Bitbucket
2. Configure the build settings:
   - Root Directory: `./frontend` (if in a monorepo)
   - Framework Preset: Next.js
3. Configure environment variables
4. Deploy

#### Vercel-Specific Considerations:

- Use the Vercel CLI for testing deployments locally
- Configure Preview Deployments for branches and PRs
- Set up deployment protection for production environments

### AWS Amplify (Alternative)

For AWS-integrated projects, Amplify provides a streamlined deployment process.

#### Deployment Steps:

1. Connect repository
2. Configure build settings using the `amplify.yml` file
3. Set environment variables
4. Deploy

## Domain Configuration

### Custom Domain Setup

#### 1. Domain Registration

Purchase your domain through a registrar (Namecheap, GoDaddy, Squarespace, etc.)

#### 2. DNS Configuration for Vercel

Add the following DNS records in your domain registrar:

- **A Record**: 
  - Host: @ (or root)
  - Value: 76.76.21.21 (Vercel's IP)
  - TTL: 3600 (or default)

- **CNAME Record**:
  - Host: www
  - Value: cname.vercel-dns.com.
  - TTL: 3600 (or default)

#### 3. Alternative: Nameserver Configuration

If you encounter issues with individual DNS records, you can use Vercel's nameservers:

- ns1.vercel-dns.com
- ns2.vercel-dns.com

#### 4. SSL/TLS Configuration

Vercel automatically provisions SSL certificates for custom domains. Ensure:

- DNS is properly configured
- Domain verification is complete
- Force HTTPS is enabled in settings

### Multi-Environment Domains

For projects with multiple environments:

- Production: yourdomain.com
- Staging: staging.yourdomain.com
- Development: dev.yourdomain.com

## Common Issues and Solutions

### Build Errors

#### Static Generation Errors

**Issue**: Errors during prerendering of pages with client-side code

**Solution**: 
- Mark pages as dynamic using `export const dynamic = 'force-dynamic'`
- Configure Next.js to use hybrid or server output
- Update the Auth0 provider to handle static build scenarios

```typescript
// In auth0-provider.tsx
const isStaticBuild = typeof window === 'undefined' && process.env.NODE_ENV === 'production';
if (isStaticBuild) {
  return <>{children}</>;
}
```

#### Package Dependencies Issues

**Issue**: Errors with package installation or peer dependencies

**Solution**:
- Use `--legacy-peer-deps` flag
- Create package overrides in package.json
- Ensure all dependencies are properly declared

### Runtime Errors

#### Authentication Issues

**Issue**: Auth0 or authentication flows not working

**Solution**:
- Verify environment variables
- Check callback URLs in Auth0 dashboard
- Ensure proper CORS and security headers
- Verify redirect URIs match exactly

#### API Connectivity Issues

**Issue**: Frontend cannot connect to backend services

**Solution**:
- Verify API URL environment variable
- Check CORS configuration
- Ensure proper authentication tokens are being sent
- Verify network rules and firewall settings

## Continuous Integration/Continuous Deployment

### GitHub Actions Workflow

Example workflow for CI/CD:

```yaml
name: Frontend CI/CD

on:
  push:
    branches: [main]
    paths:
      - 'frontend/**'
  pull_request:
    branches: [main]
    paths:
      - 'frontend/**'

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: cd frontend && npm ci
        
      - name: Run linting
        run: cd frontend && npm run lint
        
      - name: Run tests
        run: cd frontend && npm test
        
      - name: Build
        run: cd frontend && npm run build
        
  deploy:
    needs: build-and-test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v2
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: ./frontend
          vercel-args: '--prod'
```

### Branch-Based Deployments

Strategy for different branches:

- `main` → Production environment
- `staging` → Staging environment
- `feature/*` → Preview environments

## Post-Deployment Verification

After deployment, verify:

1. **Application Loading**: Check that the application loads without errors
2. **Authentication**: Verify login/signup flows
3. **Critical User Flows**: Test main user journeys
4. **API Integration**: Confirm API endpoints are accessible
5. **Mobile Responsiveness**: Verify layout on mobile devices
6. **Performance**: Check page load times and Core Web Vitals
7. **SEO**: Verify meta tags and indexability

### Automated Monitoring

Consider implementing:

- Uptime monitoring (Pingdom, UptimeRobot)
- Error tracking (Sentry)
- Analytics (Google Analytics, Plausible)
- Real User Monitoring (RUM)

## Conclusion

Following this deployment strategy will ensure consistent, reliable deployments of the frontend application. Adapt these guidelines as the application evolves, and document any platform-specific considerations that arise.

---

## Appendix: Deployment Checklist

Quick reference checklist for deployments:

- [ ] Environment variables configured
- [ ] Build configuration updated
- [ ] Package dependencies resolved
- [ ] Authentication providers configured
- [ ] API endpoints accessible
- [ ] DNS records configured
- [ ] SSL/TLS certificates provisioned
- [ ] Post-deployment verification completed
