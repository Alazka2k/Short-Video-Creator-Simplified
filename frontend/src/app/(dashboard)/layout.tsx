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
import { Background } from '@/components/layout/background'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute>
      <div className="relative min-h-screen">
        <Background isStatic>
          <div className="relative flex min-h-screen flex-col">
            <DashboardHeader />
            <div className="flex flex-1">
              <Sidebar className="w-64 hidden md:block border-r border-border/20" />
              <main className="flex-1 p-8">
                <div className="mx-auto max-w-7xl">
                  {children}
                </div>
              </main>
            </div>
          </div>
        </Background>
      </div>
    </ProtectedRoute>
  )
} 