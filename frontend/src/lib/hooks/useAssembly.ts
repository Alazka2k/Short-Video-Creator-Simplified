import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from './useAuth';

interface AssemblyOptions {
  jobId: string;
  templateId: string;
}

interface AssemblyResult {
  assemblyId?: string;
  status: string;
  error?: string;
}

export function useAssembly() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AssemblyResult | null>(null);
  const { toast } = useToast();
  const { getToken } = useAuth();

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
      const token = await getToken();
      
      const response = await fetch('/api/assembly', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          jobId,
          templateId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to assemble video');
      }

      const result = {
        assemblyId: data.assemblyId,
        status: 'success',
      };

      setResult(result);
      toast({
        title: 'Assembly Started',
        description: 'Video assembly has been initiated successfully.',
      });

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

  const getAssemblyStatus = async (assemblyId: string): Promise<any> => {
    if (!assemblyId) {
      return { status: 'error', error: 'Assembly ID is required' };
    }

    try {
      const token = await getToken();
      
      const response = await fetch(`/api/assembly/${assemblyId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to get assembly status');
      }

      return data;
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