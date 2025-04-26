/**
 * Interface representing field data structure
 */
export interface FieldData {
  id: string;
  name: string;
  type: string;
  value: any;
  isAsset: boolean;
  assetDetails?: Array<{
    id: string;
    title: string;
    description: string;
    url: string;
    fileName: string;
    contentType: string;
  }>;
}

/**
 * Interface representing Klaviyo API configuration
 */
export interface KlaviyoConfig {
  apiKey: string;
  privateKey?: string;
  listId?: string;
  endpoint?: string;
}

/**
 * Sends data to Klaviyo API
 * @param config Klaviyo API configuration
 * @param fieldMappings Field mappings for the data
 * @param entryData The entry data to be sent
 * @returns Response from the Klaviyo API
 */
export const sendToKlaviyo = async (
  config: KlaviyoConfig,
  fieldMappings: Record<string, string>,
  entryData: Record<string, FieldData>
): Promise<any> => {
  try {
    if (!config.apiKey) {
      throw new Error('Klaviyo API key is required');
    }

    // Transform field data according to mappings
    const transformedData = Object.entries(fieldMappings).reduce(
      (acc, [contentfulField, klaviyoField]) => {
        if (entryData[contentfulField]) {
          acc[klaviyoField] = entryData[contentfulField].value;
        }
        return acc;
      },
      {} as Record<string, any>
    );

    // Basic validation
    if (!transformedData.email && !transformedData.phone_number) {
      throw new Error('Either email or phone number is required for Klaviyo profiles');
    }

    // Endpoint defaults to profiles if not specified
    const endpoint = config.endpoint || 'profiles';
    const baseUrl = 'https://a.klaviyo.com/api/v2';

    // Build request options
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Klaviyo-API-Key ${config.apiKey}`,
      },
      body: JSON.stringify({
        data: transformedData,
        ...(config.listId && { list_id: config.listId }),
      }),
    };

    // Make the API request
    const response = await fetch(`${baseUrl}/${endpoint}`, options);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Klaviyo API error: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error sending data to Klaviyo:', error);
    throw error;
  }
};

// Import the KlaviyoService and OAuth configuration
import { KlaviyoService } from '../services/klaviyo';
import { FieldMapping, KlaviyoOAuthConfig } from '../config/klaviyo';

/**
 * Class for syncing Contentful content to Klaviyo
 */
export class SyncContent {
  /**
   * Syncs content from Contentful to Klaviyo
   * @param sdk The Contentful SDK
   * @param mappings Field mappings defining how to map Contentful fields to Klaviyo
   * @returns Promise with the results of the sync operation
   */
  async syncContent(
    sdk: any,
    mappings: Array<{ contentfulFieldId: string; klaviyoBlockName: string; fieldType: string }>
  ) {
    try {
      console.log('Starting content sync with mappings:', mappings);

      // Check if we have a valid OAuth token
      const accessToken = localStorage.getItem('klaviyo_access_token');
      const refreshToken = localStorage.getItem('klaviyo_refresh_token');
      const tokenExpiresAt = localStorage.getItem('klaviyo_token_expires_at');

      if (!accessToken || !refreshToken) {
        // If we need to authenticate first, show a message to the user
        sdk.notifier.error(
          'Please connect to Klaviyo first. Go to the app configuration and click "Connect to Klaviyo".'
        );
        throw new Error('Authentication required: No access token available');
      }

      // Check if token is expired
      if (tokenExpiresAt && parseInt(tokenExpiresAt, 10) < Date.now()) {
        sdk.notifier.error(
          'Your Klaviyo authentication has expired. Please reconnect in the app configuration.'
        );
        throw new Error('Authentication expired: Token has expired');
      }

      console.log('Using OAuth token for authentication');

      // Get installation parameters just for the redirect URI (needed by the service)
      const params = sdk.parameters?.installation || {};
      const redirectUri =
        params.klaviyoRedirectUri || `${window.location.origin}:3001/auth/callback`;

      // Initialize the KlaviyoService with OAuth configuration
      // We don't need actual client ID and secret for API calls once we have a token
      const klaviyoService = new KlaviyoService({
        clientId: 'using-existing-token', // Not used for API calls
        clientSecret: 'using-existing-token', // Not used for API calls
        redirectUri: redirectUri,
        accessToken: accessToken,
        refreshToken: refreshToken,
        tokenExpiresAt: parseInt(tokenExpiresAt || '0', 10),
      });

      // Get entry data
      const entry = sdk.entry;

      // Convert to FieldMapping array for the KlaviyoService
      const fieldMappings: FieldMapping[] = mappings.map((mapping) => ({
        contentfulFieldId: mapping.contentfulFieldId,
        klaviyoBlockName: mapping.klaviyoBlockName,
        fieldType: mapping.fieldType as any,
      }));

      // Call the KlaviyoService to sync content
      const result = await klaviyoService.syncContent(fieldMappings, entry);

      console.log('Sync completed successfully:', result);

      // Notify the user
      sdk.notifier.success('Content successfully synced to Klaviyo');

      return result;
    } catch (error: any) {
      console.error('Error syncing content to Klaviyo:', error);

      // Special handling for OAuth errors
      if (
        error.message &&
        (error.message.includes('Authentication required') ||
          error.message.includes('Authentication failed') ||
          error.message.includes('Your session has expired'))
      ) {
        // Clear token to force re-authentication
        localStorage.removeItem('klaviyo_access_token');
        localStorage.removeItem('klaviyo_refresh_token');
        localStorage.removeItem('klaviyo_token_expires_at');
      }

      // Notify the user of the error
      if (sdk.notifier) {
        sdk.notifier.error(
          `Failed to sync content to Klaviyo. ${error.message || 'See console for details.'}`
        );
      }

      throw error;
    }
  }
}
