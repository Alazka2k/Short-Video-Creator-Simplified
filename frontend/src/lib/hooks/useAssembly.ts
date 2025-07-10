import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/lib/hooks/useAuth';
import { useApiClient } from '@/lib/api/apiClient';

interface AssemblyOptions {
  jobId: string;
  templateId: string;
}

interface AssemblyResult {
  assemblyId?: string | number;
  status: string;
  error?: string;
}

export function useAssembly() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AssemblyResult | null>(null);
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const api = useApiClient();

  const assembleVideo = async ({ jobId, templateId }: AssemblyOptions): Promise<AssemblyResult> => {
    if (!jobId || !templateId) {
      const error = 'Job ID and Template ID are required';
      toast({ title: 'Assembly Error', description: error, variant: 'destructive' });
      return { status: 'error', error };
    }

    if (!isAuthenticated) {
      const error = 'User is not authenticated';
      toast({ title: 'Authentication Error', description: error, variant: 'destructive' });
      return { status: 'error', error };
    }

    setIsLoading(true);
    setResult(null);

    try {
      const response = await api.post<{
        assemblyId: string | number;
        status: string;
      }>(
        '/api/assembly/assemble',
        { jobId, templateId }
      );

      const resultData = {
        assemblyId: response.data.assemblyId,
        status: response.data.status || 'success',
      };

      setResult(resultData);
      return resultData;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'An unknown error occurred';
      const resultData = { status: 'error', error: errorMessage };
      setResult(resultData);
      toast({ title: 'Assembly Error', description: errorMessage, variant: 'destructive' });
      return resultData;
    } finally {
      setIsLoading(false);
    }
  };

  const getAssemblyStatus = async (assemblyId: string | number): Promise<any> => {
    if (!assemblyId) {
      return { status: 'error', error: 'Assembly ID is required' };
    }

    if (!isAuthenticated) {
      return { status: 'error', error: 'User is not authenticated' };
    }

    try {
      const response = await api.get(`/api/assembly/${assemblyId}`);
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'An unknown error occurred';
      toast({ title: 'Status Error', description: errorMessage, variant: 'destructive' });
      return { status: 'error', error: errorMessage };
    }
  };

  return {
    assembleVideo,
    getAssemblyStatus,
    isLoading,
    result,
  };
} 