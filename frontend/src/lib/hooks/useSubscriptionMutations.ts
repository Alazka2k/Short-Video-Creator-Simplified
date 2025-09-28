/**
 * @file useSubscriptionMutations.ts
 * @description React Query mutations for subscription management operations.
 *
 * This hook provides mutations for subscription operations like cancellation,
 * with automatic cache invalidation and proper error handling.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useApiClient } from '@/lib/api/apiClient';
import { useAuth } from '@/lib/hooks/useAuth';
import { Logger } from '@/lib/debug/logger';
import { useToast } from '@/components/ui/use-toast';

const logger = new Logger('useSubscriptionMutations');

// Types for the mutation inputs and responses
export interface CancellationFeedback {
  reason?: string;
  comments?: string;
}

export interface CancelSubscriptionRequest {
  reason?: string;
  feedback?: CancellationFeedback;
}

export interface CancelSubscriptionResponse {
  message: string;
  subscription: {
    subscription_id: number;
    status: string;
    cancel_at_period_end: boolean;
    end_date?: string;
    [key: string]: any;
  };
}

export interface SubscriptionMutationError {
  message: string;
  error?: string;
  status?: number;
}

/**
 * Custom hook for subscription mutation operations
 * 
 * @returns Object containing mutation functions and states
 */
export function useSubscriptionMutations() {
  const { user, isAuthenticated } = useAuth();
  const api = useApiClient();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const userId = user?.userId;

  /**
   * Mutation for cancelling a user's subscription
   */
  const cancelSubscription = useMutation<
    CancelSubscriptionResponse,
    SubscriptionMutationError,
    CancelSubscriptionRequest
  >({
    mutationFn: async (request: CancelSubscriptionRequest) => {
      if (!isAuthenticated) {
        throw new Error('You must be logged in to cancel your subscription');
      }

      logger.log('Cancelling subscription', {
        hasReason: !!request.reason,
        hasFeedback: !!request.feedback,
        feedbackReason: request.feedback?.reason,
        hasComments: !!request.feedback?.comments
      });

      const response = await api.post<CancelSubscriptionResponse>(
        '/api/subscription/subscriptions/me/cancel',
        {
          reason: request.reason || 'CANCEL_PAID_PLAN',
          feedback: request.feedback
        }
      );

      return response.data;
    },
    onSuccess: (data, variables) => {
      logger.log('Subscription cancelled successfully', {
        status: data.subscription.status,
        cancelAtPeriodEnd: data.subscription.cancel_at_period_end
      });

      // Invalidate and refetch subscription-related queries
      queryClient.invalidateQueries({ queryKey: ['subscription', userId] });
      queryClient.invalidateQueries({ queryKey: ['tokenBalance', userId] });
      queryClient.invalidateQueries({ queryKey: ['transactionHistory', userId] });

      // Show success toast
      toast({
        title: 'Subscription Cancelled',
        description: data.message,
        duration: 5000,
      });
    },
    onError: (error, variables) => {
      logger.error('Failed to cancel subscription', {
        error: error.message,
        hasReason: !!variables.reason,
        hasFeedback: !!variables.feedback
      });

      // Show error toast
      toast({
        variant: 'destructive',
        title: 'Cancellation Failed',
        description: error.message || 'Failed to cancel subscription. Please try again.',
        duration: 7000,
      });
    }
  });

  /**
   * Helper function to cancel subscription with feedback
   */
  const cancelWithFeedback = async (feedback?: CancellationFeedback) => {
    return cancelSubscription.mutateAsync({
      reason: 'CANCEL_PAID_PLAN',
      feedback
    });
  };

  /**
   * Helper function to cancel subscription without feedback (system cancellation)
   */
  const cancelWithSystemReason = async (reason: string) => {
    return cancelSubscription.mutateAsync({
      reason,
      // No feedback for system-initiated cancellations
    });
  };

  return {
    // Main mutation
    cancelSubscription,
    
    // Helper functions
    cancelWithFeedback,
    cancelWithSystemReason,
    
    // Mutation states
    isCancelling: cancelSubscription.isPending,
    cancelError: cancelSubscription.error,
    cancelData: cancelSubscription.data,
    
    // Reset function
    resetCancellation: cancelSubscription.reset,
  };
}

/**
 * Hook specifically for user-initiated cancellations with feedback
 * This is the main hook that components should use for the cancellation modal
 */
export function useCancelSubscription() {
  const mutations = useSubscriptionMutations();
  
  return {
    cancelSubscription: mutations.cancelWithFeedback,
    isLoading: mutations.isCancelling,
    error: mutations.cancelError,
    data: mutations.cancelData,
    reset: mutations.resetCancellation,
  };
}

/**
 * Hook for system-initiated cancellations (upgrades, downgrades)
 * This would be used internally for plan changes
 */
export function useSystemCancellation() {
  const mutations = useSubscriptionMutations();
  
  return {
    cancelForUpgrade: () => mutations.cancelWithSystemReason('CANCEL_FOR_UPGRADE'),
    cancelForDowngrade: () => mutations.cancelWithSystemReason('CANCEL_FOR_DOWNGRADE'),
    cancelForFrequencyChange: () => mutations.cancelWithSystemReason('CANCEL_FOR_FREQUENCY_CHANGE'),
    isLoading: mutations.isCancelling,
    error: mutations.cancelError,
    data: mutations.cancelData,
    reset: mutations.resetCancellation,
  };
}