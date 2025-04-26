import axios from 'axios';
import {
  KLAVIYO_AUTH_URL,
  KLAVIYO_TOKEN_URL,
  KLAVIYO_REVOKE_URL,
  KlaviyoOAuthConfig,
  API_PROXY_URL,
  OAuthTokenResponse,
  PKCEData,
  DEFAULT_SCOPES,
} from '../config/klaviyo';

export class OAuthService {
  private config: KlaviyoOAuthConfig;
  private tokenStorage: Storage;

  constructor(config: KlaviyoOAuthConfig) {
    this.config = config;
    // Use localStorage in browser, or a mock storage in Node
    this.tokenStorage =
      typeof window !== 'undefined'
        ? window.localStorage
        : {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
            length: 0,
            clear: () => {},
            key: () => null,
          };
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

    // Store PKCE data in storage to retrieve later
    this.tokenStorage.setItem('klaviyo_pkce_data', JSON.stringify(pkceData));

    // Construct authorization URL with all required parameters
    return `${KLAVIYO_AUTH_URL}?response_type=code&client_id=${
      this.config.clientId
    }&redirect_uri=${encodeURIComponent(this.config.redirectUri)}&scope=${encodeURIComponent(
      scopeString
    )}&state=${pkceData.state}&code_challenge_method=S256&code_challenge=${pkceData.codeChallenge}`;
  }

  /**
   * Exchange authorization code for access and refresh tokens
   * @param code Authorization code from redirect
   * @param state State parameter from redirect
   * @returns Token response with access_token, refresh_token, etc.
   */
  async exchangeCodeForToken(code: string, state: string): Promise<OAuthTokenResponse> {
    // Retrieve saved PKCE data
    const pkceDataStr = this.tokenStorage.getItem('klaviyo_pkce_data');
    if (!pkceDataStr) {
      throw new Error('No PKCE data found in storage');
    }

    const pkceData: PKCEData = JSON.parse(pkceDataStr);

    // Verify state matches to prevent CSRF attacks
    if (state !== pkceData.state) {
      throw new Error('State mismatch - possible CSRF attack');
    }

    console.log('Exchanging code for token with data:', {
      redirect_uri: this.config.redirectUri,
      code_length: code.length,
      code_verifier_length: pkceData.codeVerifier.length,
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
    });

    try {
      // Exchange code for token via proxy
      const response = await axios.post(`${API_PROXY_URL}/auth/exchange-code`, {
        grant_type: 'authorization_code',
        code,
        code_verifier: pkceData.codeVerifier,
        redirect_uri: this.config.redirectUri,
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
      });

      // Save tokens and expiration
      const tokenData: OAuthTokenResponse = response.data;
      this.storeTokens(tokenData);

      // Remove PKCE data as it's no longer needed
      this.tokenStorage.removeItem('klaviyo_pkce_data');

      return tokenData;
    } catch (error) {
      console.error('Token exchange error:', error);
      if (axios.isAxiosError(error) && error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
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
      throw new Error('No refresh token available');
    }

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
  }

  /**
   * Revoke the refresh token
   */
  async revokeToken(): Promise<void> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return;
    }

    // Revoke token via proxy
    await axios.post(`${API_PROXY_URL}/oauth/revoke`, {
      token_type_hint: 'refresh_token',
      token: refreshToken,
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
    });

    // Clear stored tokens
    this.clearTokens();
  }

  /**
   * Get valid access token, refreshing if necessary
   * @returns Valid access token string
   */
  async getAccessToken(): Promise<string> {
    const tokenExpiresAt = parseInt(
      this.tokenStorage.getItem('klaviyo_token_expires_at') || '0',
      10
    );
    const accessToken = this.tokenStorage.getItem('klaviyo_access_token');

    // Check if token is expired or about to expire (60 seconds buffer)
    if (!accessToken || Date.now() + 60000 >= tokenExpiresAt) {
      // Token is expired or about to expire, refresh it
      const newTokens = await this.refreshToken();
      return newTokens.access_token;
    }

    return accessToken;
  }

  /**
   * Store token data in storage
   */
  private storeTokens(tokenData: OAuthTokenResponse): void {
    const expiresAt = Date.now() + tokenData.expires_in * 1000;
    this.tokenStorage.setItem('klaviyo_access_token', tokenData.access_token);
    this.tokenStorage.setItem('klaviyo_refresh_token', tokenData.refresh_token);
    this.tokenStorage.setItem('klaviyo_token_expires_at', expiresAt.toString());
  }

  /**
   * Get refresh token from storage
   */
  private getRefreshToken(): string | null {
    return this.tokenStorage.getItem('klaviyo_refresh_token');
  }

  /**
   * Clear all stored tokens
   */
  private clearTokens(): void {
    this.tokenStorage.removeItem('klaviyo_access_token');
    this.tokenStorage.removeItem('klaviyo_refresh_token');
    this.tokenStorage.removeItem('klaviyo_token_expires_at');
  }
}
