'use client'

import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { useAuth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { config } from '@/lib/config'

/**
 * Dashboard Layout Component
 * 
 * Main layout wrapper for all dashboard pages. Provides the structure and
 * common elements shared across all dashboard views.
 * 
 * Features:
 * - Protected route wrapper
 * - Responsive layout structure
 * - Integration with header and sidebar
 * - Content area management
 * - Authentication check
 * 
 * Layout Structure:
 * - Fixed header at top
 * - Sidebar on left (desktop)
 * - Main content area
 * - Responsive padding/margins
 * 
 * Responsibilities:
 * - Authentication protection
 * - Layout structure
 * - Responsive behavior
 * - Component composition
 * 
 * @component
 * @example
 * ```tsx
 * <DashboardLayout>
 *   <DashboardContent />
 * </DashboardLayout>
 * ```
 */

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { token } = useAuth()

  if (!token) {
    redirect('/login')
  }

  const authSettings = {
    ...config.auth.auth0,
    // ... other settings
  }

  return (
    <div className="min-h-screen bg-bg-main">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  )
} 