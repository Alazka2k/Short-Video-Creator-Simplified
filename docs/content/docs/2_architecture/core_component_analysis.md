---
title: "Core component analysis"
linkTitle: "Architecture"
weight: 1
description: >
  A comprehensive overview of the SHORT-VIDEO-CREATOR-SIMPLIFIED core components.
---


# Core Component Analysis - SHORT-VIDEO-CREATOR-SIMPLIFIED

## 1. Frontend Application
**Technology**: Next.js with Tailwind CSS
**Primary Responsibilities**:
- Landing page and marketing components
- User authentication interface
- Video creation wizard
- User dashboard and workspace

**Key Components**:
1. **Public Pages**:
   - Landing page with service explanation
   - Pricing page with plan comparison
   - Features showcase with mouseover details
   - FAQ section
   - Use cases showcase
   - Login/Registration pages

2. **Creation Wizard**:
   - Simple/Advanced mode toggle
   - Basic input form:
     - Video prompt input
     - Scene count selector
     - Video length selector
     - Additional parameters input
     - Voice selection with previews
     - Aspect ratio selector with recommendations
   - Advanced options:
     - Script style customization
     - Shot style selection
     - Animation type selection
     - Style value adjustment (0-1000)

3. **Scene Review Interface**:
   - Scene preview cards
   - Content recreation controls
   - Progress tracking
   - Download options
   - Final video generation trigger

4. **Workspace/Library**:
   - Video project listing
   - Project settings display
   - Creation history
   - Resource usage tracking

## 2. Authentication Service
**Technology**: Node.js with Express
**Primary Responsibilities**:
- Social login (Google, Apple)
- Email/password authentication
- Session management
- Authorization control

**Key Features**:
- JWT-based authentication
- Secure password handling
- OAuth2 integration
- Role-based access control

## 3. Billing/Premium Service
**Technology**: Node.js with Express
**Primary Responsibilities**:
- Credit package management
- Premium feature access
- Transaction tracking
- Billing information management

**Key Features**:
- Credit purchase system
- Usage tracking
- Premium feature flags:
   - Watermark control
   - Video length limits
   - Daily creation limits
   - Scene recreation access

## 4. Job Service
**Technology**: Node.js with Express
**Primary Responsibilities**:
- Job orchestration
- Service coordination
- Progress tracking
- Resource management

**API Endpoints**:
- POST /api/job/generate
- GET /api/job/jobs/:jobId
- GET /api/job/jobs

## 5. Content Generation Services

### 5.1 LLM Service (Existing)
**API Endpoint**: POST /api/llm/generate
**Key Features**:
- Script generation with parameters
- Scene structuring
- Content optimization
- Metadata generation

### 5.2 Voice Service (Existing)
**API Endpoint**: POST /api/voice/generate
**Key Features**:
- Voice synthesis
- Multiple voice options
- Scene-based narration
- Audio file management

### 5.3 Image Service (Existing)
**API Endpoint**: POST /api/image/generate
**Key Features**:
- Image generation
- Style customization
- Aspect ratio handling
- Scene visualization

### 5.4 Animation Service (Existing)
**API Endpoint**: POST /api/animation/generate
**Key Features**:
- Animation creation
- Multiple animation types
- Scene-based processing
- File management

### 5.5 Video Service (Existing)
**API Endpoint**: POST /api/video/generate
**Key Features**:
- Video scene creation
- Camera movement handling
- Format management
- Quality control

## 6. Final Video Creation Service
**Technology**: Node.js with Express
**Integration**: JSON2Video API
**Primary Responsibilities**:
- Scene compilation
- Complete video assembly
- Export management
- Quality verification

## 7. Database Layer
**Technology**: PostgreSQL with Knex.js
**Schema**: Already implemented with tables for:
- User management
- Content tracking
- Job management
- Billing/credits
- Service outputs

## 8. File Storage System
**Technology**: Local filesystem (MVP)
**Structure**:
- Date-based organization
- Job-based separation
- Service-specific directories
- Metadata management

## 9. API Gateway
**Technology**: Node.js with Express
**Port**: 3000
**Key Features**:
- Route management
- Service coordination
- Health monitoring
- Error handling

## Integration Points

| Service | Primary Integrations | Dependencies |
|---------|---------------------|--------------|
| Frontend | Gateway, Auth | All Services |
| Auth | Database | Frontend |
| Billing | Auth, Database | Frontend |
| Job | All Services | Gateway |
| LLM | OpenAI, Database | Job Service |
| Voice | ElevenLabs, Database | Job Service |
| Image | Midjourney, Database | Job Service |
| Animation | ImmersityAI, Database | Job Service |
| Video | LumaAI, Database | Job Service |
| Final Video | JSON2Video, Database | All Services |

## Performance Requirements
- API response time < 200ms
- Job updates < 500ms
- File operations < 1s
- Support for 10 users/hour initially

## Error Handling
- Basic error notification system
- Service retry mechanisms
- User-friendly error messages
- Activity logging

This analysis reflects the specific features and implementations detailed in the project documentation while maintaining alignment with the planned development phases.