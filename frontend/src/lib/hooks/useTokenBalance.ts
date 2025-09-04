/**
 * @file useTokenBalance.ts
 * @description A React hook to fetch the current user's token balance.
 */
import { useQuery } from '@tanstack/react-query';
import { useApiClient } from '@/lib/api/apiClient';
import { useAuth } from '@/lib/hooks/useAuth';
import { Logger } from '@/lib/debug/logger';

export interface TokenBalance {
  balance: number;
}

export interface TokenBalanceResponse {
  success: boolean;
  data: TokenBalance;
}

/**
 * Custom hook to fetch the current user's token balance.
 */
export function useTokenBalance() {
  const { user, isAuthenticated } = useAuth();
  const api = useApiClient();
  const logger = new Logger('useTokenBalance');

  const userId = user?.userId;

  return useQuery<TokenBalance>({
    queryKey: ['tokenBalance', userId],
    queryFn: async () => {
      logger.log('Fetching user token balance');
      
      const response = await api.get<TokenBalance>(
        `/api/subscription/tokens/balance/me`
      );
      return response.data;
    },
    enabled: isAuthenticated,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}