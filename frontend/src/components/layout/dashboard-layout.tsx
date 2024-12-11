'use client'

import { Sidebar } from './sidebar'
import { Header } from './header'
import { useAuth } from '@/lib/auth'
import { redirect } from 'next/navigation'

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { token } = useAuth()

  if (!token) {
    redirect('/login')
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