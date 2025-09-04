/**
 * @file useTransactionHistory.ts
 * @description A React hook to fetch the current user's transaction history.
 */
import { useQuery } from '@tanstack/react-query';
import { useApiClient } from '@/lib/api/apiClient';
import { useAuth } from '@/lib/hooks/useAuth';
import { Logger } from '@/lib/debug/logger';

export interface Transaction {
  transactionId: number;
  userId: number;
  transactionType: 'allocation' | 'deduction' | 'purchase';
  tokenAmount: number;
  description: string;
  transactionDate: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
}

export interface TransactionHistoryResponse {
  success: boolean;
  data: Transaction[];
}

/**
 * Custom hook to fetch the current user's transaction history.
 */
export function useTransactionHistory(limit?: number) {
  const { user, isAuthenticated } = useAuth();
  const api = useApiClient();
  const logger = new Logger('useTransactionHistory');

  const userId = user?.userId;

  return useQuery<Transaction[]>({
    queryKey: ['transactionHistory', userId, limit],
    queryFn: async () => {
      logger.log('Fetching user transaction history');
      
      const params = limit ? `?limit=${limit}` : '';
      const response = await api.get<Transaction[]>(
        `/api/subscription/transactions/me${params}`
      );
      return response.data;
    },
    enabled: isAuthenticated,
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}