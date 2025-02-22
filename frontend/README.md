# Video Creator Frontend

## Overview
React/Next.js frontend application for the Video Creator platform.

## Current Status

### Completed Features ✅
- Authentication (Initial Implementation)
  - [x] Auth0 Integration
  - [x] Protected Routes
  - [x] Basic User Profile
  - [x] M2M Token Flow (Initial implementation for /job endpoint)
  - [x] API Proxy Implementation
- Landing Page
  - [x] Modern Hero Section
  - [x] Auto-rotating Image Carousel
  - [x] Responsive Layout
  - [x] Dark/Light Mode Support
  - [x] "How It Works" Section with Process Steps
  - [x] Features Section with Modern Grid
  - [x] Showcase Page with Real Examples
  - [x] Testimonials with Success Stories
  - [x] Smooth Animations and Transitions
- Authentication Rework
  - [x] Social Login Integration (/api/auth/social)
  - [x] Email Registration Flow (/api/auth/register)
  - [x] Session Handling
  - [x] Permission System Integration
- Dashboard Implementation
  - [x] Main Layout
  - [x] Navigation Structure
  - [x] Project/Video List View (Prototype)
  - [x] Quick Actions Menu
- Content Creation Flow
  - [x] Basic Creation Form
  - [x] Script Settings Implementation
  - [x] Visual Settings Implementation
  - [x] Settings Overview Panel
  - [x] Progress Visualization
  - [x] Format Selection Interface
  - [x] Visual Style Selection
  - [x] Content Type Selection
  - [x] Visualization Type Selection
  - [x] Real-time Settings Summary
- Content Creation Overview & Dashboard
  - [x] Basic job creation and processing
  - [x] Job service integration
  - [x] Content generation pipeline
  - [x] Video details page (/videos/:id)
  - [x] Overview Dashboard about current projects / jobs
  - [x] Open each job run to see more details about the content created
  - [x] Possibility to recreate or add certain parts of the content
  - [x] Possibility to download the content as a zip file or each single file
  - [x] Possibility to go on with the video creation flow process
- Video Creation & Assembly
  - [x] Video creation interface
  - [x] Scene transition selection between scenes
  - [x] Video Assembly with transitions
  - [x] Download individual scenes and assets
  - [x] Preview of generated content (images, videos, animations)
  - [x] Scene management and organization
  - [x] Multiple aspect ratio support (16:9, 9:16, 1:1)
  - [x] Visual style customization
  - [x] Shot style selection
- Frontend Architecture
  - [x] Styling System Refinement
  - [x] Component Architecture Improvements
  - [x] Error Handling Enhancements
  - [x] Extend M2M token flow to all service endpoints
  - [x] Responsive design implementation
  - [x] Dark/Light theme support
  - [x] Loading states and animations
  - [x] Toast notifications
  - [x] Error boundaries

### In Progress 🔄
- Landing Page Sections
  - [ ] Pricing Preview
  - [ ] FAQ Section

### Next Phase 📝
- General Dashboard Enhancement
  - [ ] Project Management
  - [ ] Job Management
  - [ ] User Settings
- Advanced Features
  - [ ] Template System
  - [ ] Analytics Integration
  - [ ] Progress Tracking

## Project Structure
```frontend/
├── public/                                                       # Static assets
│   ├── testimonials/                                               # Testimonial images
│   ├── channels/                                                   # Channel icons
│   ├── creation/                                                   # Creation assets
│   │   ├── aspect-ratio/                                             # Aspect ratio previews
│   │   ├── visual-settings/                                          # Visual settings assets
│   │   │   └── shot-styles/                                            # Shot style previews
│   │   ├── visualization-type-preview/                               # Visualization type previews
│   │   └── voice-selection-persona/                                  # Voice selection persona
│   ├── features/                                                   # Feature icons
│   │   ├── visual/                                                   # Visual on Visual Creation (png)
│   │   │   ├── artist-samples/                                         # Artist Samples (png)
│   │   │   ├── aspect-ratios/                                          # Aspect Ratios (png)
│   │   │   └── shot-style-samples/                                     # Shot Style Samples (png)
│   │   ├── voice-samples/                                            # Voice Samples (mp3)
│   │   ├── music/                                                    # Music on Scene Assembly (mp3)
│   │   └── video/                                                    # Video on Scene Assembly (mp4)
│   ├── demo/                                                       # Demo content
│   ├── login/                                                      # Login Image
│   ├── reset-password/                                             # Reset Password Image
│   ├── signup/                                                     # Signup Image
│   ├── file.svg                                                    
│   ├── globe.svg                                                   
│   ├── next.svg
│   ├── vercel.svg
│   └── window.svg
├── src/
│   ├── app/                                                        # Next.js app router pages
│   │   ├── (auth)/                                                   # Auth routes
│   │   │   └──  layout.tsx                                               # Auth layout
│   │   ├── (dashboard)/                                              # Dashboard routes
│   │   │   ├── create/                                                 # Video creation
│   │   │   │   └── page.tsx                                            # Creation page
│   │   │   ├── settings/                                               # User settings
│   │   │   │   └── page.tsx                                              # Settings page
│   │   │   ├── videos/                                                 # Video management
│   │   │   │   └── page.tsx                                              # Videos list page
│   │   │   └── layout.tsx                                              # Dashboard layout
│   │   ├── (marketing)/                                              # Marketing routes
│   │   │   ├── features/                                               # Features pages
│   │   │   │   └──  page.tsx                                             # Features page
│   │   │   ├── showcase/                                               # Showcase pages
│   │   │   │   └── page.tsx                                              # Showcase page
│   │   │   └── page.tsx                                              # Landing page
│   │   │   └── layout.tsx                                            # Marketing layout
│   │   ├── api/                                                      # API routes
│   │   │   └── auth/                                                   # Auth API endpoints
│   │   │       ├── [...nextauth]/                                       # NextAuth.js configuration
│   │   │       │   └── route.ts                                         # NextAuth route handler
│   │   │       ├── callback/                                           # Auth callbacks
│   │   │       │   └── route.ts                                          # Callback handler
│   │   │       └── user/                                               # User management
│   │   │           └── route.ts                                          # User routes
│   │   ├── dashboard/                                                # Dashboard pages
│   │   │   └── layout.tsx                                              # Dashboard layout
│   │   │   └── page.tsx                                                # Dashboard home
│   │   ├── login/                                                    # Login section
│   │   │   └── page.tsx                                                # Login page
│   │   ├── favicon.ico                                 
│   │   └── layout.tsx                                                # Root layout
│   ├── components/                                                 # React components
│   │   ├── auth/                                                     # Authentication components
│   │   │   ├── feature-slideshow.tsx                                   # Feature slideshow
│   │   │   ├── login-form.tsx                                          # Login form
│   │   │   ├── password-validation.tsx                                 # Password validation
│   │   │   ├── protected-route.tsx                                     # Route protection
│   │   │   ├── reset-password-form.tsx                                 # Reset password form
│   │   │   └── signup-form.tsx                                         # Signup form
│   │   ├── content/                                                  # Content components
│   │   │   └── video-generator.tsx                                     # Video generator
│   │   ├── dashboard/                                                # Dashboard components
│   │   │   └── dashboard.tsx                                           # Dashboard main
│   │   ├── jobs/                                                     # Job components
│   │   │   └── job-list.tsx                                            # Jobs list
│   │   ├── layout/                                                   # Layout components
│   │   │   ├── dashboard-header.tsx                                    # Dashboard header
│   │   │   ├── dashboard-layout.tsx                                    # Dashboard layout
│   │   │   ├── header.tsx                                              # Main header
│   │   │   ├── nav-bar.tsx                                             # Navigation bar
│   │   │   └── sidebar.tsx                                             # Sidebar
│   │   ├── llm/                                                      # LLM components
│   │   │   └── generate-content.tsx                                    # Content generator
│   │   ├── marketing/                                                # Marketing components
│   │   │   ├── features/                                               # Features site
│   │   │   │   ├── demos/                                                # Features demo components
│   │   │   │   │   ├── ContentGenerationDemo.tsx                         # Content Generation Demo
│   │   │   │   │   ├── ModularWorkflowDemo.tsx                           # Modular Workflow Demo
│   │   │   │   │   ├── PlatformOptimizationDemo.tsx                      # Platform Optimization Demo
│   │   │   │   │   ├── SceneAssemblyDemo.tsx                             # Scene Assembly Demo
│   │   │   │   │   ├── VisualCreationDemo.tsx                            # Visual Creation Demo
│   │   │   │   │   └── VoiceGenerationDemo.tsx                           # Voice Generation Demo
│   │   │   │   ├── FeaturesCard.tsx                                    # Features card
│   │   │   │   ├── FeaturesDemo.tsx                                    # Features demo
│   │   │   │   ├── FeaturesSection.tsx                                 # Features main page
│   │   │   │   └── LandingFeaturesSection.tsx                          # Features section (landing page)
│   │   │   ├── hero/                                                 # Hero section
│   │   │   │   ├── HeroCTA.tsx                                         # Call-to-action
│   │   │   │   ├── HeroSection.tsx                                     # Hero main
│   │   │   │   ├── HeroVideo.tsx                                       # Hero video
│   │   │   │   └── types.d.ts                                          # Hero types
│   │   │   ├── process/                                              # Process section (landing page)
│   │   │   │   └── ProcessSection.tsx                                  # Process steps
│   │   │   ├── showcase/                                             # Showcase components 
│   │   │   │   ├── ClientVideoGrid.tsx                                 # Client video grid
│   │   │   │   ├── VideoCard.tsx                                       # Video preview card
│   │   │   │   ├── VideoGrid.tsx                                       # Video grid
│   │   │   │   └── VideoPlayerModal.tsx                                # Video player modal
│   │   │   ├── testimonials/                                         # Testimonials section (landing page)
│   │   │   │   └── TestimonialsSection.tsx                             # Testimonials grid
│   │   │   ├── footer.tsx                                            # Marketing footer
│   │   │   └── header.tsx                                            # Marketing header
│   │   ├── providers/                                              # Context providers
│   │   │   ├── auth0-provider.tsx                                    # Auth0 provider
│   │   │   └── theme-provider.tsx                                    # Theme provider
│   │   ├── ui/
│   │   │   ├── 3d-carousel.tsx
│   │   │   ├── aspect-ratio.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── checkbox.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── hover-border-gradient.tsx
│   │   │   ├── index.ts
│   │   │   ├── input.tsx
│   │   │   ├── label.tsx
│   │   │   ├── loading-spinner.tsx
│   │   │   ├── loading.tsx
│   │   │   ├── progress.tsx
│   │   │   ├── scroll-area.tsx
│   │   │   ├── skeleton.tsx
│   │   │   ├── slider.tsx
│   │   │   ├── switch.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── text-generate-effect.tsx
│   │   │   ├── textarea.tsx
│   │   │   ├── toast.tsx
│   │   │   ├── toaster.tsx
│   │   │   ├── tooltip.tsx
│   │   │   ├── tubelight-navbar.tsx
│   │   │   └── use-toast.tsx
│   │   ├── video/                                                  # Video components
│   │   │   └── creation-form.tsx                                     # Video creation form
│   │   ├── video-creation/                                          # Video creation components
│   │   │   ├── sections/                                             # Creation flow sections
│   │   │   │   ├── RequiredContentSelection.tsx                       # Basic info section
│   │   │   │   ├── FormatSelection.tsx                               # Format selection
│   │   │   │   ├── ProcessSteps.tsx                                 # Process steps
│   │   │   │   ├── ScriptPreviewPanel.tsx                           # Script preview panel
│   │   │   │   ├── SettingsSummary.tsx                               # Settings summary
│   │   │   │   ├── VisualStyleCarrousel.tsx                        # Visual style carrousel
│   │   │   │   └── VisualizationTypeSelection.tsx                     # Visualization type selection
│   │   │   ├── steps/                                                # Creation flow steps
│   │   │   │   ├── BasicInformationStep.tsx                           # Basic info step
│   │   │   │   ├── ContentSelectionStep.tsx                           # Content settings step
│   │   │   │   ├── MusicSettingsStep.tsx                            # Music settings step (not in use)
│   │   │   │   ├── ScriptSettingsStep.tsx                            # Script settings step
│   │   │   │   ├── VisualSettingsStep.tsx                            # Visual settings step
│   │   │   │   └── VoiceSettingsStep.tsx                            # Voice settings step
│   │   │   ├── types.ts                                              # Video creation types
│   │   │   └── VideoCreationFlow.tsx                                 # Main creation flow
│   │   └── theme-toggle.tsx                                        # Theme toggle
│   ├── data/                                                     # Data configurations (json)
│   │   ├── error/                                                  # Error configuration
│   │   │   └── login.json                                            # Login configuration
│   │   ├── features/                                               # Features configuration
│   │   │   ├── content-generation.json                               # Content Generation configuration
│   │   │   ├── scenes.json                                           # Scenes configuration
│   │   │   ├── visual-creation.json                                  # Visual Creation configuration
│   │   │   └── voices.json                                           # Voices configuration
│   │   ├── video-creation/                                        # Video creation data
│   │   │   ├── basic/                                             # Basic video creation data
│   │   │   │   ├── focus-prompt.json                                 # Focus prompt
│   │   │   │   └── input-prompt.json                                 # Input prompt
│   │   │   └── image/                                             # Image settings data
│   │   │   │   ├── artist-style_select-options.json                  # Artist style options
│   │   │   │   ├── aspect-ratio_select-options.json                  # Aspect ratio options
│   │   │   │   └── shot-style_select-options.json                    # Shot style options
│   │   │   └── script/                                            # Script settings data
│   │   │   │   ├── character-perspective_select-option.json          # Character options
│   │   │   │   ├── pacing-structure_select-option.json               # Pacing options
│   │   │   │   ├── script-tone_select-option.json                    # Tone options
│   │   │   │   └── vocabulary_select-option.json                     # Vocabulary options
│   │   │   └── summary/                                            # Summary settings data
│   │   │   │   └── summary-labels.json                             # Summary labels
│   │   │   └── voice/                                              # Voice settings data
│   │   │   │   └── voice-select-options.json                         # Voice select options
│   │   └── showcase-videos.json                                    # Showcase videos configuration
│   │   └── testimonials.json                                       # Testimonials configuration
│   ├── lib/                                                      # Shared utilities
│   │   ├── auth/                                                   # Auth utilities
│   │   │   ├── AuthContext.tsx                                       # Auth context
│   │   │   ├── config.ts                                             # Configuration
│   │   │   └── refresh.ts                                            # Refresh token
│   │   ├── debug/                                                  # Debug utilities
│   │   │   ├── auth-logger.tsx                                       # Auth logger
│   │   │   └── env-logger.tsx                                        # Env logger
│   │   ├── errors/                                                 # Error utilities
│   │   │   └── auth.ts                                               # Auth error
│   │   ├── hoc/                                                    # Higher-Order Components
│   │   │   └── withAuth.tsx                                          # Auth HOC
│   │   ├── hooks/                                                  # Hooks
│   │   │   └── useAuth.tsx                                           # Auth hook
│   │   │   └── useVideoCreationState.tsx                             # Video creation state hook
│   │   ├── types/                                                  # TypeScript types
│   │   │   └── protected-component.ts                                # Protected component type
│   │   ├── auth.ts                                                 # Auth state utility functions
│   │   ├── debug.ts                                                # Debug utility
│   │   └── utils.ts                                                # Utility functions
│   ├── styles/                                                   # Styling
│   │   └── globals.css                                             # Global styles
│   ├── data/                                                     # Data configurations (json)
│   │   ├── error/                                                  # Error configuration
│   │   │   └── login.json                                            # Login configuration
│   │   ├── features/                                               # Features configuration
│   │   │   ├── content-generation.json                               # Content Generation configuration
│   │   │   ├── scenes.json                                           # Scenes configuration
│   │   │   ├── visual-creation.json                                  # Visual Creation configuration
│   │   │   └── voices.json                                           # Voices configuration
│   │   ├── video-creation/                                        # Video creation data
│   │   │   ├── script/                                             # Script settings data
│   │   │   │   ├── character-perspective_select-option.json          # Character options
│   │   │   │   ├── pacing-structure_select-option.json               # Pacing options
│   │   │   │   ├── script-tone_select-option.json                    # Tone options
│   │   │   │   └── vocabulary_select-option.json                     # Vocabulary options
│   │   │   ├── image/                                             # Image settings data
│   │   │   │   ├── artist-samples/                                   # Artist Samples (png)
│   │   │   │   ├── aspect-ratios/                                    # Aspect Ratios (png)
│   │   │   │   └── shot-style-samples/                               # Shot Style Samples (png)
│   │   │   ├── voice/                                             # Voice settings data
│   │   │   │   └── voice-samples/                                   # Voice Samples (mp3)
│   │   │   ├── music/                                             # Music (mp3)
│   │   │   └── video/                                             # Video (mp4)
│   │   └── showcase-videos.json                                  # Showcase videos configuration
│   └── testimonials.json                                       # Testimonials configuration
```

## Development

### Prerequisites
- Node.js 18+
- npm/yarn
- Auth0 Account

### Environment Setup
1. Create `.env.development`:
```bash
# Single Page Application Credentials   
NEXT_PUBLIC_APP_URL=http://localhost:4000
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_AUTH0_DOMAIN=your-dev-domain.auth0.com
NEXT_PUBLIC_AUTH0_AUDIENCE=your-dev-audience
# SPA Application Credentials
NEXT_PUBLIC_AUTH0_SPA_CLIENT_ID=your-dev-spa-client-id
# M2M Application Credentials
NEXT_PUBLIC_AUTH0_M2M_CLIENT_ID=your-dev-m2m-client-id
NEXT_PUBLIC_AUTH0_M2M_CLIENT_SECRET=your-dev-m2m-client-secret
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
