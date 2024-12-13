import { config } from '@/lib/config';

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export class TokenManager {
  private static instance: TokenManager;
  private refreshTimeout?: NodeJS.Timeout;

  private constructor() {}

  static getInstance() {
    if (!this.instance) {
      this.instance = new TokenManager();
    }
    return this.instance;
  }

  async refreshToken(refreshToken: string): Promise<TokenResponse> {
    try {
      const response = await fetch(`${config.auth.auth0.domain}/oauth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grant_type: 'refresh_token',
          client_id: config.auth.auth0.clientId,
          refresh_token: refreshToken,
          scope: 'openid profile email'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }

      const tokens = await response.json();
      this.scheduleTokenRefresh(tokens.expires_in);
      return tokens;
    } catch (error) {
      console.error('Token refresh failed:', error);
      // Redirect to login on failure
      window.location.href = '/login';
      throw error;
    }
  }

  private scheduleTokenRefresh(expiresIn: number) {
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout);
    }

    // Refresh 5 minutes before expiration
    const refreshTime = (expiresIn - 300) * 1000;
    this.refreshTimeout = setTimeout(() => {
      this.refreshToken(localStorage.getItem('refresh_token') || '');
    }, refreshTime);
  }
} 