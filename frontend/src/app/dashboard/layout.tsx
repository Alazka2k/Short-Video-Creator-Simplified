import { Sidebar } from '@/components/layout/sidebar';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardHeader } from '@/components/layout/dashboard-header';
import { cn } from '@/lib/utils';

export default function DashboardLayout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-gradient-to-br from-background to-background/95">
        <Sidebar className="w-64 hidden md:block border-r border-violet-500/20" />
        <div className="flex-1">
          <DashboardHeader />
          <main className="p-8 lg:p-12">
            <div className="mx-auto max-w-7xl">
              {children}
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
} 