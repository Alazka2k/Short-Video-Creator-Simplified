/**
 * @file useJobs.ts
 * @description A React hook to fetch jobs for dashboard usage.
 */
import { useQuery } from '@tanstack/react-query';
import { useApiClient } from '@/lib/api/apiClient';
import { useAuth } from '@/lib/hooks/useAuth';
import { Logger } from '@/lib/debug/logger';

export interface Job {
  job_id: string;
  user_id: number;
  created_at: string;
  updated_at: string;
  // Use the status enum that the existing JobCard/JobThumbnail components expect
  status: 'completed' | 'in_progress' | 'failed' | 'queued';
  service_sequence: string[];
  metadata: {
    // Correct the scene definition to include the optional image for the thumbnail
    scenes: {
      sceneId: number;
      status: string;
      image?: {
        publicUrl?: string;
      };
    }[];
    llmResult?: {
      title?: string;
      description?: string;
    };
    // Add other metadata properties as needed
  };
  prompt: string;
  error: string | null;
  completed_at: string | null;
  error_type: string | null;
  // This is a simplified version based on the `job` object inside the /videos response
  // and the top-level job properties. It can be expanded.
  title?: string;
  description?: string;
  sceneCount?: number;
}

export interface JobsApiResponse {
  data: Job[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * Custom hook to fetch recent completed jobs for dashboard.
 */
export function useRecentJobs(limit: number = 3) {
  const { user, isAuthenticated } = useAuth();
  const apiClient = useApiClient();

  return useQuery<Job[], Error>({
    queryKey: ['recentJobs', user?.userId, limit],
    queryFn: async () => {
      if (!isAuthenticated || !user?.userId) {
        throw new Error('User not authenticated');
      }

      try {
        //console.log('Fetching recent jobs', { userId: user.userId, limit });
        
        const response = await apiClient.get('/api/job/jobs', {
          params: {
            page: 1,
            limit,
            status: 'completed',
            sortBy: 'updated_at',
            sortOrder: 'desc'
          }
        });

        if (!response.data?.data || !Array.isArray(response.data.data)) {
          throw new Error('Invalid response format');
        }

        /*console.log('Recent jobs fetched successfully', { 
          userId: user.userId, 
          count: response.data.data.length 
        });*/

        return response.data.data as Job[];
      } catch (error) {
        console.error('Failed to fetch recent jobs', { 
          userId: user.userId, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
        throw error;
      }
    },
    enabled: isAuthenticated && !!user?.userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}