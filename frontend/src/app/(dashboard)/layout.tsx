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
 * - Shows sidebar on large screens (lg:pl-72)
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
import { DashboardLayout } from "@/components/layout/dashboard-layout"

export default function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        {children}
      </DashboardLayout>
    </ProtectedRoute>
  )
} 