'use client'

import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { useAuth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { config } from '@/lib/config'

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