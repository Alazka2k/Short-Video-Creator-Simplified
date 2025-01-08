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

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Header } from "@/components/layout/header"
import { Sidebar } from "@/components/layout/sidebar"

export default function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <DashboardLayout>
      <div className="min-h-screen bg-bg-main">
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 lg:pl-72">
            {children}
          </main>
        </div>
      </div>
    </DashboardLayout>
  )
} 