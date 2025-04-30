import axios, { AxiosInstance } from 'axios';
import { API_PROXY_URL, KlaviyoOAuthConfig } from '../config/klaviyo';
import { OAuthService } from './oauth';
import { logger } from '../utils/logger';

// Define the Tokens interface
interface Tokens {
  access_token: string;
  refresh_token?: string;
  token_type?: string;
  expires_in?: number;
}

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
  private config: KlaviyoOAuthConfig;
  private oauthService: OAuthService;
  private proxyApi: AxiosInstance;
  private proxyUrl: string;
  private tokens: Tokens | null = null;

  constructor(config: KlaviyoOAuthConfig) {
    this.config = config;
    this.oauthService = new OAuthService(config);

    // Determine proxy URL with proper origin if needed
    this.proxyUrl = API_PROXY_URL.startsWith('http')
      ? API_PROXY_URL
      : window.location.origin + API_PROXY_URL;

    const accessToken = config.accessToken || this.oauthService.getAccessToken();
    logger.log('Initialized KlaviyoService with proxy URL:', this.proxyUrl);
    logger.log('Initialized KlaviyoService with tokens:', this.tokens);

    // Initialize proxy API client
    this.proxyApi = axios.create({
      baseURL: API_PROXY_URL.startsWith('http')
        ? API_PROXY_URL
        : window.location.origin + API_PROXY_URL,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${accessToken || this.tokens?.access_token}`,
      },
    });
  }

  setTokens(tokens: Tokens) {
    this.tokens = tokens;
    if (tokens?.access_token) {
      this.proxyApi.defaults.headers.common['Authorization'] = `Bearer ${tokens.access_token}`;
    }
  }

  private async callApi<T>(endpoint: string, method: string, data?: any): Promise<T> {
    logger.log('Calling API:', {
      endpoint,
      method,
      data,
      tokens: this.tokens,
    });

    if (!this.tokens?.access_token) {
      throw new Error('No access token available');
    }

    let attributes = {};
    logger.log('Data:', data, data.contentType === 'text');
    if (data.contentType === 'text') {
      // Ensure content is always a string to avoid 400 errors with numbers
      const contentValue =
        typeof data.fields[0].value !== 'string'
          ? String(data.fields[0].value)
          : data.fields[0].value;

      attributes = {
        type: 'template-universal-content',
        attributes: {
          name: data.name,
          definition: {
            content_type: 'block',
            type: 'text',
            data: {
              content: contentValue,
              display_options: {},
              styles: {},
            },
          },
        },
      };
    } else if (data.contentType === 'image') {
      attributes = {
        type: 'image',
        attributes: {
          name: data.name,
          import_from_url: data.url,
        },
      };
    } else if (data.contentType === 'html') {
      // Also ensure HTML content is always a string
      const htmlContent =
        typeof data.fields[0].value !== 'string'
          ? String(data.fields[0].value)
          : data.fields[0].value;

      attributes = {
        type: 'template-universal-content',
        attributes: {
          name: data.name,
          definition: {
            content_type: 'block',
            type: 'html',
            data: {
              content: htmlContent,
              display_options: {},
              styles: {},
            },
          },
        },
      };
    }

    try {
      const config = {
        method,
        url: endpoint.startsWith('/') ? endpoint : `/${endpoint}`,
        ...(method === 'GET'
          ? { params: data }
          : { data: { data: attributes, authorization: `Bearer ${this.tokens.access_token}` } }),
      };

      logger.log('Making API request:', {
        method: config.method,
        url: config.url,
        config: config,
        dataType: method === 'GET' ? 'params' : 'body',
      });

      const response = await this.proxyApi.request<{ data: T }>(config);
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

  private mapContentfulFieldToKlaviyo(
    contentfulFieldId: string,
    klaviyoBlockName: string,
    value: any
  ): FieldMapping {
    // Ensure value is always a string to avoid issues with numbers/integers
    return {
      contentfulFieldId,
      klaviyoBlockName,
      name: klaviyoBlockName,
      type: 'text',
      severity: 'info',
      fieldType: 'text',
      value: value != null ? String(value) : '',
    };
  }

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

      const response = await this.callApi('template-universal-content', 'POST', {
        name,
        contentType,
        fields: mappedFields,
      });
      return response;
    } catch (error) {
      logger.error('Error creating universal content block:', error);
      throw error;
    }
  }

  async updateUniversalContentBlock(blockId: string, fields: FieldMapping[]): Promise<any> {
    try {
      const mappedFields = fields.map((field) =>
        this.mapContentfulFieldToKlaviyo(
          field.contentfulFieldId,
          field.klaviyoBlockName,
          field.value
        )
      );
      const response = await this.callApi(`template-universal-content/${blockId}`, 'PUT', {
        fields: mappedFields,
      });
      return response;
    } catch (error) {
      logger.error('Error updating universal content block:', error);
      throw error;
    }
  }

  async uploadImage(imageUrl: string, name?: string): Promise<any> {
    logger.log('Uploading image:', imageUrl, name ? `with name: ${name}` : '');

    // Default name if not provided
    const imageName = name || 'Contentful Image';

    try {
      // Ensure Contentful URLs have https: prefix
      const fullImageUrl = imageUrl.startsWith('//') ? `https:${imageUrl}` : imageUrl;

      const uploadedImage = await this.callApi('images', 'POST', {
        contentType: 'image',
        url: fullImageUrl,
        name: imageName,
      });

      logger.log('Uploaded image:', uploadedImage);
      return uploadedImage;
    } catch (error: any) {
      logger.error('Failed to upload image:', error);
      throw new Error(`Failed to upload image: ${error.message}`);
    }
  }

  // Helper method to extract asset URL from Contentful asset reference
  private getAssetUrl(entry: any, fieldId: string): string | null {
    logger.log(`Extracting asset URL for field ${fieldId}`);

    try {
      // First, check if we're dealing with the new SDK format
      if (entry.fields[fieldId]?._fieldLocales) {
        logger.log(`Field ${fieldId} has _fieldLocales format`);

        // Get the locale value - prefer 'en-US' or use the first available locale
        const localeKeys = Object.keys(entry.fields[fieldId]._fieldLocales);
        const locale = localeKeys.includes('en-US') ? 'en-US' : localeKeys[0];

        if (!locale) {
          logger.error(`No locales found for field ${fieldId}`);
          return null;
        }

        const fieldLocale = entry.fields[fieldId]._fieldLocales[locale];
        const assetData = fieldLocale?._value;

        logger.log(`Asset data from _fieldLocales:`, assetData);

        // If the field has _value that contains a sys property (direct reference)
        if (assetData?.sys) {
          if (
            assetData.sys.type === 'Link' &&
            assetData.sys.linkType === 'Asset' &&
            assetData.sys.id
          ) {
            const assetId = assetData.sys.id;
            logger.log(`Found direct asset reference with ID: ${assetId}`);

            // Try to use the spaceId from entry.sys.space.sys.id if available
            const spaceId = entry.sys?.space?.sys?.id;
            if (spaceId) {
              const assetUrl = `https://images.ctfassets.net/${spaceId}/${assetId}/asset.jpg`;
              logger.log(`Constructed asset URL: ${assetUrl}`);
              return assetUrl;
            }

            // If we can't get the space ID from the entry, try to extract it from localStorage
            // This is a fallback mechanism
            const envSpaceId = localStorage.getItem('contentful_space_id');
            if (envSpaceId) {
              const assetUrl = `https://images.ctfassets.net/${envSpaceId}/${assetId}/asset.jpg`;
              logger.log(`Constructed asset URL with stored space ID: ${assetUrl}`);
              return assetUrl;
            }

            // Store the asset ID for use elsewhere even if we can't construct the URL now
            logger.log(`Could not construct URL, but asset ID is: ${assetId}`);
            return `asset:${assetId}`;
          }
        }

        // If it's a string, it might be a JSON string that needs parsing
        if (typeof assetData === 'string') {
          try {
            // Check for stringified JSON containing a Link reference
            if (
              assetData.includes('"sys"') &&
              assetData.includes('"type":"Link"') &&
              assetData.includes('"linkType":"Asset"')
            ) {
              logger.log(`Found stringified asset reference: ${assetData}`);
              const parsed = JSON.parse(assetData);

              // Check for Link type references to assets
              if (parsed.sys?.type === 'Link' && parsed.sys?.linkType === 'Asset') {
                // Unresolved asset reference
                const assetId = parsed.sys.id;
                logger.log(`Unresolved Asset link reference with ID: ${assetId}`);

                // Try to use the spaceId from entry.sys.space.sys.id if available
                const spaceId = entry.sys?.space?.sys?.id;
                if (spaceId && assetId) {
                  const assetUrl = `https://images.ctfassets.net/${spaceId}/${assetId}/asset.jpg`;
                  logger.log(`Constructed asset URL: ${assetUrl}`);
                  return assetUrl;
                }

                // Fallback to using localStorage
                const envSpaceId = localStorage.getItem('contentful_space_id');
                if (envSpaceId && assetId) {
                  const assetUrl = `https://images.ctfassets.net/${envSpaceId}/${assetId}/asset.jpg`;
                  logger.log(`Constructed asset URL with stored space ID: ${assetUrl}`);
                  return assetUrl;
                }

                // Store the asset ID for use elsewhere even if we can't construct the URL now
                logger.log(`Could not construct URL, but asset ID is: ${assetId}`);
                return `asset:${assetId}`;
              }
            }
          } catch (e) {
            // Not a valid JSON string, continue with other checks
            logger.log(`Error parsing asset data:`, e);
          }
        }

        // Handle complex nested structure in _fieldLocales
        // This is a special case for the structure observed in the logs
        if (fieldLocale && typeof fieldLocale === 'object') {
          // Try to extract the asset ID from various possible paths in the structure
          let assetId = null;

          // Search for asset ID in _value.sys path
          if (
            fieldLocale._value?.sys?.id &&
            (fieldLocale._value.sys.linkType === 'Asset' || fieldLocale._value.sys.type === 'Asset')
          ) {
            assetId = fieldLocale._value.sys.id;
            logger.log(`Found asset ID in _value.sys: ${assetId}`);
          }

          // Check for nested sys objects that might contain the asset ID
          if (!assetId && typeof fieldLocale === 'object') {
            // Try to find any sys object with linkType=Asset recursively
            const findAssetId = (obj: any, depth = 0): string | null => {
              if (!obj || typeof obj !== 'object' || depth > 5) return null;

              if (
                obj.sys &&
                obj.sys.id &&
                (obj.sys.linkType === 'Asset' || obj.sys.type === 'Asset')
              ) {
                return obj.sys.id;
              }

              for (const key in obj) {
                if (typeof obj[key] === 'object') {
                  const foundId = findAssetId(obj[key], depth + 1);
                  if (foundId) return foundId;
                }
              }

              return null;
            };

            assetId = findAssetId(fieldLocale);
            if (assetId) {
              logger.log(`Found asset ID through recursive search: ${assetId}`);
            }
          }

          if (assetId) {
            // Try to get space ID from different sources
            const spaceId =
              entry.sys?.space?.sys?.id || localStorage.getItem('contentful_space_id');

            if (spaceId) {
              const assetUrl = `https://images.ctfassets.net/${spaceId}/${assetId}/asset.jpg`;
              logger.log(`Constructed asset URL for complex structure: ${assetUrl}`);
              return assetUrl;
            }

            // Store the asset ID for use elsewhere even if we can't construct the URL now
            logger.log(`Could not construct URL, but asset ID is: ${assetId}`);
            return `asset:${assetId}`;
          }
        }

        // If it's an object with fields property, it might be a resolved asset
        if (assetData?.fields?.file?.['en-US']?.url) {
          logger.log(`Found file URL in _fieldLocales:`, assetData.fields.file['en-US'].url);
          return `https:${assetData.fields.file['en-US'].url}`;
        }
      }

      // Check for direct stringified JSON in the field value
      const directFieldValue = entry.fields[fieldId]?.['en-US'];
      if (typeof directFieldValue === 'string' && directFieldValue.includes('"sys"')) {
        try {
          logger.log(`Found potential stringified asset JSON: ${directFieldValue}`);
          const parsed = JSON.parse(directFieldValue);

          if (parsed.sys?.type === 'Link' && parsed.sys?.linkType === 'Asset' && parsed.sys?.id) {
            const assetId = parsed.sys.id;
            logger.log(`Parsed stringified asset reference with ID: ${assetId}`);

            // Try to use the spaceId from entry.sys.space.sys.id if available
            const spaceId = entry.sys?.space?.sys?.id;
            if (spaceId) {
              const assetUrl = `https://images.ctfassets.net/${spaceId}/${assetId}/asset.jpg`;
              logger.log(`Constructed asset URL: ${assetUrl}`);
              return assetUrl;
            }

            // Fallback to localStorage
            const envSpaceId = localStorage.getItem('contentful_space_id');
            if (envSpaceId) {
              const assetUrl = `https://images.ctfassets.net/${envSpaceId}/${assetId}/asset.jpg`;
              logger.log(`Constructed asset URL with stored space ID: ${assetUrl}`);
              return assetUrl;
            }

            // Store the asset ID for use elsewhere
            return `asset:${assetId}`;
          }
        } catch (e) {
          logger.log(`Error parsing potential asset JSON: ${e}`);
        }
      }

      // Check for CMA-resolved asset
      if (entry.fields[fieldId]?.['en-US']?.fields?.file?.url) {
        logger.log(
          `Found CMA-resolved asset with direct URL:`,
          entry.fields[fieldId]['en-US'].fields.file.url
        );
        return `https:${entry.fields[fieldId]['en-US'].fields.file.url}`;
      }

      // Check for old SDK format (direct access to fields)
      if (entry.fields[fieldId]?.['en-US']?.fields?.file?.['en-US']?.url) {
        logger.log(
          `Found asset URL in old SDK format:`,
          entry.fields[fieldId]['en-US'].fields.file['en-US'].url
        );
        return `https:${entry.fields[fieldId]['en-US'].fields.file['en-US'].url}`;
      }

      // For assets that have already been published, check for the standard format
      if (entry.fields[fieldId]?.['en-US']?.url) {
        logger.log(`Found direct asset URL:`, entry.fields[fieldId]['en-US'].url);
        return entry.fields[fieldId]['en-US'].url.startsWith('//')
          ? `https:${entry.fields[fieldId]['en-US'].url}`
          : entry.fields[fieldId]['en-US'].url;
      }

      // Direct sys structure check - for unresolved asset references
      const fieldValue = entry.fields[fieldId]?.['en-US'];
      if (fieldValue && typeof fieldValue === 'object') {
        // Check specifically for direct Link references in sys
        if (
          fieldValue.sys?.type === 'Link' &&
          fieldValue.sys?.linkType === 'Asset' &&
          fieldValue.sys?.id
        ) {
          const assetId = fieldValue.sys.id;
          logger.log(`Found unresolved Link reference to Asset with ID: ${assetId}`);

          // Try to use the spaceId from entry.sys.space.sys.id if available
          const spaceId = entry.sys?.space?.sys?.id;
          if (spaceId) {
            const assetUrl = `https://images.ctfassets.net/${spaceId}/${assetId}/asset.jpg`;
            logger.log(`Constructed asset URL: ${assetUrl}`);
            return assetUrl;
          }

          // Fallback to localStorage
          const envSpaceId = localStorage.getItem('contentful_space_id');
          if (envSpaceId) {
            const assetUrl = `https://images.ctfassets.net/${envSpaceId}/${assetId}/asset.jpg`;
            logger.log(`Constructed asset URL with stored space ID: ${assetUrl}`);
            return assetUrl;
          }

          // Store the asset ID for use elsewhere
          return `asset:${assetId}`;
        }

        // Check for direct asset with sys but no Link type
        if (fieldValue.sys?.type === 'Asset' && fieldValue.sys?.id) {
          const assetId = fieldValue.sys.id;
          logger.log(`Found direct Asset reference with ID: ${assetId}`);

          // If it's a direct Asset (not a Link) and has file.url, we can extract the URL
          if (fieldValue.fields?.file?.url) {
            logger.log(`Found URL in direct Asset reference: ${fieldValue.fields.file.url}`);
            const url = fieldValue.fields.file.url;
            return url.startsWith('//') ? `https:${url}` : url;
          }

          // We found an Asset reference but couldn't get the URL
          logger.log(`Asset reference found but couldn't extract URL. Asset ID: ${assetId}`);

          // Try to use the spaceId from entry.sys.space.sys.id if available
          const spaceId = entry.sys?.space?.sys?.id;
          if (spaceId) {
            const assetUrl = `https://images.ctfassets.net/${spaceId}/${assetId}/asset.jpg`;
            logger.log(`Constructed asset URL: ${assetUrl}`);
            return assetUrl;
          }

          // Fallback to localStorage
          const envSpaceId = localStorage.getItem('contentful_space_id');
          if (envSpaceId) {
            const assetUrl = `https://images.ctfassets.net/${envSpaceId}/${assetId}/asset.jpg`;
            logger.log(`Constructed asset URL with stored space ID: ${assetUrl}`);
            return assetUrl;
          }

          // Store the asset ID for use elsewhere
          return `asset:${assetId}`;
        }
      }

      // Last resort: try to extract asset ID from any structure
      const extractAssetIdFromObject = (obj: any): string | null => {
        if (!obj || typeof obj !== 'object') return null;

        // Check if this object is an asset reference
        if (obj.sys?.type === 'Link' && obj.sys?.linkType === 'Asset' && obj.sys?.id) {
          return obj.sys.id;
        }

        if (obj.sys?.type === 'Asset' && obj.sys?.id) {
          return obj.sys.id;
        }

        // Recursively check all object properties
        for (const key in obj) {
          if (typeof obj[key] === 'object') {
            const result = extractAssetIdFromObject(obj[key]);
            if (result) return result;
          }
        }

        return null;
      };

      const assetId = extractAssetIdFromObject(entry.fields[fieldId]);
      if (assetId) {
        logger.log(`Extracted asset ID through deep search: ${assetId}`);

        const spaceId = entry.sys?.space?.sys?.id || localStorage.getItem('contentful_space_id');

        if (spaceId) {
          const assetUrl = `https://images.ctfassets.net/${spaceId}/${assetId}/asset.jpg`;
          logger.log(`Constructed asset URL from extracted ID: ${assetUrl}`);
          return assetUrl;
        }

        // Store the asset ID for use elsewhere
        return `asset:${assetId}`;
      }

      logger.log(
        'Could not extract asset URL from',
        JSON.stringify(entry.fields[fieldId], null, 2)
      );
      return null;
    } catch (error) {
      logger.error('Error extracting asset URL:', error);
      return null;
    }
  }

  // Helper method to detect and format location data
  private formatLocationData(content: any): string | null {
    // Check if content is a stringified JSON object containing lat/lon coordinates
    if (typeof content === 'string') {
      try {
        const parsed = JSON.parse(content);
        if (
          parsed &&
          typeof parsed === 'object' &&
          (parsed.lat !== undefined || parsed.latitude !== undefined) &&
          (parsed.lon !== undefined || parsed.lng !== undefined || parsed.longitude !== undefined)
        ) {
          // Extract coordinates with fallbacks for different property names
          const latitude = parsed.lat !== undefined ? parsed.lat : parsed.latitude;
          const longitude =
            parsed.lon !== undefined
              ? parsed.lon
              : parsed.lng !== undefined
              ? parsed.lng
              : parsed.longitude;

          // Format as a readable location string
          return `Latitude: ${latitude}, Longitude: ${longitude}`;
        }
      } catch (e) {
        // Not valid JSON, return as is
        return content;
      }
    }

    // Check if content is a direct object with lat/lon coordinates
    if (
      content &&
      typeof content === 'object' &&
      (content.lat !== undefined || content.latitude !== undefined) &&
      (content.lon !== undefined || content.lng !== undefined || content.longitude !== undefined)
    ) {
      // Extract coordinates with fallbacks for different property names
      const latitude = content.lat !== undefined ? content.lat : content.latitude;
      const longitude =
        content.lon !== undefined
          ? content.lon
          : content.lng !== undefined
          ? content.lng
          : content.longitude;

      // Format as a readable location string
      return `Latitude: ${latitude}, Longitude: ${longitude}`;
    }

    // If it's not a location object, return null
    return null;
  }

  // Helper method to detect and format JSON objects
  private formatJsonObject(content: any): string | null {
    // Check if the content is a stringified JSON
    if (typeof content === 'string') {
      try {
        const parsed = JSON.parse(content);

        // If it's an object or array, format it nicely
        if (typeof parsed === 'object' && parsed !== null) {
          // If it's a simple key-value object, format as a readable list
          if (!Array.isArray(parsed) && Object.keys(parsed).length > 0) {
            const keyValuePairs = Object.entries(parsed).map(([key, value]) => {
              // Format the value based on its type
              let formattedValue = value;
              if (typeof value === 'object' && value !== null) {
                formattedValue = JSON.stringify(value);
              }
              return `${key}: ${formattedValue}`;
            });

            return keyValuePairs.join('\n');
          }
        }
      } catch (e) {
        // Not valid JSON, return null to let other handlers process it
        return null;
      }
    }

    // If it's a direct object (not stringified)
    if (typeof content === 'object' && content !== null && !Array.isArray(content)) {
      const keyValuePairs = Object.entries(content).map(([key, value]) => {
        // Format the value based on its type
        let formattedValue = value;
        if (typeof value === 'object' && value !== null) {
          formattedValue = JSON.stringify(value);
        }
        return `${key}: ${formattedValue}`;
      });

      return keyValuePairs.join('\n');
    }

    // Not a JSON object we can format
    return null;
  }

  // Helper method to convert Contentful rich text to HTML
  private richTextToHtml(richTextNode: any): string {
    if (!richTextNode) return '';

    try {
      // Handle document node
      if (richTextNode.nodeType === 'document') {
        return (
          (richTextNode.content || []).map((node: any) => this.richTextToHtml(node)).join('') || ''
        );
      }

      // Handle paragraph node
      if (richTextNode.nodeType === 'paragraph') {
        const content =
          (richTextNode.content || []).map((node: any) => this.richTextToHtml(node)).join('') || '';
        return `<p>${content}</p>`;
      }

      // Handle heading nodes
      if (richTextNode.nodeType === 'heading-1') {
        const content =
          (richTextNode.content || []).map((node: any) => this.richTextToHtml(node)).join('') || '';
        return `<h1>${content}</h1>`;
      }
      if (richTextNode.nodeType === 'heading-2') {
        const content =
          (richTextNode.content || []).map((node: any) => this.richTextToHtml(node)).join('') || '';
        return `<h2>${content}</h2>`;
      }
      if (richTextNode.nodeType === 'heading-3') {
        const content =
          (richTextNode.content || []).map((node: any) => this.richTextToHtml(node)).join('') || '';
        return `<h3>${content}</h3>`;
      }
      if (richTextNode.nodeType === 'heading-4') {
        const content =
          (richTextNode.content || []).map((node: any) => this.richTextToHtml(node)).join('') || '';
        return `<h4>${content}</h4>`;
      }
      if (richTextNode.nodeType === 'heading-5') {
        const content =
          (richTextNode.content || []).map((node: any) => this.richTextToHtml(node)).join('') || '';
        return `<h5>${content}</h5>`;
      }
      if (richTextNode.nodeType === 'heading-6') {
        const content =
          (richTextNode.content || []).map((node: any) => this.richTextToHtml(node)).join('') || '';
        return `<h6>${content}</h6>`;
      }

      // Handle list nodes
      if (richTextNode.nodeType === 'unordered-list') {
        const content =
          (richTextNode.content || []).map((node: any) => this.richTextToHtml(node)).join('') || '';
        return `<ul>${content}</ul>`;
      }
      if (richTextNode.nodeType === 'ordered-list') {
        const content =
          (richTextNode.content || []).map((node: any) => this.richTextToHtml(node)).join('') || '';
        return `<ol>${content}</ol>`;
      }
      if (richTextNode.nodeType === 'list-item') {
        const content =
          (richTextNode.content || []).map((node: any) => this.richTextToHtml(node)).join('') || '';
        return `<li>${content}</li>`;
      }

      // Handle hyperlink
      if (richTextNode.nodeType === 'hyperlink') {
        const content =
          (richTextNode.content || []).map((node: any) => this.richTextToHtml(node)).join('') || '';
        return `<a href="${richTextNode.data?.uri || '#'}" ${
          richTextNode.data?.title ? `title="${richTextNode.data.title}"` : ''
        }>${content}</a>`;
      }

      // Handle text node
      if (richTextNode.nodeType === 'text') {
        let content = richTextNode.value || '';

        // Apply marks (bold, italic, etc.)
        if (richTextNode.marks && richTextNode.marks.length > 0) {
          for (const mark of richTextNode.marks) {
            if (mark.type === 'bold') {
              content = `<strong>${content}</strong>`;
            } else if (mark.type === 'italic') {
              content = `<em>${content}</em>`;
            } else if (mark.type === 'underline') {
              content = `<u>${content}</u>`;
            } else if (mark.type === 'code') {
              content = `<code>${content}</code>`;
            } else if (mark.type === 'superscript') {
              content = `<sup>${content}</sup>`;
            } else if (mark.type === 'subscript') {
              content = `<sub>${content}</sub>`;
            } else if (
              mark.type === 'strikethrough' ||
              mark.type === 'strike-through' ||
              mark.type === 'strike'
            ) {
              content = `<strike>${content}</strike>`;
            }
          }
        }

        return content;
      }

      // Handle hr/divider
      if (richTextNode.nodeType === 'hr') {
        return '<hr>';
      }

      // Handle blockquote
      if (richTextNode.nodeType === 'blockquote') {
        const content =
          (richTextNode.content || []).map((node: any) => this.richTextToHtml(node)).join('') || '';
        return `<blockquote>${content}</blockquote>`;
      }

      // Handle embedded entry or asset
      if (
        richTextNode.nodeType === 'embedded-entry-block' ||
        richTextNode.nodeType === 'embedded-asset-block' ||
        richTextNode.nodeType === 'embedded-entry-inline' ||
        richTextNode.nodeType === 'embedded-asset-inline'
      ) {
        return '[Embedded content]';
      }

      // If we don't recognize the node type, return empty string
      logger.warn(`Unhandled rich text node type: ${richTextNode.nodeType}`);
      return '';
    } catch (error) {
      logger.error('Error converting rich text to HTML:', error);
      return '[Rich text conversion error]';
    }
  }

  async syncContent(mappings: FieldMapping[], entry: any) {
    logger.log(`Starting content sync with ${mappings.length} mappings`);

    const promises: Promise<any>[] = [];

    for (const mapping of mappings) {
      let content: any = mapping.value;

      logger.log(`Processing field ${mapping.contentfulFieldId} with type ${mapping.fieldType}`);

      if (
        mapping.fieldType === 'text' ||
        mapping.fieldType === 'entry' ||
        mapping.fieldType === 'reference-array'
      ) {
        // Check if content is null or undefined
        if (content === null || content === undefined) {
          logger.log(`Content is null or undefined for ${mapping.contentfulFieldId}, skipping`);
          continue;
        }

        // Check if content is a boolean or number, convert to string for handling
        if (typeof content === 'boolean' || typeof content === 'number') {
          content = String(content);
        }

        // Check if content is an array, convert to comma-separated string for better display
        if (Array.isArray(content)) {
          logger.log(`Converting array to string for ${mapping.contentfulFieldId}`);
          content = content.join(', ');
        }

        // Check if this is a rich text object with content array and nodeType document
        if (
          typeof content === 'object' &&
          (content.nodeType === 'document' ||
            (content.content &&
              Array.isArray(content.content) &&
              (content.nodeType === 'document' || !content.nodeType)))
        ) {
          logger.log(`Found rich text object: ${JSON.stringify(content).substring(0, 100)}...`);

          // Convert rich text object to HTML using helper function
          let html = '';
          try {
            // If the object has a direct nodeType of document, use it directly
            if (content.nodeType === 'document') {
              html = this.richTextToHtml(content);
            }
            // If it's the structure with content array but missing nodeType, add it
            else {
              html = this.richTextToHtml({
                nodeType: 'document',
                data: content.data || {},
                content: content.content,
              });
            }

            logger.log(`Converted rich text to HTML: ${html.substring(0, 100)}...`);

            promises.push(
              this.createUniversalContentBlock(mapping.klaviyoBlockName, 'text', [
                this.createRichTextFieldMapping(
                  mapping.contentfulFieldId,
                  mapping.klaviyoBlockName,
                  html
                ),
              ])
            );
            continue;
          } catch (error) {
            logger.error(`Error converting rich text to HTML:`, error);
            // If HTML conversion fails, fall back to JSON stringify
            content = JSON.stringify(content);
          }
        }

        // Handle explicitly formatted JSON object (helps with debugging/formatting)
        // If it's an object/array, try to stringify it for better display
        let formattedJson = null;
        if (typeof content === 'object') {
          try {
            formattedJson = JSON.stringify(content, null, 2);
          } catch (error) {
            logger.error(`Error stringifying object:`, error);
          }
        }

        if (formattedJson !== null) {
          logger.log(
            `Found and formatted JSON object: ${formattedJson.substring(0, 100)}${
              formattedJson.length > 100 ? '...' : ''
            }`
          );

          // Use the formatted JSON string
          promises.push(
            this.createUniversalContentBlock(mapping.klaviyoBlockName, 'text', [
              this.createFieldMapping(
                mapping.contentfulFieldId,
                mapping.klaviyoBlockName,
                formattedJson
              ),
            ])
          );
          continue;
        }

        // Special handling for reference arrays
        // Check if this is a processed reference array (already converted to string by onEntryUpdate)
        if (
          typeof content === 'string' &&
          (content.includes('Referenced entry:') ||
            content.includes('[Unresolved reference:') ||
            content.includes(', '))
        ) {
          logger.log(`Found processed reference array content: ${content.substring(0, 100)}...`);
          // This is already processed by onEntryUpdate, so we can use it directly
        }

        // Handle JSON strings that might need formatting (for better display)
        // If it's a JSON string that wasn't parsed earlier, try to parse and reformat it
        if (typeof content === 'string' && content.startsWith('{') && content.endsWith('}')) {
          try {
            const parsed = JSON.parse(content);

            // Check if this is an unresolved asset reference
            if (parsed.sys?.type === 'Link' && parsed.sys?.linkType === 'Asset' && parsed.sys?.id) {
              logger.log(`Found unresolved asset reference in text field: ${parsed.sys.id}`);
              content = `[Image reference: ${parsed.sys.id}]`;
            } else {
              // Regular JSON formatting
              const formatted = JSON.stringify(parsed, null, 2);
              logger.log(`Reformatted JSON string: ${formatted.substring(0, 100)}...`);
              content = formatted;
            }
          } catch (error) {
            // Not valid JSON, continue with original content
            logger.log(`String looks like JSON but couldn't be parsed, using as-is`);
          }
        }

        logger.log(
          `Syncing ${mapping.fieldType} field:`,
          mapping.klaviyoBlockName,
          typeof content === 'string' && content.length > 100
            ? content.substring(0, 100) + '...'
            : content
        );

        promises.push(
          this.createUniversalContentBlock(mapping.klaviyoBlockName, 'text', [
            this.createFieldMapping(mapping.contentfulFieldId, mapping.klaviyoBlockName, content),
          ])
        );
      } else if (mapping.fieldType === 'image') {
        logger.log('Processing image field:', mapping.contentfulFieldId);

        // IMPORTANT: Always use the image API endpoint for image fields
        let imageUrl = null;
        let assetId = null;

        // Get the entry's space ID
        const spaceId = entry.sys?.space?.sys?.id || localStorage.getItem('contentful_space_id');

        if (typeof content === 'string') {
          logger.log(
            `Image field has string value: ${
              content.length > 100 ? content.substring(0, 100) + '...' : content
            }`
          );

          // Case 1: Check for asset: prefix which contains the asset ID
          if (content.startsWith('asset:')) {
            assetId = content.substring(6); // Remove the 'asset:' prefix
            logger.log(`Extracted asset ID from asset: prefix: ${assetId}`);

            if (spaceId) {
              imageUrl = `https://images.ctfassets.net/${spaceId}/${assetId}/asset.jpg`;
              logger.log(`Constructed asset URL from asset: prefix: ${imageUrl}`);
            }
          }
          // Case 2: It's already a URL
          else if (content.startsWith('http') || content.startsWith('//')) {
            imageUrl = content.startsWith('//') ? `https:${content}` : content;
            logger.log(`Using direct URL: ${imageUrl}`);
          }
          // Case 3: It's a stringified JSON with sys.id
          else if (
            content.includes('"sys"') &&
            (content.includes('"type":"Link"') || content.includes('"type":"Asset"')) &&
            content.includes('"linkType":"Asset"')
          ) {
            try {
              const parsed = JSON.parse(content);
              if (
                (parsed.sys?.type === 'Link' &&
                  parsed.sys?.linkType === 'Asset' &&
                  parsed.sys?.id) ||
                (parsed.sys?.type === 'Asset' && parsed.sys?.id)
              ) {
                assetId = parsed.sys.id;
                logger.log(`Extracted asset ID from JSON string: ${assetId}`);

                if (spaceId) {
                  imageUrl = `https://images.ctfassets.net/${spaceId}/${assetId}/asset.jpg`;
                  logger.log(`Constructed asset URL from stringified JSON: ${imageUrl}`);
                }
              }
            } catch (e) {
              logger.error(`Error parsing potential asset JSON string:`, e);
            }
          }
        }
        // Case 4: Direct object with sys property
        else if (typeof content === 'object' && content?.sys) {
          if (
            (content.sys.type === 'Link' && content.sys.linkType === 'Asset' && content.sys.id) ||
            (content.sys.type === 'Asset' && content.sys.id)
          ) {
            assetId = content.sys.id;
            logger.log(`Found direct asset reference with ID: ${assetId}`);

            if (spaceId) {
              imageUrl = `https://images.ctfassets.net/${spaceId}/${assetId}/asset.jpg`;
              logger.log(`Constructed asset URL from direct reference: ${imageUrl}`);
            }
          } else if (content.sys.type === 'Asset' && content.fields?.file?.url) {
            const fileUrl = content.fields.file.url;
            imageUrl = fileUrl.startsWith('//') ? `https:${fileUrl}` : fileUrl;
            logger.log(`Found URL in direct asset: ${imageUrl}`);
          }
        }

        // If we still don't have an image URL, try to extract from field data
        if (!imageUrl) {
          // Check field data in the entry
          const fieldData = entry.fields[mapping.contentfulFieldId];

          // Look for _resolvedUrl first (added by our asset resolution code)
          if (fieldData?.['en-US']?._resolvedUrl) {
            imageUrl = fieldData['en-US']._resolvedUrl;
            logger.log(`Found _resolvedUrl in field data: ${imageUrl}`);
          } else if (fieldData?._fieldLocales?.['en-US']?._value?._resolvedUrl) {
            imageUrl = fieldData._fieldLocales['en-US']._value._resolvedUrl;
            logger.log(`Found _resolvedUrl in _fieldLocales: ${imageUrl}`);
          }
          // Try to parse the field value if it's a string
          else if (
            typeof fieldData?.['en-US'] === 'string' &&
            fieldData['en-US'].includes('"sys"')
          ) {
            try {
              const parsed = JSON.parse(fieldData['en-US']);
              if (
                (parsed.sys?.type === 'Link' &&
                  parsed.sys?.linkType === 'Asset' &&
                  parsed.sys?.id) ||
                (parsed.sys?.type === 'Asset' && parsed.sys?.id)
              ) {
                assetId = parsed.sys.id;
                logger.log(`Extracted asset ID from field data JSON: ${assetId}`);

                if (spaceId) {
                  imageUrl = `https://images.ctfassets.net/${spaceId}/${assetId}/asset.jpg`;
                  logger.log(`Constructed asset URL from field data: ${imageUrl}`);
                }
              }
            } catch (e) {
              logger.error(`Error parsing field data JSON:`, e);
            }
          }
          // Last resort: try getAssetUrl helper
          else {
            let assetUrlResult = this.getAssetUrl(entry, mapping.contentfulFieldId);
            logger.log(`Used getAssetUrl helper, result: ${assetUrlResult || 'null'}`);

            // Check if the result is an asset ID marker
            if (assetUrlResult && assetUrlResult.startsWith('asset:')) {
              assetId = assetUrlResult.substring(6); // Remove the 'asset:' prefix
              logger.log(`Extracted asset ID from getAssetUrl result: ${assetId}`);

              if (spaceId) {
                imageUrl = `https://images.ctfassets.net/${spaceId}/${assetId}/asset.jpg`;
                logger.log(`Constructed asset URL from asset ID: ${imageUrl}`);
              }
            } else if (assetUrlResult) {
              imageUrl = assetUrlResult;
            }
          }
        }

        // If we have a URL, upload it using the image API
        if (imageUrl) {
          logger.log(`Uploading image to Klaviyo using image API: ${imageUrl}`);
          promises.push(this.uploadImage(imageUrl, mapping.klaviyoBlockName));
        }
        // If we only have an asset ID, try to construct a URL
        else if (assetId && spaceId) {
          const constructedUrl = `https://images.ctfassets.net/${spaceId}/${assetId}/asset.jpg`;
          logger.log(`Uploading constructed URL to Klaviyo: ${constructedUrl}`);
          promises.push(this.uploadImage(constructedUrl, mapping.klaviyoBlockName));
        } else {
          logger.error(`Could not determine image URL for field ${mapping.contentfulFieldId}`);

          // Extract any available asset ID from the error context
          let referenceId = assetId;

          // If we don't have an asset ID yet, try to extract it from content
          if (!referenceId && typeof content === 'object' && content?.sys?.id) {
            referenceId = content.sys.id;
          }

          // If we still don't have an ID, check for a deep asset reference
          if (!referenceId) {
            const extractAssetId = (obj: any): string | null => {
              if (!obj || typeof obj !== 'object') return null;

              if (
                obj.sys?.id &&
                (obj.sys?.type === 'Asset' ||
                  (obj.sys?.type === 'Link' && obj.sys?.linkType === 'Asset'))
              ) {
                return obj.sys.id;
              }

              for (const key in obj) {
                if (typeof obj[key] === 'object') {
                  const result = extractAssetId(obj[key]);
                  if (result) return result;
                }
              }

              return null;
            };

            referenceId =
              extractAssetId(content) ||
              extractAssetId(entry.fields[mapping.contentfulFieldId]) ||
              'unknown';
          }

          // Instead of skipping, create a text message explaining the issue
          const errorMessage = `[Image could not be resolved. Asset Reference: ${
            referenceId || 'unknown'
          }]`;

          logger.log(`Creating text placeholder for unresolved image: ${errorMessage}`);
          promises.push(
            this.createUniversalContentBlock(mapping.klaviyoBlockName, 'text', [
              this.createFieldMapping(
                mapping.contentfulFieldId,
                mapping.klaviyoBlockName,
                errorMessage
              ),
            ])
          );
        }
      } else {
        logger.warn(
          `Unknown field type "${mapping.fieldType}" for field ${mapping.contentfulFieldId}`
        );
      }
    }

    const results = await Promise.all(promises);

    return results;
  }

  // Update the createFieldMapping function
  private createFieldMapping(
    contentfulFieldId: string,
    klaviyoBlockName: string,
    value: any
  ): FieldMapping {
    return {
      contentfulFieldId,
      klaviyoBlockName,
      name: klaviyoBlockName,
      type: 'text',
      severity: 'info',
      fieldType: 'text',
      // Ensure value is always a string to avoid 400 errors
      value: value != null ? String(value) : '',
    };
  }

  // Update the createRichTextFieldMapping function
  private createRichTextFieldMapping(
    contentfulFieldId: string,
    klaviyoBlockName: string,
    value: any
  ): FieldMapping {
    return {
      contentfulFieldId,
      klaviyoBlockName,
      name: klaviyoBlockName,
      type: 'html',
      severity: 'info',
      fieldType: 'text',
      // Ensure value is always a string to avoid 400 errors
      value: value != null ? String(value) : '',
    };
  }
}
