import axios from 'axios';
import { useAuth } from '@/lib/hooks/useAuth';
import { Logger } from '@/lib/debug/logger';

const apiClientLogger = new Logger('API');

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const useApiClient = () => {
  const { getAccessToken, isAuthenticated } = useAuth();

  apiClient.interceptors.request.use(
    async (config) => {
      if (isAuthenticated) {
        try {
          const token = await getAccessToken();
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
            apiClientLogger.log('Attaching auth token to API request', { url: config.url });
          }
        } catch (error) {
          apiClientLogger.error('Failed to get access token for request interceptor', { error });
          // Don't throw here, let the request proceed without auth and fail at the backend
        }
      }
      return config;
    },
    (error) => {
      apiClientLogger.error('API request error in interceptor', { error });
      return Promise.reject(error);
    }
  );

  apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
      apiClientLogger.error('API response error', {
        status: error.response?.status,
        data: error.response?.data,
        url: error.config?.url,
      });
      return Promise.reject(error);
    }
  );

  return apiClient;
};

// You can still export the base instance if needed for non-authed requests,
// but using the hook is the preferred way for authenticated requests.
export default apiClient;