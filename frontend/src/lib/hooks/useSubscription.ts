/**
 * @file useSubscription.ts
 * @description A React hook to fetch the current user's subscription details.
 *
 * This hook uses tanstack-query to fetch and cache the user's active subscription
 * information from the backend. It relies on the centralized API client for
 * authentication.
 */
import { useQuery } from '@tanstack/react-query';
import { useApiClient } from '@/lib/api/apiClient';
import { useAuth } from '@/lib/hooks/useAuth';
import { Logger } from '@/lib/debug/logger';

export interface SubscriptionPlan {
  plan_name: string;
  billing_frequency: string;
  monthly_price: number;
  annual_price: number;
  monthly_token_allocation: number;
  video_quality: string;
  max_scenes_per_job: number;
  max_jobs_per_month: number;
  allowed_content_types: string[];
  recreation_enabled: boolean;
  has_watermark: boolean;
  script_settings_enabled: boolean;
  support_level: string;
}

export interface Subscription {
  subscription_id: number;
  user_id: number;
  plan_id: number;
  status: 'active' | 'cancelled' | 'expired';
  start_date: string;
  end_date: string;
  auto_renew: boolean;
  stripe_subscription_id: string;
  updated_at: string;
  created_at: string;
  plan_details: SubscriptionPlan;
}

export interface SubscriptionResponse {
  success: boolean;
  data: Subscription;
}

/**
 * Custom hook to fetch the current user's subscription data.
 *
 * @returns {import('@tanstack/react-query').UseQueryResult<SubscriptionResponse, Error>}
 * The result object from tanstack-query, containing subscription data, loading state, and error state.
 */
export function useSubscription() {
  const { user, isAuthenticated } = useAuth();
  const api = useApiClient();
  const logger = new Logger('useSubscription');

  const userId = user?.userId;

  return useQuery<SubscriptionResponse>({
    queryKey: ['subscription', userId],
    queryFn: async () => {
      if (!userId) {
        throw new Error('User ID is not available for fetching subscription.');
      }

      logger.log('Fetching user subscription', { userId });
      
      // The apiClient interceptor will automatically add the auth token.
      const response = await api.get<SubscriptionResponse>(
        `/api/subscription/subscriptions/user/${userId}?status=active`
      );
      return response.data;
    },
    enabled: isAuthenticated && !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
} 