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

export interface MarketingFeature {
  title: string;
  text: string;
  highlight: boolean;
}

export interface PlanMarketingDescription {
  tier_name?: string;
  description?: string;
  features?: MarketingFeature[];
  is_popular?: boolean;
}

export interface Subscription {
  id: number;
  user_id: number;
  plan_id: number;
  stripe_subscription_id: string;
  stripe_customer_id: string;
  stripe_payment_intent_id: string | null;
  stripe_status: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
  plan_name: string;
  monthly_token_allocation: number;
  marketing_description?: PlanMarketingDescription;
}

/**
 * Custom hook to fetch the current user's subscription data.
 *
 * @returns {import('@tanstack/react-query').UseQueryResult<Subscription[], Error>}
 * The result object from tanstack-query, containing subscription data, loading state, and error state.
 */
export function useSubscription() {
  const { user, isAuthenticated } = useAuth();
  const api = useApiClient();
  const logger = new Logger('useSubscription');

  const userId = user?.userId;

  return useQuery<Subscription[]>({
    queryKey: ['subscription', userId],
    queryFn: async () => {
      logger.log('Fetching user subscription');
      
      // The apiClient interceptor will automatically add the auth token.
      const response = await api.get<Subscription[]>(
        `/api/subscription/subscriptions/me?status=active`
      );
      return response.data;
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
} 