"use client";

import { withAuth } from '@/lib/hoc/withAuth';
import { useAuth } from '@/lib/hooks/useAuth';

function JobListComponent() {
  const { authFetch } = useAuth();

  // ... existing job list logic

  return (
    // ... existing JSX
  );
}

export const JobList = withAuth(JobListComponent); 