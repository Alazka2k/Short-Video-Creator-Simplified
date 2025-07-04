import { AuthLogger } from '@/lib/debug/auth-logger';

export interface ApiClientConfig {
  baseURL: string;
  getToken: () => Promise<string>;
}

export interface ApiRequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
}

export interface ApiResponse<T = any> {
  data: T;
  config?: ApiRequestConfig;
}

export interface ApiError extends Error {
  status?: number;
  response?: ApiResponse;
}

type RequestInterceptor = (config: ApiRequestConfig) => Promise<ApiRequestConfig> | ApiRequestConfig;
type ResponseInterceptor<T = any> = (response: ApiResponse<T>) => Promise<ApiResponse<T>> | ApiResponse<T>;
type ErrorInterceptor = (error: ApiError) => Promise<never>;

export class ApiClient {
  public baseURL: string;
  public getToken: () => Promise<string>;
  public isInitialized: boolean = false;
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];
  private errorInterceptors: ErrorInterceptor[] = [];

  constructor(config: ApiClientConfig) {
    this.baseURL = config.baseURL;
    this.getToken = config.getToken;
  }

  public initialize() {
    //console.log('INITIALIZE CALLED', 
    //{
    //  beforeInit: this.isInitialized,
    //  baseURL: this.baseURL,
    //  hasTokenGetter: !!this.getToken,
    //  tokenGetter: this.getToken.toString()
    //});

    AuthLogger.log('Initializing API client instance', {
      hasBaseURL: !!this.baseURL,
      hasTokenGetter: !!this.getToken,
      beforeInit: this.isInitialized
    });
    
    if (!this.baseURL) {
      const error = new Error('API client baseURL is not set');
      AuthLogger.error(error.message);
      throw error;
    }
    
    if (!this.getToken) {
      const error = new Error('API client token getter is not set');
      AuthLogger.error(error.message);
      throw error;
    }

    this.isInitialized = true;

    //console.log('INITIALIZE COMPLETE', {
    //  afterInit: this.isInitialized,
    //  baseURL: this.baseURL,
    //  hasTokenGetter: !!this.getToken
    //});

    AuthLogger.log('API client initialization complete', {
      isInitialized: this.isInitialized,
      baseURL: this.baseURL
    });

    return this;
  }

  public addRequestInterceptor(interceptor: RequestInterceptor) {
    this.requestInterceptors.push(interceptor);
    return this;
  }

  public addResponseInterceptor<T = any>(interceptor: ResponseInterceptor<T>) {
    this.responseInterceptors.push(interceptor);
    return this;
  }

  public addErrorInterceptor(interceptor: ErrorInterceptor) {
    this.errorInterceptors.push(interceptor);
    return this;
  }

  private async applyRequestInterceptors(config: ApiRequestConfig): Promise<ApiRequestConfig> {
    let currentConfig = { ...config };
    for (const interceptor of this.requestInterceptors) {
      currentConfig = await interceptor(currentConfig);
    }
    return currentConfig;
  }

  private async applyResponseInterceptors<T>(response: ApiResponse<T>): Promise<ApiResponse<T>> {
    let currentResponse = response;
    for (const interceptor of this.responseInterceptors) {
      currentResponse = await interceptor(currentResponse);
    }
    return currentResponse;
  }

  private async handleError(error: unknown): Promise<never> {
    let currentError = error as ApiError;
    for (const interceptor of this.errorInterceptors) {
      currentError = await interceptor(currentError);
    }
    throw currentError;
  }

  private async request<T>(endpoint: string, config: ApiRequestConfig = {}, retryCount: number = 0): Promise<T> {
    const MAX_RETRIES = 5;
    const RETRY_DELAY = 500; // Increased to 500ms between retries

    // Wait for initialization if needed
    if (!this.isInitialized) {
      if (retryCount >= MAX_RETRIES) {
        const error = new Error('API client failed to initialize after multiple retries');
        AuthLogger.error(error.message, {
          retryCount,
          isInitialized: this.isInitialized,
          hasBaseURL: !!this.baseURL,
          hasTokenGetter: !!this.getToken
        });
        throw error;
      }
      AuthLogger.warning(`API client not initialized, waiting for initialization... (attempt ${retryCount + 1}/${MAX_RETRIES})`, {
        retryCount,
        isInitialized: this.isInitialized,
        hasBaseURL: !!this.baseURL,
        hasTokenGetter: !!this.getToken
      });
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return this.request(endpoint, config, retryCount + 1);
    }

    try {
      // Get token first to validate auth state
      const token = await this.getToken();
      if (!token) {
        const error = new Error('No token available');
        AuthLogger.error(error.message, { endpoint });
        throw error;
      }

      const url = `${this.baseURL}${endpoint}`;

      // Apply request interceptors
      const finalConfig = await this.applyRequestInterceptors({
        method: config.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...config.headers,
        },
        body: config.body,
      });

      AuthLogger.log('Making API request', { 
        url, 
        method: finalConfig.method,
        hasBody: !!finalConfig.body
      });

      const response = await fetch(url, {
        ...finalConfig,
        body: finalConfig.body ? JSON.stringify(finalConfig.body) : undefined,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error = Object.assign(
          new Error(errorData.message || `Request failed with status ${response.status}`),
          { status: response.status, response: errorData }
        );
        return this.handleError(error);
      }

      const data = await response.json();
      const result = await this.applyResponseInterceptors({ data, config: finalConfig });
      return result.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  public async get<T>(endpoint: string, config: Omit<ApiRequestConfig, 'method' | 'body'> = {}): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'GET' });
  }

  public async post<T>(endpoint: string, body: any, config: Omit<ApiRequestConfig, 'method'> = {}): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'POST', body });
  }

  public async put<T>(endpoint: string, body: any, config: Omit<ApiRequestConfig, 'method'> = {}): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'PUT', body });
  }

  public async delete<T>(endpoint: string, config: Omit<ApiRequestConfig, 'method' | 'body'> = {}): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'DELETE' });
  }
}

// Create and export the default API client instance
export const apiClient = new ApiClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  getToken: async () => {
    throw new Error('API client not initialized. Please wait for authentication to complete.');
  }
});

// Make the apiClient available globally for state detection
if (typeof window !== 'undefined') {
  (globalThis as any).apiClient = apiClient;
}

// Export a function to initialize the API client with auth
export function initializeApiClient(getToken: () => Promise<string>): ApiClient {
  AuthLogger.log('Starting API client initialization', {
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
    hasTokenGetter: !!getToken,
    isAlreadyInitialized: apiClient.isInitialized
  });

  // If already initialized, return the existing instance
  if (apiClient.isInitialized) {
    AuthLogger.log('API client already initialized, returning existing instance');
    return apiClient;
  }

  // Update the existing client instance instead of creating a new one
  apiClient.baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  apiClient.getToken = async () => {
    try {
      return await getToken();
    } catch (error) {
      // If we're in a post-auth redirect scenario, don't break on token failure
      // as Auth0 might still be setting up the tokens
      const isPostAuthRedirect = typeof window !== 'undefined' && (
        !!localStorage.getItem('a0.spajs.txs') || 
        document.cookie.includes('auth_redirect=true') ||
        new URLSearchParams(window.location.search).get('auth_callback') === 'true'
      );
      
      if (isPostAuthRedirect) {
        AuthLogger.warning('Token getter failed in post-auth scenario, using fallback token', { error });
        const fallbackToken = localStorage.getItem('access_token');
        if (fallbackToken) {
          return fallbackToken;
        }
      }
      
      AuthLogger.error('Token getter failed:', error);
      throw error;
    }
  };

  try {
    apiClient.initialize();
    AuthLogger.log('API client initialization successful');
  } catch (error) {
    AuthLogger.error('API client initialization failed:', error);
    // Try one more time after a short delay
    setTimeout(() => {
      try {
        if (!apiClient.isInitialized) {
          AuthLogger.log('Retrying API client initialization');
          apiClient.initialize();
        }
      } catch (retryError) {
        AuthLogger.error('API client retry initialization failed:', retryError);
      }
    }, 500);
  }
  
  return apiClient;
}