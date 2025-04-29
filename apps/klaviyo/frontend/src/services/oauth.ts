import axios from 'axios';
import {
  KLAVIYO_AUTH_URL,
  KlaviyoOAuthConfig,
  API_PROXY_URL,
  OAuthTokenResponse,
  PKCEData,
  DEFAULT_SCOPES,
} from '../config/klaviyo';
import { logger } from '../utils/logger';

export class OAuthService {
  private config: KlaviyoOAuthConfig;

  constructor(config: KlaviyoOAuthConfig) {
    this.config = config;
  }

  /**
   * Generate a code verifier and challenge for PKCE
   * @returns PKCEData with codeVerifier, codeChallenge, and state
   */
  async generatePKCE(): Promise<PKCEData> {
    // Create a cryptographically random verifier string
    const generateRandomString = (length: number): string => {
      const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
      let result = '';
      const values = new Uint8Array(length);
      crypto.getRandomValues(values);
      for (let i = 0; i < length; i++) {
        result += charset.charAt(values[i] % charset.length);
      }
      return result;
    };

    // SHA-256 encode the verifier
    const sha256 = async (plain: string): Promise<ArrayBuffer> => {
      const encoder = new TextEncoder();
      const data = encoder.encode(plain);
      return crypto.subtle.digest('SHA-256', data);
    };

    // Base64 URL encode a buffer
    const base64URLEncode = (buffer: ArrayBuffer): string => {
      const bytes = new Uint8Array(buffer);
      let base64 = btoa(String.fromCharCode.apply(null, Array.from(bytes)));
      return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    };

    // Generate code verifier, challenge, and state
    const codeVerifier = generateRandomString(64);
    const codeChallenge = base64URLEncode(await sha256(codeVerifier));
    const state = generateRandomString(32);

    return { codeVerifier, codeChallenge, state };
  }

  /**
   * Get the authorization URL to initiate the OAuth flow
   * @param pkceData PKCE data generated from generatePKCE()
   * @param scopes Optional array of scopes
   * @returns Complete authorization URL to redirect the user to
   */
  getAuthorizationUrl(pkceData: PKCEData, scopes: string[] = DEFAULT_SCOPES): string {
    const scopeString = scopes.join(' ');

    // Construct authorization URL with all required parameters
    return `${KLAVIYO_AUTH_URL}?response_type=code&client_id=${
      this.config.clientId
    }&redirect_uri=${encodeURIComponent(this.config.redirectUri || '')}&scope=${encodeURIComponent(
      scopeString
    )}&state=${pkceData.state}&code_challenge_method=S256&code_challenge=${pkceData.codeChallenge}`;
  }

  /**
   * Exchange authorization code for access and refresh tokens
   * @param code Authorization code from redirect
   * @param codeVerifier The code verifier used in the PKCE exchange
   * @returns Token response with access_token, refresh_token, etc.
   */
  async exchangeCodeForToken(code: string, codeVerifier: string): Promise<OAuthTokenResponse> {
    try {
      // Prepare the request to exchange the code for tokens
      const response = await fetch(`${API_PROXY_URL}/auth/exchange-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          code_verifier: codeVerifier,
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          redirect_uri: this.config.redirectUri,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `Token exchange failed: ${errorData.error || 'Unknown error'} ${
            errorData.error_description || ''
          }`
        );
      }

      const tokenData = await response.json();

      // Store token data in localStorage (securely without logging)
      localStorage.setItem('klaviyo_access_token', tokenData.access_token);
      localStorage.setItem('klaviyo_refresh_token', tokenData.refresh_token);

      // Calculate token expiration time
      const expiresAt = Date.now() + tokenData.expires_in * 1000;
      localStorage.setItem('klaviyo_token_expires_at', expiresAt.toString());

      return tokenData;
    } catch (error) {
      logger.error('Error exchanging code for token:', error);
      throw error;
    }
  }

  /**
   * Refresh the access token using the refresh token
   * @returns New token response
   */
  async refreshToken(): Promise<OAuthTokenResponse> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available, please check your configuration');
    }

    if (this.config.clientId === undefined) {
      throw new Error('No client ID available, please check your configuration');
    }

    if (this.config.clientSecret === undefined) {
      throw new Error('No client secret available');
    }

    try {
      // Request new tokens via proxy
      const response = await axios.post(`${API_PROXY_URL}/oauth/token`, {
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
      });

      // Store new tokens
      const tokenData: OAuthTokenResponse = response.data;
      this.storeTokens(tokenData);

      return tokenData;
    } catch (error) {
      // Log error without exposing sensitive data
      logger.error(
        'Error refreshing token:',
        error instanceof Error ? error.message : 'Unknown error'
      );
      throw error;
    }
  }

  /**
   * Revoke the refresh token
   */
  async revokeToken(token?: string): Promise<void> {
    try {
      // Use provided token or get from localStorage
      const accessToken = token || localStorage.getItem('klaviyo_access_token');

      if (!accessToken) {
        throw new Error('No access token available to revoke');
      }

      // Revoke the token via proxy
      const response = await fetch(`${API_PROXY_URL}/oauth/revoke`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: accessToken,
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `Token revocation failed: ${errorData.error || 'Unknown error'} ${
            errorData.error_description || ''
          }`
        );
      }

      // Clear tokens from localStorage
      localStorage.removeItem('klaviyo_access_token');
      localStorage.removeItem('klaviyo_refresh_token');
      localStorage.removeItem('klaviyo_token_expires_at');

      return;
    } catch (error) {
      logger.error('Error revoking token:', error);
      throw error;
    }
  }

  /**
   * Get valid access token, refreshing if necessary
   * @returns Promise with access token string
   */
  async getValidToken(): Promise<string> {
    const accessToken = localStorage.getItem('klaviyo_access_token');
    const expiresAtStr = localStorage.getItem('klaviyo_token_expires_at');

    if (!accessToken) {
      throw new Error('No access token available');
    }

    // Check if token is expired or will expire in the next 5 minutes
    const now = Date.now();
    const expiresAt = expiresAtStr ? parseInt(expiresAtStr, 10) : 0;
    const isExpired = now >= expiresAt - 5 * 60 * 1000; // 5 min buffer

    if (isExpired) {
      logger.log('Token expired or expiring soon, refreshing...');
      const newTokens = await this.refreshToken();
      return newTokens.access_token;
    }

    return accessToken;
  }

  /**
   * Get access token from localStorage
   * @returns Access token or null
   */
  getAccessToken(): string | null {
    return localStorage.getItem('klaviyo_access_token');
  }

  /**
   * Store tokens in localStorage and update expiration
   * @param tokenData Token response data
   */
  private storeTokens(tokenData: OAuthTokenResponse): void {
    if (!tokenData.access_token) return;

    localStorage.setItem('klaviyo_access_token', tokenData.access_token);

    if (tokenData.refresh_token) {
      localStorage.setItem('klaviyo_refresh_token', tokenData.refresh_token);
    }

    const expiresAt = Date.now() + (tokenData.expires_in || 3600) * 1000;
    localStorage.setItem('klaviyo_token_expires_at', expiresAt.toString());
  }

  /**
   * Get refresh token from localStorage
   * @returns Refresh token or null
   */
  private getRefreshToken(): string | null {
    return localStorage.getItem('klaviyo_refresh_token');
  }
}
