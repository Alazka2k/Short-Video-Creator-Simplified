import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/lib/auth/AuthContext';
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
      // Get both tokens - the M2M token for API authorization and the user token for user identification
      const userToken = localStorage.getItem("access_token");
      
      // Try to get the M2M token, but handle the case where it might be null
      let m2mToken;
      try {
        m2mToken = await auth.getM2MToken();
      } catch (tokenError) {
        console.error('Error getting M2M token:', tokenError);
      }
      
      // If we don't have a valid M2M token, try to use the API client directly
      if (!m2mToken) {
        console.log('No M2M token available, using API client directly');
        try {
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
        } catch (apiError) {
          console.error('API client error:', apiError);
          throw apiError;
        }
      }
      
      // Set up headers with both tokens
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      // Only add the Authorization header if we have a valid M2M token
      if (m2mToken) {
        headers['Authorization'] = `Bearer ${m2mToken}`;
      }
      
      // Add the user token as a separate header to identify the actual user
      if (userToken) {
        headers['x-user-token'] = userToken;
      }
      
      // Make the API request with the available tokens
      // TODO: Hardcoded endpoint?
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/assembly/assemble`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          jobId,
          templateId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Request failed with status ${response.status}`);
      }

      const data = await response.json();

      const result = {
        assemblyId: data.assemblyId,
        status: data.status || 'success',
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
      // Get both tokens - the M2M token for API authorization and the user token for user identification
      const userToken = localStorage.getItem("access_token");
      
      // Try to get the M2M token, but handle the case where it might be null
      let m2mToken;
      try {
        m2mToken = await auth.getM2MToken();
      } catch (tokenError) {
        console.error('Error getting M2M token:', tokenError);
      }
      
      // If we don't have a valid M2M token, try to use the API client directly
      if (!m2mToken) {
        console.log('No M2M token available, using API client directly');
        try {
          const response = await apiClient.get(`/api/assembly/${assemblyId}`);
          return response;
        } catch (apiError) {
          console.error('API client error:', apiError);
          throw apiError;
        }
      }
      
      // Set up headers with both tokens
      const headers: Record<string, string> = {};
      
      // Only add the Authorization header if we have a valid M2M token
      if (m2mToken) {
        headers['Authorization'] = `Bearer ${m2mToken}`;
      }
      
      // Add the user token as a separate header to identify the actual user
      if (userToken) {
        headers['x-user-token'] = userToken;
      }
      
      // Make the API request with the available tokens
      // TODO: Hardcoded endpoint?
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/assembly/${assemblyId}`, {
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Request failed with status ${response.status}`);
      }

      const data = await response.json();
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