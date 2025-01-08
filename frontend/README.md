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
  - [x] "How It Works" Section with Process Steps
  - [x] Smooth Animations and Transitions

### In Progress 🔄
- Authentication Rework
  - [ ] Social Login Integration (/api/auth/social)
  - [ ] Email Registration Flow (/api/auth/register)
  - [ ] Profile Management
  - [ ] Session Handling
  - [ ] Permission System Integration
- Landing Page Sections
  - [ ] Features Section (Next)
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
```frontend/
├── public/                                                # Static assets
│   ├── demo/                                             # Demo content
│   ├── file.svg                                          # SVG assets
│   ├── globe.svg
│   ├── next.svg
│   ├── vercel.svg
│   └── window.svg
├── src/
│   ├── app/                                             # Next.js app router pages
│   │   ├── api/                                         # API routes
│   │   │   └── auth/                                    # Auth API endpoints
│   │   │       ├── [...nextauth]/                      # NextAuth.js configuration
│   │   │       │   └── route.ts                        # NextAuth route handler
│   │   │       ├── callback/                           # Auth callbacks
│   │   │       │   └── route.ts                        # Callback handler
│   │   │       └── user/                               # User management
│   │   │           └── route.ts                        # User routes
│   │   ├── (auth)/                                     # Auth routes
│   │   │   ├── layout.tsx                              # Auth layout
│   │   │   └── login/                                  # Login pages
│   │   │       └── page.tsx                            # Login page
│   │   ├── (dashboard)/                                # Protected dashboard routes
│   │   │   ├── create/                                 # Video creation
│   │   │   │   └── page.tsx                           # Creation page
│   │   │   ├── settings/                               # User settings
│   │   │   │   └── page.tsx                           # Settings page
│   │   │   ├── videos/                                 # Video management
│   │   │   │   └── page.tsx                           # Videos list page
│   │   │   └── layout.tsx                              # Dashboard layout
│   │   ├── (marketing)/                                # Marketing pages
│   │   │   ├── features/                               # Features pages
│   │   │   │   ├── page.tsx                           # Features page
│   │   │   │   └── layout.tsx                         # Features layout
│   │   │   ├── page.tsx                                # Landing page
│   │   │   └── layout.tsx                              # Marketing layout
│   │   ├── dashboard/                                  # Dashboard pages
│   │   │   ├── layout.tsx                              # Dashboard layout
│   │   │   └── page.tsx                                # Dashboard home
│   │   ├── login/                                      # Login section
│   │   │   └── page.tsx                                # Login page
│   │   ├── favicon.ico                                 # Site favicon
│   │   └── layout.tsx                                  # Root layout
│   ├── components/                                     # React components
│   │   ├── auth/                                      # Authentication components
│   │   │   ├── feature-slideshow.tsx                   # Feature slideshow
│   │   │   ├── login-form.tsx                          # Login form
│   │   │   └── protected-route.tsx                     # Route protection
│   │   ├── content/                                   # Content components
│   │   │   └── video-generator.tsx                     # Video generator
│   │   ├── dashboard/                                 # Dashboard components
│   │   │   └── dashboard.tsx                           # Dashboard main
│   │   ├── jobs/                                      # Job components
│   │   │   └── job-list.tsx                           # Jobs list
│   │   ├── layout/                                    # Layout components
│   │   │   ├── dashboard-header.tsx                    # Dashboard header
│   │   │   ├── dashboard-layout.tsx                    # Dashboard layout
│   │   │   ├── header.tsx                              # Main header
│   │   │   ├── nav-bar.tsx                            # Navigation bar
│   │   │   └── sidebar.tsx                            # Sidebar
│   │   ├── llm/                                       # LLM components
│   │   │   └── generate-content.tsx                    # Content generator
│   │   ├── marketing/                                 # Marketing components
│   │   │   ├── features/                              # Features section
│   │   │   │   └── FeaturesSection.tsx                # Features grid
│   │   │   ├── hero/                                  # Hero section
│   │   │   │   ├── HeroCTA.tsx                        # Call-to-action
│   │   │   │   ├── HeroSection.tsx                    # Hero main
│   │   │   │   ├── HeroVideo.tsx                      # Hero video
│   │   │   │   └── types.d.ts                         # Hero types
│   │   │   ├── process/                               # Process section
│   │   │   │   └── ProcessSection.tsx                 # Process steps
│   │   │   ├── footer.tsx                             # Marketing footer
│   │   │   └── header.tsx                             # Marketing header
│   │   ├── providers/                                 # Context providers
│   │   │   ├── auth0-provider.tsx                     # Auth0 provider
│   │   │   └── theme-provider.tsx                     # Theme provider
│   │   ├── ui/                                       # Shared UI components
│   │   │   ├── button.tsx                            # Button component
│   │   │   ├── card.tsx                              # Card component
│   │   │   ├── dropdown-menu.tsx                     # Dropdown menu
│   │   │   ├── index.ts                              # UI barrel file
│   │   │   ├── input.tsx                             # Input component
│   │   │   ├── loading-spinner.tsx                   # Loading spinner
│   │   │   ├── loading.tsx                           # Loading state
│   │   │   ├── textarea.tsx                          # Textarea component
│   │   │   ├── toast.tsx                             # Toast component
│   │   │   └── use-toast.tsx                         # Toast hook
│   │   ├── video/                                    # Video components
│   │   │   └── creation-form.tsx                     # Video creation form
│   │   └── theme-toggle.tsx                          # Theme toggle
│   ├── lib/                                          # Shared utilities
│   │   └── utils.ts                                   # Utility functions
│   ├── styles/                                       # Styling
│   │   └── globals.css                               # Global styles
│   └── types/                                        # TypeScript types
│       └── shared.d.ts                               # Shared type definitions
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
