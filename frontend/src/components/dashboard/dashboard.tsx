"use client";

import { withAuth } from '@/lib/hoc/withAuth';
import { useAuth } from '@/lib/hooks/useAuth';

function DashboardComponent() {
  const { user } = useAuth();

  return (
    <div>
      <h1>Welcome, {user?.name}</h1>
      <div>Email: {user?.email}</div>
    </div>
  );
}

// Protected with default options
export const Dashboard = withAuth(DashboardComponent);

// Or with custom options
export const CustomDashboard = withAuth(DashboardComponent, {
  redirectTo: '/custom-login',
  LoadingComponent: CustomSpinner
}); 