/**
 * Debug utility for OAuth tokens
 */

import axios from 'axios';
import { API_PROXY_URL } from '../config/klaviyo';
import logger from './logger';

/**
 * Checks if OAuth tokens are available and valid
 * @returns Object with token status information
 */
export const checkOAuthTokens = async (): Promise<{
  hasTokens: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  isExpired: boolean;
  expiresIn: number;
  validationResult: any;
}> => {
  // Get tokens from localStorage
  const accessToken = localStorage.getItem('klaviyo_access_token');
  const refreshToken = localStorage.getItem('klaviyo_refresh_token');
  const tokenExpiresAt = localStorage.getItem('klaviyo_token_expires_at');

  // Check if tokens exist
  const hasTokens = !!(accessToken && refreshToken);

  // Check if token is expired
  const expiresAt = tokenExpiresAt ? parseInt(tokenExpiresAt, 10) : 0;
  const now = Date.now();
  const isExpired = expiresAt <= now;
  const expiresIn = Math.max(0, Math.floor((expiresAt - now) / 1000));

  // Try to validate token by making a test API call
  let validationResult: any = { success: false };

  if (hasTokens && !isExpired) {
    try {
      // Determine proxy URL with proper origin if needed
      const proxyUrl = API_PROXY_URL.startsWith('http')
        ? API_PROXY_URL
        : window.location.origin + API_PROXY_URL;

      // Make a test call to the Klaviyo API
      const response = await axios.post(proxyUrl, {
        endpoint: '/accounts',
        method: 'GET',
        authorization: `Bearer ${accessToken}`,
      });

      validationResult = {
        success: true,
        data: response.data,
      };
    } catch (error) {
      logger.error('OAuth token validation error:', error);
      validationResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  return {
    hasTokens,
    accessToken,
    refreshToken,
    isExpired,
    expiresIn,
    validationResult,
  };
};

/**
 * Clears all OAuth tokens from storage
 */
export const clearOAuthTokens = (): void => {
  localStorage.removeItem('klaviyo_access_token');
  localStorage.removeItem('klaviyo_refresh_token');
  localStorage.removeItem('klaviyo_token_expires_at');
  localStorage.removeItem('klaviyo_pkce_data');

  // Also clear any client-specific PKCE data
  Object.keys(localStorage)
    .filter((key) => key.startsWith('klaviyo_pkce_data'))
    .forEach((key) => localStorage.removeItem(key));

  logger.log('All Klaviyo OAuth tokens cleared from localStorage');
};
