# Video Creator Frontend

## Overview
React/Next.js frontend application for the Video Creator platform.

## Architecture
```
frontend/
├── src/
│   ├── app/                                                    # Next.js app router pages
│   │   ├── page.tsx                                            # Landing page
│   │   ├── login/            # Auth pages
│   │   ├── dashboard/        # Protected dashboard pages
│   │   └── layout.tsx        # Root layout with providers
│   ├── components/            # React components
│   │   ├── auth/             # Authentication components
│   │   │   ├── login-form.tsx    # Auth0 login component
│   │   │   └── protected.tsx     # Auth wrapper component
│   │   ├── content/          # Content generation components
│   │   │   ├── video-generator.tsx  # Main video creation
│   │   │   └── parameters.tsx       # Generation parameters
│   │   ├── dashboard/        # Dashboard components
│   │   │   ├── dashboard.tsx      # Main dashboard view
│   │   │   ├── stats.tsx          # Usage statistics
│   │   │   └── welcome.tsx        # User welcome section
│   │   ├── jobs/             # Job management components
│   │   │   ├── job-list.tsx       # Jobs overview
│   │   │   ├── job-card.tsx       # Individual job display
│   │   │   └── job-actions.tsx    # Job control buttons
│   │   ├── layout/           # Layout components
│   │   │   ├── nav-bar.tsx        # Top navigation
│   │   │   ├── sidebar.tsx        # Side navigation
│   │   │   └── dashboard-layout.tsx # Dashboard wrapper
│   │   ├── providers/        # Context providers
│   │   │   ├── auth0-provider.tsx  # Auth0 configuration
│   │   │   └── theme-provider.tsx  # Theme management
│   │   └── ui/               # Shared UI components
│   │       ├── button.tsx         # Button components
│   │       ├── input.tsx          # Input components
│   │       └── loading-spinner.tsx # Loading states
│   ├── lib/                  # Shared utilities
│   │   ├── hooks/            # Custom React hooks
│   │   │   ├── useAuth.ts         # Auth state hook
│   │   │   └── useJobs.ts         # Job management hook
│   │   ├── auth/             # Auth utilities
│   │   │   ├── refresh.ts         # Token refresh
│   │   │   └── types.ts           # Auth type definitions
│   │   ├── config.ts         # Configuration
│   │   └── utils.ts          # General utilities
│   └── types/                # TypeScript types
│       ├── auth.ts           # Auth-related types
│       ├── job.ts            # Job-related types
│       └── api.ts            # API response types
└── public/                   # Static assets
│   ├── images/              # Image assets
│   └── icons/               # Icon assets
```

## Current Status

### Completed Features
- [ ] Authentication Setup
  - [x] Auth0 Integration
  - [x] Protected Routes HOC
  - [ ] User Profile
- [ ] Dashboard
  - [x] Basic Layout
  - [ ] User Stats
- [ ] Content Generation
  - [ ] Video Generator
  - [ ] Job Management

### In Progress
- Auth0 Configuration Refinement
- Protected Routes Implementation
- API Integration

## Development

### Prerequisites
- Node.js 18+
- npm/yarn
- Auth0 Account

### Environment Setup
1. Create `.env.local`:
```bash
DEVELOPMENT_AUTH0_DOMAIN=your-domain
DEVELOPMENT_AUTH0_CLIENT_ID=your-client-id
DEVELOPMENT_AUTH0_AUDIENCE=your-audience
```

### Running Locally
```bash
npm install
npm run dev
```

### Authentication Flow
1. User clicks login
2. Redirected to Auth0
3. After auth, returns to dashboard
4. Protected routes/components check auth status

### Component Guidelines
- Use 'use client' for interactive components
- Implement proper TypeScript types
- Follow established folder structure
- Use withAuth HOC for protected components

## Testing
- Unit Tests: `npm run test`
- E2E Tests: `npm run test:e2e`
- Auth Testing Guide in `/docs`

## Deployment
- Environment Variables
- Build Process
- Deployment Checklist

## Documentation
Detailed documentation available in `/docs`:
- Authentication
- Component Library
- API Integration
- State Management
