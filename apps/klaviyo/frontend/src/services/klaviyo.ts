import axios, { AxiosInstance } from 'axios';
import { API_PROXY_URL, KlaviyoAppConfig } from '../config/klaviyo';
import { KlaviyoApiService } from './klaviyo-api-service';
import { logger } from '../utils/logger';

// Define the FieldMapping interface
interface FieldMapping {
  name: string;
  type: string;
  severity: string;
  contentfulFieldId: string;
  fieldType: string;
  klaviyoBlockName: string;
  value: any;
}

export class KlaviyoService {
  private config: KlaviyoAppConfig;
  private apiService: KlaviyoApiService;
  private proxyApi: AxiosInstance;
  private proxyUrl: string;

  constructor(config: KlaviyoAppConfig) {
    this.config = config;
    this.apiService = new KlaviyoApiService(config);

    // Determine proxy URL with proper origin if needed
    this.proxyUrl = API_PROXY_URL.startsWith('http')
      ? API_PROXY_URL
      : window.location.origin + API_PROXY_URL;

    logger.log('Initialized KlaviyoService with proxy URL:', this.proxyUrl);

    // Initialize proxy API client
    this.proxyApi = axios.create({
      baseURL: API_PROXY_URL.startsWith('http')
        ? API_PROXY_URL
        : window.location.origin + API_PROXY_URL,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });
  }

  /**
   * Helper function to extract text from localized field values
   * @param value The field value that might be in locale format like {"en-US": "value"}
   * @returns The extracted string value
   */
  private extractTextFromLocalizedField(value: any): string {
    // If it's null or undefined, return empty string
    if (value === null || value === undefined) {
      return '';
    }

    // If it's already a string, return it
    if (typeof value === 'string') {
      return value;
    }

    // If it's an object that might have locale keys like {"en-US": "Text Value"}
    if (typeof value === 'object' && !Array.isArray(value)) {
      // Check if it has locale keys
      if ('en-US' in value) {
        return typeof value['en-US'] === 'string' ? value['en-US'] : String(value['en-US'] || '');
      }

      // Try the first key if it exists
      const keys = Object.keys(value);
      if (keys.length > 0) {
        const firstLocale = keys[0];
        return typeof value[firstLocale] === 'string'
          ? value[firstLocale]
          : String(value[firstLocale] || '');
      }
    }

    // Fallback: convert to string
    try {
      return String(value);
    } catch (e) {
      logger.error('Error converting value to string:', e);
      return '';
    }
  }

  private mapContentfulFieldToKlaviyo(
    contentfulFieldId: string,
    klaviyoBlockName: string,
    value: any
  ): FieldMapping {
    // Extract value from localized field if needed
    let processedValue = value;

    // Check if value is a localized object
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      processedValue = this.extractTextFromLocalizedField(value);
      logger.log(`Extracted text from localized field ${contentfulFieldId}: "${processedValue}"`);
    }

    // Ensure value is always a string to avoid issues with numbers/integers
    return {
      contentfulFieldId,
      klaviyoBlockName,
      name: klaviyoBlockName,
      type: 'text',
      severity: 'info',
      fieldType: 'text',
      value: processedValue != null ? String(processedValue) : '',
    };
  }

  private createFieldMapping(
    contentfulFieldId: string,
    klaviyoBlockName: string,
    value: any
  ): FieldMapping {
    // Extract value from localized field if needed
    let processedValue = value;

    // Check if value is a localized object
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      processedValue = this.extractTextFromLocalizedField(value);
      logger.log(`Extracted text from localized field ${contentfulFieldId}: "${processedValue}"`);
    }

    return {
      contentfulFieldId,
      klaviyoBlockName,
      name: klaviyoBlockName,
      type: 'text',
      severity: 'info',
      fieldType: 'text',
      value: processedValue,
    };
  }

  private createRichTextFieldMapping(
    contentfulFieldId: string,
    klaviyoBlockName: string,
    value: any
  ): FieldMapping {
    // For rich text, we might need to extract the document from a locale wrapper
    let processedValue = value;

    // Check if value is a localized object
    if (value && typeof value === 'object' && !Array.isArray(value) && 'en-US' in value) {
      processedValue = value['en-US'];
      logger.log(`Extracted rich text from localized field ${contentfulFieldId}`);
    }

    return {
      contentfulFieldId,
      klaviyoBlockName,
      name: klaviyoBlockName,
      type: 'html',
      severity: 'info',
      fieldType: 'richText',
      value: processedValue,
    };
  }

  /**
   * Validates the configuration by testing the API keys
   */
  async validateConfiguration(): Promise<boolean> {
    try {
      return await this.apiService.validateCredentials();
    } catch (error) {
      logger.error('Validation failed:', error);
      return false;
    }
  }

  /**
   * Get lists from Klaviyo
   */
  async getLists(): Promise<any[]> {
    return this.apiService.getLists();
  }

  /**
   * Process and create universal content block in Klaviyo
   */
  async createUniversalContentBlock(
    name: string,
    contentType: string,
    fields: FieldMapping[]
  ): Promise<any> {
    try {
      const mappedFields = fields.map((field) =>
        this.mapContentfulFieldToKlaviyo(
          field.contentfulFieldId,
          field.klaviyoBlockName,
          field.value
        )
      );

      // Determine if we're creating HTML or text content
      const blockType =
        fields[0]?.type === 'html' || fields[0]?.fieldType === 'richText' ? 'html' : 'text';

      logger.log(`Creating universal content block of type: ${blockType}`);

      return await this.apiService.createUniversalContentBlock({
        name,
        contentType: blockType,
        fields: mappedFields,
      });
    } catch (error) {
      logger.error('Error creating universal content block:', error);
      throw error;
    }
  }

  /**
   * Process and update a universal content block in Klaviyo
   */
  async updateUniversalContentBlock(blockId: string, fields: FieldMapping[]): Promise<any> {
    try {
      if (!blockId) {
        logger.error('updateUniversalContentBlock called without a valid blockId');
        throw new Error('Block ID is required for updating content');
      }

      logger.log(`Updating block ${blockId} with ${fields.length} fields`);

      if (fields.length === 0) {
        logger.error('No fields provided for update');
        throw new Error('At least one field is required for update');
      }

      // Prepare the data for the API service with proper JSON:API format
      const field = fields[0];
      const fieldValue = typeof field.value !== 'string' ? String(field.value) : field.value;

      // Use the type exactly as provided in the field, do not attempt to determine it
      // This is important to avoid changing block types which causes 400 errors
      const fieldType = field.type || 'text';

      logger.log(`Using field type ${fieldType} for update`);

      const data = {
        data: {
          type: 'universal-content',
          id: blockId,
          attributes: {
            definition: {
              content_type: 'block',
              type: fieldType,
              data: {
                content: fieldValue,
                // Removed styles as it's not allowed in updates
                display_options: {},
              },
            },
          },
        },
      };

      logger.log('Sending update with data:', data);
      return await this.apiService.updateUniversalContentBlock(blockId, data);
    } catch (error) {
      logger.error('Error updating universal content block:', error);
      throw error;
    }
  }

  /**
   * Upload an image to Klaviyo
   */
  async uploadImage(imageUrl: string, name?: string): Promise<any> {
    try {
      const imageName = name || `Image-${new Date().getTime()}`;
      return await this.apiService.uploadImage(imageName, imageUrl);
    } catch (error) {
      logger.error('Error uploading image:', error);
      throw error;
    }
  }

  /**
   * Get a single content block
   */
  async getUniversalContentBlock(id: string): Promise<any> {
    try {
      return await this.apiService.callApi(`universal-content/${id}`, 'GET');
    } catch (error) {
      logger.error('Error getting universal content block:', error);
      throw error;
    }
  }

  /**
   * List universal content blocks with optional filtering
   */
  async listUniversalContentBlocks(params?: any): Promise<any[]> {
    try {
      logger.log('Listing universal content blocks with params:', params);

      // Format query params according to Klaviyo API requirements
      const queryParams: Record<string, any> = {};

      // Handle filter param specifically - needs to be formatted correctly per Klaviyo API
      if (params && params.filter) {
        // For simple equality filter like 'name eq "Title"', properly format it
        if (typeof params.filter === 'string' && params.filter.includes('eq')) {
          // Extract the field and value from filter string like 'name eq "Title"'
          const matches = params.filter.match(/([a-zA-Z._]+)\s+eq\s+"([^"]+)"/);

          if (matches && matches.length === 3) {
            const [_, field, value] = matches;

            // Format as per Klaviyo API requirements
            if (field === 'name') {
              queryParams.filter = `equals(${field},"${value}")`;
            } else if (field === 'definition.content_type' || field === 'definition.type') {
              queryParams.filter = `equals(${field},"${value}")`;
            } else if (field === 'id') {
              queryParams.filter = `equals(${field},"${value}")`;
            } else {
              // For other fields, keep the original format
              queryParams.filter = params.filter;
            }

            logger.log('Formatted filter:', queryParams.filter);
          } else {
            // If it doesn't match the pattern, use as is
            queryParams.filter = params.filter;
          }
        } else {
          // Use as is if it's not a string or doesn't match our pattern
          queryParams.filter = params.filter;
        }
      }

      // Handle pagination
      if (params && params.limit) {
        queryParams['page[size]'] = params.limit;
      }

      // Handle cursor-based pagination
      if (params && params.cursor) {
        queryParams['page[cursor]'] = params.cursor;
      }

      // Handle sorting
      if (params && params.sort) {
        queryParams.sort = params.sort;
      }

      // Handle fields
      if (params && params.fields) {
        queryParams['fields[universal-content]'] = params.fields;
      }

      logger.log('Final query parameters for API call:', queryParams);

      const response = await this.apiService.callApi('universal-content', 'GET', queryParams);

      // Handle response data format - could be an array or an object with a data property
      if (Array.isArray(response)) {
        return response;
      } else if (response && typeof response === 'object') {
        // Check if response has a data property that is an array
        const responseObj = response as Record<string, any>;
        if (responseObj.data && Array.isArray(responseObj.data)) {
          return responseObj.data;
        }
      }

      return [];
    } catch (error) {
      logger.error('Error listing universal content blocks:', error);
      return [];
    }
  }

  /**
   * Sync content to Klaviyo based on mappings and entry data
   */
  async syncContent(mappings: FieldMapping[], entry: any) {
    try {
      logger.log('Syncing content to Klaviyo', { mappings, entry });

      // Group mappings by block name
      const blockMappings: Record<string, FieldMapping[]> = {};

      mappings.forEach((mapping) => {
        if (!blockMappings[mapping.klaviyoBlockName]) {
          blockMappings[mapping.klaviyoBlockName] = [];
        }
        blockMappings[mapping.klaviyoBlockName].push(mapping);
      });

      const results = [];

      // Process each block
      for (const [blockName, fields] of Object.entries(blockMappings)) {
        try {
          // First try to get an existing block with this name using the correct filter format
          logger.log(`Looking for existing block with name: ${blockName}`);
          const existingBlocks = await this.listUniversalContentBlocks({
            filter: `equals(name,"${blockName}")`,
            limit: 1,
          });

          logger.log(`Found ${existingBlocks.length} existing blocks for name: ${blockName}`);

          let result;

          if (existingBlocks.length > 0) {
            // Get the existing block ID and details
            const blockId = existingBlocks[0].id;
            const existingBlock = existingBlocks[0];

            // Get original block type to preserve it (crucial to avoid 400 error)
            const originalBlockType = existingBlock.attributes?.definition?.type || 'text';
            logger.log(
              `Found existing block ${blockName} with ID ${blockId} and type: ${originalBlockType}`
            );

            // Force the field type to match the original block type
            const updatedFields = fields.map((field) => ({
              ...field,
              fieldType: originalBlockType === 'html' ? 'richText' : 'text',
              type: originalBlockType === 'html' ? 'html' : 'text',
            }));

            logger.log(
              `Updating block ${blockName} (ID: ${blockId}) with type: ${originalBlockType}`
            );
            result = await this.updateUniversalContentBlock(blockId, updatedFields);
            logger.log(`Updated block ${blockName} with ID ${blockId} successfully`);
          } else {
            // Create new block
            logger.log(`Creating new block: ${blockName}`);
            result = await this.createUniversalContentBlock(blockName, 'text', fields);
            logger.log(`Created new block ${blockName} successfully`);
          }

          results.push({
            blockName,
            success: true,
            result,
          });
        } catch (error) {
          logger.error(`Error processing block ${blockName}:`, error);
          results.push({
            blockName,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      return results;
    } catch (error) {
      logger.error('Error syncing content:', error);
      throw error;
    }
  }

  // Modified callApi method to better handle auth errors
  async callApi(endpoint: string, method: string, data?: any): Promise<any> {
    try {
      const baseUrl = 'https://a.klaviyo.com/api/v1';
      const url = `${baseUrl}/${endpoint}`;

      const options = {
        method,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Klaviyo-API-Key ${this.config.publicKey}`,
        },
        body: data ? JSON.stringify(data) : undefined,
      };

      logger.log(`Making ${method} API call to ${endpoint}`);

      // Make the API request through our proxy
      const response = await fetch(`${API_PROXY_URL}/proxy/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          method,
          headers: options.headers,
          data: data || null,
          publicKey: this.config.publicKey,
          privateKey: this.config.privateKey,
        }),
      });

      // Check if the response is ok
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        logger.error('API call failed:', {
          endpoint,
          method,
          error: errorData,
        });

        // Handle different HTTP errors
        if (response.status === 403) {
          throw new Error('Forbidden - check your API key and permissions');
        } else if (response.status === 401) {
          throw new Error('Unauthorized - authentication failed');
        } else if (response.status === 429) {
          throw new Error('Rate limit exceeded - please try again later');
        } else {
          throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
        }
      }

      // Parse and return the response data
      return await response.json();
    } catch (error) {
      logger.error(`Error in API call to ${endpoint}:`, error);

      // Rethrow the error with a clear message
      if (error instanceof Error) {
        throw error;
      } else {
        throw new Error(`Unknown error in API call to ${endpoint}`);
      }
    }
  }

  // Add proxy method for direct API calls
  async proxy(payload: any): Promise<any> {
    try {
      logger.log('Proxying request:', {
        action: payload.action,
        entryId: payload.data?.entryId,
        contentTypeId: payload.data?.contentTypeId,
        fieldMappingsCount: payload.data?.fieldMappings?.length || 0,
      });

      // Make the API request through our proxy
      const response = await fetch(this.proxyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      });

      // Check if the response is ok
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        logger.error('Proxy API call failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
        });

        // Handle different HTTP errors
        if (response.status === 403) {
          throw new Error('Forbidden - check your API key and permissions');
        } else if (response.status === 401) {
          throw new Error('Unauthorized - authentication failed');
        } else if (response.status === 429) {
          throw new Error('Rate limit exceeded - please try again later');
        } else {
          throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
        }
      }

      // Parse and return the response data
      const responseData = await response.json();
      logger.log('Proxy API call succeeded with result:', responseData);
      return responseData;
    } catch (error) {
      logger.error('Error in proxy API call:', error);
      throw error;
    }
  }
}
