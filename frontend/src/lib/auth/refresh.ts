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
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }

      const tokens = await response.json();
      this.scheduleTokenRefresh(tokens.expires_in);
      return tokens;
    } catch (error) {
      console.error('Token refresh failed:', error);
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