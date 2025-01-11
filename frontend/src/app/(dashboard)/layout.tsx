'use client';

/**
 * Dashboard Layout Component
 * 
 * This component serves as the main layout wrapper for all dashboard pages.
 * It provides the consistent structure for the dashboard including:
 * - Header navigation
 * - Sidebar navigation
 * - Main content area
 * 
 * The layout uses a responsive design that:
 * - Shows sidebar on large screens
 * - Maintains minimum height for content area
 * - Provides consistent background styling
 * 
 * @component
 * @example
 * ```tsx
 * <Layout>
 *   <DashboardContent />
 * </Layout>
 * ```
 */

import { ProtectedRoute } from '@/components/auth/protected-route'
import { Sidebar } from '@/components/layout/sidebar'
import { DashboardHeader } from '@/components/layout/dashboard-header'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute>
      <div className="relative min-h-screen">
        {/* Background decorations */}
        <div className="fixed inset-0 -z-10">
          {/* Primary gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/20 via-background to-background" />
          
          {/* Animated gradient orbs */}
          <div className="absolute top-1/4 -left-1/4 w-[800px] h-[800px] bg-violet-500/20 rounded-full blur-3xl animate-drift" />
          <div className="absolute bottom-1/4 -right-1/4 w-[600px] h-[600px] bg-indigo-500/20 rounded-full blur-3xl animate-drift-slow" />
          
          {/* Grid overlay */}
          <div 
            className="absolute inset-0 bg-repeat opacity-20"
            style={{ backgroundImage: 'url("/background/dashboard/grid.svg")' }}
          />
          
          {/* Noise effect */}
          <div 
            className="absolute inset-0 opacity-25 mix-blend-soft-light"
            style={{ backgroundImage: 'url("/background/dashboard/noise.svg")' }}
          />
        </div>

        <DashboardHeader />
        <div className="flex">
          <Sidebar className="w-64 hidden md:block border-r border-border/20" />
          <main className="flex-1 p-8">
            <div className="mx-auto max-w-7xl">
              {children}
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
} 