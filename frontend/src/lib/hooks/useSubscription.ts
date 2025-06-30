import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/apiClient';
import { useAuth } from '@/lib/auth/AuthContext';
import { AuthLogger } from '@/lib/debug/auth-logger';

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

export function useSubscription(userId?: string) {
  const auth = useAuth();
  if (!auth) {
    throw new Error('useSubscription must be used within an AuthProvider');
  }
  const { getM2MToken, user } = auth;

  return useQuery<SubscriptionResponse>({
    queryKey: ['subscription', userId],
    queryFn: async () => {
      if (!userId) {
        throw new Error('User ID is required to fetch subscription');
      }

      const m2mToken = await getM2MToken();
      const userToken = localStorage.getItem("access_token");

      AuthLogger.log('Loading subscription with tokens:', {
        hasM2MToken: !!m2mToken,
        hasUserToken: !!userToken,
        userId
      });

      const headers: Record<string, string> = {
        'Authorization': `Bearer ${m2mToken}`
      };

      if (userToken) {
        headers['x-user-token'] = userToken;
      }

      return apiClient.get<SubscriptionResponse>(
        `/api/subscription/subscriptions/user/${userId}?status=active`,
        { headers }
      );
    },
    enabled: !!userId && !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
} 