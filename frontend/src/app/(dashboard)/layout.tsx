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