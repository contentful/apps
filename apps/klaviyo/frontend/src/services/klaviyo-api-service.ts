import axios, { AxiosInstance } from 'axios';
import { KlaviyoAppConfig, API_PROXY_URL, API_REVISION } from '../config/klaviyo';
import { logger } from '../utils/logger';

export class KlaviyoApiService {
  private config: KlaviyoAppConfig;
  private proxyApi: AxiosInstance;
  private proxyUrl: string;

  constructor(config: KlaviyoAppConfig) {
    this.config = config;

    // Determine proxy URL with proper origin if needed
    this.proxyUrl = API_PROXY_URL.startsWith('http')
      ? API_PROXY_URL
      : window.location.origin + API_PROXY_URL;

    logger.log('Initialized KlaviyoApiService with proxy URL:', this.proxyUrl);

    // Initialize proxy API client
    this.proxyApi = axios.create({
      baseURL: this.proxyUrl,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });
  }

  /**
   * Call the Klaviyo API through the proxy
   * @param endpoint API endpoint to call
   * @param method HTTP method
   * @param data Request data or query parameters for GET requests
   * @returns API response
   */
  async callApi<T>(endpoint: string, method: string, data?: any): Promise<T> {
    logger.log('Calling API:', {
      endpoint,
      method,
      data,
    });

    if (!this.config.privateKey) {
      throw new Error('No private API key available');
    }

    // FAILSAFE: If this is a universal content API call and it's creating or updating a text block,
    // ensure it has proper styles data
    if (
      endpoint.includes('universal-content') &&
      (method.toLowerCase() === 'post' || method.toLowerCase() === 'patch') &&
      data?.data?.attributes?.definition?.type === 'text'
    ) {
      logger.log('FAILSAFE: Ensuring TextBlockData has proper styles for text block');

      // Create a deep copy of the data to avoid modifying the original
      const safeData = JSON.parse(JSON.stringify(data));

      // Make sure the data structure exists
      if (!safeData.data.attributes.definition.data) {
        safeData.data.attributes.definition.data = {};
      }

      // Force set the styles to valid values
      safeData.data.attributes.definition.data.styles = {};

      safeData.data.attributes.definition.data.display_options = {};

      logger.log('FAILSAFE: Updated API request data:', safeData);

      // Replace original data with our sanitized version
      data = safeData;
    }

    // Make sure endpoint has the correct format with trailing slash for Klaviyo API compliance
    const formattedEndpoint = endpoint.endsWith('/') ? endpoint : `${endpoint}/`;

    let requestData: any = {
      privateKey: this.config.privateKey,
      publicKey: this.config.publicKey,
      endpoint: formattedEndpoint,
      method,
    };

    // For GET requests, add query params separately
    if (method.toLowerCase() === 'get' && data) {
      requestData.params = data;
    } else {
      requestData.data = data;
    }

    try {
      const baseUrl =
        import.meta.env.VITE_API_PROXY_URL || 'http://localhost:3001/api/klaviyo/proxy';
      const config = {
        method: 'POST', // We always POST to our proxy
        url: `${baseUrl}/request`, // Endpoint for the proxy to handle the request
        data: requestData,
      };

      logger.log('Making API request through proxy:', {
        method: config.method,
        url: config.url,
        data: requestData,
      });

      const response = await this.proxyApi.request<{ data: T }>(config);

      // Check if response has valid data structure
      if (!response.data || !response.data.data) {
        throw new Error('Invalid response format from API proxy');
      }

      return response.data.data;
    } catch (error: any) {
      logger.error('API call failed:', {
        endpoint,
        method,
        error: error.response?.data || error.message,
      });

      // Enhance error with more details
      const enhancedError = new Error(error.response?.data?.error || error.message);
      Object.assign(enhancedError, {
        status: error.response?.status,
        details: error.response?.data?.details,
        headers: error.response?.headers,
      });

      throw enhancedError;
    }
  }

  /**
   * Validates the provided API keys by making a test request
   */
  async validateCredentials(): Promise<boolean> {
    try {
      // Attempt to fetch company information as a validation
      await this.callApi('accounts', 'GET');
      return true;
    } catch (error) {
      logger.error('Credential validation failed:', error);
      return false;
    }
  }

  /**
   * Get lists from Klaviyo
   */
  async getLists(): Promise<any[]> {
    try {
      const response = await this.callApi<any[]>('lists', 'GET');
      return response || [];
    } catch (error) {
      logger.error('Error getting lists:', error);
      return [];
    }
  }

  /**
   * Create a universal content block in Klaviyo
   */
  async createUniversalContentBlock(data: any): Promise<any> {
    try {
      // Determine content type
      const contentType = data.contentType === 'html' ? 'html' : 'text';

      // Format data in JSON:API format required by Klaviyo
      const formattedData = {
        data: {
          type: 'universal-content',
          attributes: {
            name: data.name,
            definition: {
              content_type: 'block',
              type: contentType,
              data: {
                content: data.fields && data.fields.length > 0 ? data.fields[0].value : '',
                // TextBlockData ALWAYS requires styles with actual values during creation
                styles: {},
                display_options: {},
              },
            },
          },
        },
      };

      logger.log('Creating universal content block with data:', formattedData);
      return await this.callApi('universal-content', 'POST', formattedData);
    } catch (error) {
      logger.error('Error creating universal content block:', error);
      throw error;
    }
  }

  /**
   * Update a universal content block in Klaviyo
   */
  async updateUniversalContentBlock(id: string, data: any): Promise<any> {
    try {
      // Extract the content type directly from the data without trying to infer it
      // This is crucial to avoid "You cannot change the block type of a universal content" error
      const contentType = data.data?.attributes?.definition?.type;

      if (!contentType) {
        logger.error('Missing content type in update data');
        throw new Error('Content type must be specified for updating a block');
      }

      logger.log(`Updating universal content block with type: ${contentType}`);

      // Create a deep copy of the data to avoid modifying the original
      let formattedData;

      if (data.data && typeof data.data === 'object') {
        // Create a deep copy
        formattedData = JSON.parse(JSON.stringify(data));

        // Previously we removed styles, but we now know Klaviyo requires them even for updates
        if (contentType === 'text') {
          // Ensure we have valid styles
          formattedData.data.attributes.definition.data.styles = {};

          // Ensure we have valid display_options
          formattedData.data.attributes.definition.data.display_options =
            formattedData.data.attributes.definition.data.display_options || {};
        }
      } else {
        // Simple case: construct a new object with required fields
        formattedData = {
          data: {
            type: 'universal-content',
            id,
            attributes: {
              definition: {
                content_type: 'block',
                type: contentType,
                data: {
                  content:
                    typeof data.content === 'string'
                      ? data.content
                      : data.attributes?.definition?.data?.content || '',
                  // Include styles for text blocks, required by Klaviyo API
                  styles: {},
                  // Always include display_options
                  display_options: {},
                },
              },
            },
          },
        };
      }

      logger.log('Updating universal content block with data:', formattedData);
      return await this.callApi(`universal-content/${id}`, 'PATCH', formattedData);
    } catch (error) {
      logger.error('Error updating universal content block:', error);
      throw error;
    }
  }

  /**
   * Upload an image to Klaviyo
   */
  async uploadImage(name: string, url: string): Promise<any> {
    try {
      return await this.callApi('images', 'POST', {
        name,
        url,
        contentType: 'image',
      });
    } catch (error) {
      logger.error('Error uploading image:', error);
      throw error;
    }
  }
}
