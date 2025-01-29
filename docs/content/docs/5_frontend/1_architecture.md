# Frontend Architecture

## Overview
The frontend is built using Next.js 14 with App Router, TypeScript, and Tailwind CSS. It follows a component-driven architecture with clear separation of concerns.

## Core Architecture Principles
- **Component-Based**: Modular components for reusability and maintainability
- **Type Safety**: Strict TypeScript usage throughout
- **Server/Client Split**: Clear separation of server and client components
- **Route Groups**: Organized routing using Next.js route groups

## Directory Structure
```
frontend/src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Authentication routes
│   ├── (dashboard)/       # Protected dashboard routes
│   ├── (marketing)/       # Public marketing pages
│   └── api/               # API routes
├── components/            # Reusable components
│   ├── auth/             # Authentication components
│   ├── dashboard/        # Dashboard-specific components
│   ├── layout/           # Layout components
│   ├── marketing/        # Marketing components
│   ├── providers/        # Context providers
│   ├── video-creation/  # Video creation components
│   │   ├── sections/     # Video creation sections
│   │   ├── steps/        # Video creation steps
│   │   ├── videocreationflow.tsx 
│   └── ui/              # UI component library
├── lib/                  # Utility functions and hooks
├── styles/              # Global styles
└── types/               # TypeScript type definitions
```

## Key Technologies
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Shadcn/ui Components
- Zustand (State Management)
- React Query (Data Fetching) 