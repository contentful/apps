import { documentToHtmlString } from '@contentful/rich-text-html-renderer';
import { FieldMapping } from '../config/klaviyo';
import { KnownSDK, CMAClient } from '@contentful/app-sdk';

interface KlaviyoCredentials {
  accessToken: string;
}

interface KlaviyoImage {
  id: string;
  attributes: {
    name: string;
    image_url: string;
    format?: string;
    size?: number;
    hidden: boolean;
    updated_at: string;
  };
}

declare global {
  interface Window {
    sdk: KnownSDK;
  }
}

export class KlaviyoService {
  private cma: CMAClient;

  constructor(cma: CMAClient) {
    this.cma = cma;
  }

  /**
   * Safely extracts a field value, handling different field types
   */
  private safeFieldValue(fieldId: string, value: any): string {
    if (value === null || value === undefined) {
      return '';
    }

    // Handle rich text documents
    if (typeof value === 'object' && value.nodeType === 'document') {
      try {
        const html = documentToHtmlString(value);
        return html;
      } catch (error) {
        console.error(`Error converting rich text to HTML:`, error);
        return '';
      }
    }

    // Handle arrays
    if (Array.isArray(value)) {
      return value.map((item) => this.safeFieldValue(fieldId, item)).join(', ');
    }

    // Handle location data
    if (typeof value === 'object' && value.lat && value.lon) {
      return `${value.lat}, ${value.lon}`;
    }

    // Handle references and entries with fields
    if (typeof value === 'object' && value.fields) {
      if (value.fields.title) {
        return value.fields.title['en-US'] || value.fields.title || '';
      }
      return Object.values(value.fields)
        .map((field) => this.safeFieldValue(fieldId, field))
        .join(', ');
    }

    // Handle empty objects
    if (typeof value === 'object' && Object.keys(value).length === 0) {
      return '';
    }

    // Handle JSON objects and other objects
    if (typeof value === 'object') {
      try {
        // If it's already a string, try to parse it first
        if (typeof value === 'string') {
          try {
            value = JSON.parse(value);
          } catch (e) {
            // If parsing fails, use the string as is
            return value;
          }
        }
        // Format the JSON with proper indentation for readability
        return JSON.stringify(value, null, 2);
      } catch (error) {
        console.error(`Error stringifying object:`, error);
        return '';
      }
    }

    // Fallback to string conversion
    try {
      return String(value);
    } catch (error) {
      console.error(`Error converting value to string:`, error);
      return '';
    }
  }

  /**
   * Converts data to HTML format for Klaviyo
   */
  private convertDataToHTML(data: Record<string, any>): string {
    let html = '';
    for (const [key, value] of Object.entries(data)) {
      if (value) {
        html += `<div class="klaviyo-field" data-field="${key}">${value}</div>`;
      }
    }
    return html;
  }

  /**
   * Find an image in Klaviyo by name
   */
  private async findImageByName(name: string): Promise<KlaviyoImage | null> {
    try {
      if (!window.sdk.ids.app) {
        throw new Error('App ID is not available');
      }

      // Create a filter that matches the base name with or without a numeric suffix
      const filter = `starts-with(attributes.name,\"${name}\")`;

      const response: any = await this.cma.appActionCall.createWithResponse(
        {
          appActionId: await this.getAppActionIdByName(
            'Proxy Request',
            window.sdk.ids.environment,
            window.sdk.ids.space
          ),
          appDefinitionId: window.sdk.ids.app || '',
          environmentId: window.sdk.ids.environment,
          spaceId: window.sdk.ids.space,
        },
        {
          parameters: {
            endpoint: 'images',
            method: 'GET',
            data: '{}',
            params: '{}',
          },
        }
      );

      // Parse the response body if it's a string
      let parsedResponse;
      if (typeof response.response?.body === 'string') {
        try {
          parsedResponse = JSON.parse(response.response.body);
        } catch (e) {
          console.error('Error parsing response body:', e);
          return null;
        }
      } else {
        parsedResponse = response.response?.body;
      }

      // Check for data in the response
      if (
        parsedResponse?.data &&
        Array.isArray(parsedResponse.data) &&
        parsedResponse.data.length > 0
      ) {
        // Find the exact match or the one with the highest numeric suffix
        const matches = parsedResponse.data.filter(
          (img: KlaviyoImage) =>
            img.attributes.name === name || img.attributes.name.startsWith(`${name}.`)
        );

        if (matches.length > 0) {
          // If there's an exact match, use that
          const exactMatch = matches.find((img: KlaviyoImage) => img.attributes.name === name);
          if (exactMatch) {
            return exactMatch;
          }

          // Otherwise, find the one with the highest numeric suffix
          const latestMatch = matches.reduce((latest: KlaviyoImage, current: KlaviyoImage) => {
            const latestNum = parseInt(latest.attributes.name.split('.').pop() || '0');
            const currentNum = parseInt(current.attributes.name.split('.').pop() || '0');
            return currentNum > latestNum ? current : latest;
          });
          return latestMatch;
        }
      }

      return null;
    } catch (error) {
      console.error('Error finding image by name:', error);
      return null;
    }
  }

  private async getAppActionIdByName(
    name: string,
    environmentId: string,
    spaceId: string
  ): Promise<string> {
    const appActions = await this.cma.appAction.getManyForEnvironment({ environmentId, spaceId });

    const appAction = appActions.items.find((action) => action.name === name);
    if (!appAction) {
      throw new Error(`App action with name ${name} not found`);
    }
    return appAction.sys.id;
  }

  /**
   * Uploads an image to Klaviyo's image API or updates an existing one
   */
  private async uploadImageToKlaviyo(imageUrl: string, name: string): Promise<any> {
    try {
      if (!window.sdk.ids.app) {
        throw new Error('App ID is not available');
      }

      // Check if image already exists
      const existingImage = await this.findImageByName(name);

      // Construct the payload based on whether we're updating or creating
      const payload = existingImage
        ? {
            data: {
              type: 'image',
              id: existingImage.id,
              attributes: {
                name: name,
                hidden: false,
              },
            },
          }
        : {
            data: {
              type: 'image',
              attributes: {
                name: name,
                import_from_url: imageUrl,
                hidden: false,
              },
            },
          };

      const response: any = await this.cma.appActionCall.createWithResponse(
        {
          appActionId: await this.getAppActionIdByName(
            'Proxy Request',
            window.sdk.ids.environment,
            window.sdk.ids.space
          ),
          appDefinitionId: window.sdk.ids.app || '',
          environmentId: window.sdk.ids.environment,
          spaceId: window.sdk.ids.space,
        },
        {
          parameters: {
            endpoint: existingImage ? `images/${existingImage.id}` : 'images',
            method: existingImage ? 'PATCH' : 'POST',
            params: '{}',
            data: JSON.stringify(payload),
          },
        }
      );

      // Parse the response body if it's a string
      let parsedResponse;
      if (typeof response.response?.body === 'string') {
        try {
          parsedResponse = JSON.parse(response.response.body);
        } catch (e) {
          console.error('Error parsing response body:', e);
          throw new Error('Failed to parse Klaviyo API response');
        }
      } else {
        parsedResponse = response.response?.body;
      }

      // Check for various error conditions
      if (!parsedResponse) {
        throw new Error('No response received from Klaviyo API');
      }

      if (parsedResponse.errors) {
        const errorMessage = Array.isArray(parsedResponse.errors)
          ? parsedResponse.errors[0]?.message || 'Unknown error'
          : parsedResponse.errors.message || 'Unknown error';
        throw new Error(`Klaviyo API error: ${errorMessage}`);
      }

      if (parsedResponse.error) {
        throw new Error(`Klaviyo API error: ${parsedResponse.error}`);
      }

      return parsedResponse;
    } catch (error) {
      console.error('Error uploading image to Klaviyo:', error);
      throw error;
    }
  }

  /**
   * Syncs content from Contentful to Klaviyo Universal Content
   */
  async syncContent(fieldMappings: FieldMapping[], entry: any, cma?: any): Promise<any> {
    try {
      const entryId = entry.sys?.id;
      if (!entryId) {
        console.error('Entry ID is missing');
        throw new Error('Entry ID is missing');
      }

      // Only use the fieldMappings argument passed in
      if (!fieldMappings || !Array.isArray(fieldMappings) || fieldMappings.length === 0) {
        const contentData: Record<string, any> = {};

        // Extract fields from the entry fields object
        if (entry.fields) {
          for (const fieldId in entry.fields) {
            try {
              const field = entry.fields[fieldId];

              // Handle localized fields
              if (typeof field === 'object' && !Array.isArray(field)) {
                const firstLocale = Object.keys(field)[0] || 'en-US';
                const value = field[firstLocale];

                // Add the field to content data
                if (value !== undefined && value !== null) {
                  contentData[fieldId] = this.safeFieldValue(fieldId, value);
                }
              } else {
                // Non-localized field
                if (field !== undefined && field !== null) {
                  contentData[fieldId] = this.safeFieldValue(fieldId, field);
                }
              }
            } catch (error) {
              console.error(`Error extracting field ${fieldId}:`, error);
            }
          }
        }
      } else {
        // Process all field mappings in parallel using Promise.all
        const mappingPromises = fieldMappings.map(async (mapping) => {
          try {
            const contentfulFieldId = mapping.contentfulFieldId;
            const klaviyoBlockName = mapping.klaviyoBlockName || contentfulFieldId;

            // Use mapping.value if present, otherwise fallback to old extraction logic
            let value = mapping.value;

            if (value === undefined) {
              if (entry.fields && entry.fields[contentfulFieldId]) {
                const field = entry.fields[contentfulFieldId];

                if (typeof field === 'object' && !Array.isArray(field)) {
                  const firstLocale = Object.keys(field)[0];
                  if (firstLocale) {
                    value = field[firstLocale];
                  }
                } else {
                  value = field;
                }
              } else if (entry[contentfulFieldId] !== undefined) {
                value = entry[contentfulFieldId];
              }
            }

            if (value === undefined || value === null || value === '') {
              return null;
            }

            const contentData: Record<string, any> = {};
            let imageUrl: string = '';
            let altText = klaviyoBlockName;
            let htmlContent = '';
            htmlContent = htmlContent ?? '';

            // Ensure htmlContent, imageUrl, and altText are always strings
            htmlContent = htmlContent || '';
            imageUrl = imageUrl || '';
            altText = altText || '';

            switch (mapping.fieldType?.toLowerCase()) {
              case 'image':
              case 'asset':
              case 'link':
                if (typeof value === 'object' && value.sys && value.sys.linkType === 'Asset') {
                  let assetId = value.sys.id;

                  // Fetch the correct asset URL from CMA
                  let cmaUrl = '';
                  if (assetId && cma) {
                    cmaUrl = (await this.fetchAssetUrlFromCMA(assetId, entry, cma)) || '';
                  }

                  if (!cmaUrl) {
                    console.error(
                      'Could not resolve a valid Contentful asset URL for image field:',
                      klaviyoBlockName
                    );
                    return null;
                  }

                  imageUrl = typeof cmaUrl === 'string' ? cmaUrl : '';
                  if (!imageUrl) {
                    console.error(
                      'Could not resolve a valid Contentful asset URL for image field:',
                      klaviyoBlockName
                    );
                    return null;
                  }

                  let imageName = klaviyoBlockName;

                  if (value.fields && value.fields.title) {
                    imageName =
                      value.fields.title['en-US'] || value.fields.title || klaviyoBlockName;
                  }

                  try {
                    // Use the image API instead of universal content for images
                    const imageResponse = await this.uploadImageToKlaviyo(imageUrl, imageName);
                    if (!imageResponse || !imageResponse.data || !imageResponse.data.id) {
                      throw new Error('Invalid response from Klaviyo image API');
                    }
                    return imageResponse;
                  } catch (error) {
                    console.error(`Error uploading image ${klaviyoBlockName}:`, error);
                    throw error;
                  }
                }
                return null;

              case 'richtext':
                try {
                  const richTextHtml = this.processRichText(value);
                  contentData[klaviyoBlockName] = richTextHtml;
                  htmlContent = this.convertDataToHTML(contentData);
                  return this.createOrUpdateContent(
                    klaviyoBlockName,
                    htmlContent,
                    `${entryId}-${klaviyoBlockName}`,
                    'text'
                  );
                } catch (error) {
                  console.error(`Error processing rich text field ${klaviyoBlockName}:`, error);
                  return null;
                }

              case 'json':
                try {
                  const jsonValue = typeof value === 'string' ? JSON.parse(value) : value;
                  contentData[klaviyoBlockName] = JSON.stringify(jsonValue, null, 2);
                  htmlContent = this.convertDataToHTML(contentData);
                  return this.createOrUpdateContent(
                    klaviyoBlockName,
                    htmlContent,
                    `${entryId}-${klaviyoBlockName}`,
                    'text'
                  );
                } catch (error) {
                  console.error(`Error processing JSON field ${klaviyoBlockName}:`, error);
                  return null;
                }

              default:
                // Handle text and other field types
                try {
                  const processedValue = this.safeFieldValue(klaviyoBlockName, value);
                  if (processedValue) {
                    contentData[klaviyoBlockName] = processedValue;
                    htmlContent = this.convertDataToHTML(contentData);
                    return this.createOrUpdateContent(
                      klaviyoBlockName,
                      htmlContent,
                      `${entryId}-${klaviyoBlockName}`,
                      'text'
                    );
                  }
                } catch (error) {
                  console.error(`Error processing field ${klaviyoBlockName}:`, error);
                }
                return null;
            }
          } catch (error) {
            console.error(`Error processing mapping for ${mapping.klaviyoBlockName}:`, error);
            throw error;
          }
        });

        try {
          // Wait for all promises to resolve and filter out null responses
          const responses = await Promise.all(mappingPromises);
          return responses.filter((response) => response !== null);
        } catch (error) {
          console.error('Error processing field mappings:', error);
          throw error;
        }
      }
    } catch (error) {
      console.error('Error in syncContent:', error);
      throw error;
    }
  }

  /**
   * Find content in Klaviyo by external ID (Contentful entry ID)
   */
  private async findContentByExternalId(nameWithId: string): Promise<any | null> {
    try {
      if (!window.sdk.ids.app) {
        throw new Error('App ID is not available');
      }
      // Query for existing content by name
      const response: any = await this.cma.appActionCall.createWithResponse(
        {
          appActionId: await this.getAppActionIdByName(
            'Proxy Request',
            window.sdk.ids.environment,
            window.sdk.ids.space
          ),
          appDefinitionId: window.sdk.ids.app || '',
          environmentId: window.sdk.ids.environment,
          spaceId: window.sdk.ids.space,
        },
        {
          parameters: {
            endpoint: 'template-universal-content',
            data: '{}',
            method: 'GET',
            params: JSON.stringify({ filter: `equals(name,\"${nameWithId}\")`, 'page[size]': 1 }),
          },
        }
      );

      // Parse the response body if it's a string
      let parsedResponse;
      if (typeof response.response?.body === 'string') {
        try {
          parsedResponse = JSON.parse(response.response.body);
        } catch (e) {
          console.error('Error parsing response body:', e);
          return null;
        }
      } else {
        parsedResponse = response.response?.body;
      }

      // Check for error in response
      if (parsedResponse?.response?.error) {
        console.error('Klaviyo API error:', parsedResponse.response.error);
        return null;
      }

      // Check for data in the response
      if (
        parsedResponse?.data &&
        Array.isArray(parsedResponse.data) &&
        parsedResponse.data.length > 0
      ) {
        return parsedResponse.data[0];
      }

      return null;
    } catch (error) {
      console.error('Error finding content by external ID:', error);
      return null;
    }
  }

  /**
   * Creates or updates content in Klaviyo
   */
  private async createOrUpdateContent(
    name: string,
    htmlContent: string,
    externalId: string,
    blockType: string = 'text',
    imageUrl?: string,
    altText?: string
  ): Promise<any> {
    imageUrl = imageUrl ?? '';
    altText = altText ?? '';
    const nameWithId = `${name || ''} [ID:${externalId || ''}]`;
    const payload = {
      data: {
        type: 'template-universal-content',
        attributes: {
          name: nameWithId,
          definition: {
            content_type: 'block',
            type: blockType,
            data:
              blockType === 'text'
                ? {
                    content: htmlContent || '',
                    styles: {},
                    display_options: {},
                  }
                : {
                    content: htmlContent || '',
                    image_url: imageUrl,
                    alt_text: altText || nameWithId,
                    styles: {},
                    display_options: {},
                  },
          },
        },
      },
    };

    try {
      const existing = await this.findContentByExternalId(nameWithId);
      if (existing && existing.id) {
        // Update existing content
        const updatePayload = {
          data: {
            type: 'template-universal-content',
            id: existing.id,
            attributes: payload.data ? payload.data.attributes : {},
          },
        };
        const response: any = await this.cma.appActionCall.createWithResponse(
          {
            appActionId: await this.getAppActionIdByName(
              'Proxy Request',
              window.sdk.ids.environment,
              window.sdk.ids.space
            ),
            appDefinitionId: window.sdk.ids.app || '',
            environmentId: window.sdk.ids.environment,
            spaceId: window.sdk.ids.space,
          },
          {
            parameters: {
              endpoint: `template-universal-content/${existing.id}`,
              method: 'PATCH',
              params: '{}',
              data: JSON.stringify(updatePayload),
            },
          }
        );

        // Parse the response body if it's a string
        let parsedResponse;
        if (typeof response.response?.body === 'string') {
          try {
            parsedResponse = JSON.parse(response.response.body);
          } catch (e) {
            console.error('Error parsing response body:', e);
            throw new Error('Failed to parse Klaviyo API response');
          }
        } else {
          parsedResponse = response.response?.body;
        }

        // Check for various error conditions
        if (!parsedResponse) {
          throw new Error('No response received from Klaviyo API');
        }

        if (parsedResponse.errors) {
          const errorMessage = Array.isArray(parsedResponse.errors)
            ? parsedResponse.errors[0]?.message || 'Unknown error'
            : parsedResponse.errors.message || 'Unknown error';
          throw new Error(`Klaviyo API error: ${errorMessage}`);
        }

        if (parsedResponse.error) {
          throw new Error(`Klaviyo API error: ${parsedResponse.error}`);
        }

        return parsedResponse;
      } else {
        // Create new content
        const response: any = await this.cma.appActionCall.createWithResponse(
          {
            appActionId: await this.getAppActionIdByName(
              'Proxy Request',
              window.sdk.ids.environment,
              window.sdk.ids.space
            ),
            appDefinitionId: window.sdk.ids.app || '',
            environmentId: window.sdk.ids.environment,
            spaceId: window.sdk.ids.space,
          },
          {
            parameters: {
              endpoint: 'template-universal-content',
              method: 'POST',
              params: '{}',
              data: JSON.stringify(payload),
            },
          }
        );

        // Parse the response body if it's a string
        let parsedResponse;
        if (typeof response.response?.body === 'string') {
          try {
            parsedResponse = JSON.parse(response.response.body);
          } catch (e) {
            console.error('Error parsing response body:', e);
            throw new Error('Failed to parse Klaviyo API response');
          }
        } else {
          parsedResponse = response.response?.body;
        }

        // Check for various error conditions
        if (!parsedResponse) {
          throw new Error('No response received from Klaviyo API');
        }

        if (parsedResponse.errors) {
          const errorMessage = Array.isArray(parsedResponse.errors)
            ? parsedResponse.errors[0]?.message || 'Unknown error'
            : parsedResponse.errors.message || 'Unknown error';
          throw new Error(`Klaviyo API error: ${errorMessage}`);
        }

        if (parsedResponse.error) {
          throw new Error(`Klaviyo API error: ${parsedResponse.error}`);
        }

        return parsedResponse;
      }
    } catch (error) {
      console.error('Error calling Klaviyo API:', error);
      throw error;
    }
  }

  /**
   * Fetches an asset URL from the Contentful CMA
   */
  private async fetchAssetUrlFromCMA(assetId: string, entry: any, cma: any): Promise<string> {
    try {
      const asset = await cma.asset.get({ assetId });
      if (asset && asset.fields && asset.fields.file) {
        const file = asset.fields.file['en-US'] || asset.fields.file;
        // Ensure the URL starts with 'https://' and doesn't have double slashes
        const url = file.url;
        if (url) {
          // Add https:// if the URL doesn't have a protocol
          const urlWithProtocol = url.startsWith('http') ? url : `https:${url}`;
          return urlWithProtocol;
        }
      }
      return '';
    } catch (error) {
      console.error('Error fetching asset URL:', error);
      return '';
    }
  }

  /**
   * Processes rich text content
   */
  private processRichText(value: any): string {
    if (!value) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'object' && value.nodeType === 'document') {
      return documentToHtmlString(value);
    }
    return String(value);
  }
}
