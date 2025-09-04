/**
 * @file useContentStats.ts
 * @description A React hook to fetch the current user's content statistics.
 */
import { useQuery } from '@tanstack/react-query';
import { useApiClient } from '@/lib/api/apiClient';
import { useAuth } from '@/lib/hooks/useAuth';
import { Logger } from '@/lib/debug/logger';

export interface ContentStats {
  images: number;
  voiceovers: number;
  musicTracks: number;
  animations: number;
  videos: number;
  completedJobs: number;
  finalVideos: number;
}

export interface ContentStatsResponse {
  success: boolean;
  data: ContentStats;
}

/**
 * Custom hook to fetch the current user's content statistics.
 */
export function useContentStats() {
  const { user, isAuthenticated } = useAuth();
  const apiClient = useApiClient();

  return useQuery<ContentStats, Error>({
    queryKey: ['contentStats', user?.userId],
    queryFn: async () => {
      if (!isAuthenticated || !user?.userId) {
        throw new Error('User not authenticated');
      }

      try {
        //console.log('Fetching content statistics', { userId: user.userId });
        
        const response = await apiClient.post('/api/job/stats', {
          userId: user.userId
        });

        if (!response.data || typeof response.data !== 'object') {
          throw new Error('Invalid response format');
        }

        /*console.log('Content statistics fetched successfully', { 
          userId: user.userId, 
          stats: response.data 
        });*/

        return response.data as ContentStats;
      } catch (error) {
        console.error('Failed to fetch content statistics', { 
          userId: user.userId, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
        throw error;
      }
    },
    enabled: isAuthenticated && !!user?.userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}