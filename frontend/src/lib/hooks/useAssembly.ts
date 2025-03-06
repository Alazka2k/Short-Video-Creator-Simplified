import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from './useAuth';
import { apiClient } from '@/lib/api/apiClient';

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
  const auth = useAuth();
  
  if (!auth) {
    throw new Error('useAssembly must be used within an AuthProvider');
  }

  const assembleVideo = async ({ jobId, templateId }: AssemblyOptions): Promise<AssemblyResult> => {
    if (!jobId || !templateId) {
      const error = 'Job ID and Template ID are required';
      toast({
        title: 'Assembly Error',
        description: error,
        variant: 'destructive',
      });
      return { status: 'error', error };
    }

    setIsLoading(true);
    setResult(null);

    try {
      // Use apiClient for consistency with the rest of the application
      const response = await apiClient.post<{ 
        message: string;
        assemblyId: string | number;
        jobId: string;
        templateId: string;
        status: string;
      }>(
        '/api/assembly/assemble', 
        {
          jobId,
          templateId,
        }
      );

      const result = {
        assemblyId: response.assemblyId,
        status: response.status || 'success',
      };

      setResult(result);
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      
      const result = {
        status: 'error',
        error: errorMessage,
      };
      
      setResult(result);
      toast({
        title: 'Assembly Error',
        description: errorMessage,
        variant: 'destructive',
      });
      
      return result;
    } finally {
      setIsLoading(false);
    }
  };

  const getAssemblyStatus = async (assemblyId: string | number): Promise<any> => {
    if (!assemblyId) {
      return { status: 'error', error: 'Assembly ID is required' };
    }

    try {
      // Use apiClient for consistency with the rest of the application
      const response = await apiClient.get(`/api/assembly/${assemblyId}`);
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      toast({
        title: 'Status Error',
        description: errorMessage,
        variant: 'destructive',
      });
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