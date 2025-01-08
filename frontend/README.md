# Video Creator Frontend

## Overview
React/Next.js frontend application for the Video Creator platform.

## Current Status

### Completed Features ✅
- Authentication (Initial Implementation)
  - [x] Auth0 Integration
  - [x] Protected Routes
  - [x] Basic User Profile
- Landing Page
  - [x] Modern Hero Section
  - [x] Auto-rotating Image Carousel
  - [x] Responsive Layout
  - [x] Dark/Light Mode Support
  - [x] Initial "How It Works" Section

### In Progress 🔄
- Authentication Rework
  - [ ] Social Login Integration (/api/auth/social)
  - [ ] Email Registration Flow (/api/auth/register)
  - [ ] Profile Management
  - [ ] Session Handling
  - [ ] Permission System Integration
- Landing Page Sections
  - [ ] Features Section
  - [ ] Example Gallery
  - [ ] Testimonials
  - [ ] Pricing Preview
  - [ ] FAQ Section
  - [ ] Final CTA
- Frontend Architecture
  - [ ] Styling System Refinement
  - [ ] Component Architecture Improvements
  - [ ] Error Handling Enhancements

### Next Phase 📝
- Dashboard Implementation
  - [ ] Project Management
  - [ ] Video Creation Flow
  - [ ] Job Management
  - [ ] User Settings
- Advanced Features
  - [ ] Template System
  - [ ] Analytics Integration
  - [ ] Progress Tracking

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
    ├── images/              # Image assets
    └── icons/               # Icon assets
```

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

### Component Guidelines
- Use 'use client' for interactive components
- Implement proper TypeScript types
- Follow established folder structure
- Use withAuth HOC for protected components
- Follow UI/UX guidelines in docs

## Documentation
Detailed documentation available in `/docs`:
- Authentication
- Component Library
- API Integration
- State Management
- UI/UX Guidelines
- Styling Guide
