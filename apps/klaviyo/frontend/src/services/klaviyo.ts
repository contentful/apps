import axios, { AxiosInstance } from 'axios';
import { KLAVIYO_API_BASE_URL, API_PROXY_URL, KlaviyoOAuthConfig } from '../config/klaviyo';
import { OAuthService } from './oauth';

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

// Define the Klaviyo API response types
interface KlaviyoApiResponse<T> {
  data: T;
}

interface KlaviyoContentBlock {
  id: string;
  type: string;
  attributes: {
    name: string;
    text?: string;
    html?: string;
    url?: string;
  };
}

interface KlaviyoImage {
  id: string;
  type: string;
  attributes: {
    name: string;
    url: string;
  };
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
    console.log('Initialized KlaviyoService with proxy URL:', this.proxyUrl);
    console.log('Initialized KlaviyoService with tokens:', this.tokens);

    // Initialize proxy API client
    this.proxyApi = axios.create({
      baseURL: 'http://localhost:3001',
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
    console.log('Calling API:', {
      endpoint,
      method,
      data,
      tokens: this.tokens,
    });

    if (!this.tokens?.access_token) {
      throw new Error('No access token available');
    }

    let attributes = {};
    console.log('Data:', data, data.content_type === 'text');
    if (data.contentType === 'text') {
      attributes = {
        type: 'template-universal-content',
        attributes: {
          name: data.name,
          definition: {
            content_type: 'block',
            type: 'text',
            data: {
              content: data.fields[0].value,
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
      attributes = {
        type: 'template-universal-content',
        attributes: {
          name: data.name,
          definition: {
            content_type: 'block',
            type: 'html',
            data: {
              content: data.fields[0].value,
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

      console.log('Making API request:', {
        method: config.method,
        url: config.url,
        config: config,
        dataType: method === 'GET' ? 'params' : 'body',
      });

      const response = await this.proxyApi.request<{ data: T }>(config);
      return response.data.data;
    } catch (error: any) {
      console.error('API call failed:', {
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

  private mapFieldsToKlaviyo(fields: FieldMapping[]): Record<string, any> {
    const mappedFields: Record<string, any> = {};

    fields.forEach((field) => {
      mappedFields[field.klaviyoBlockName] = {
        name: field.name,
        type: field.type,
        value: field.value,
        fieldType: field.fieldType,
        contentfulFieldId: field.contentfulFieldId,
      };
    });

    return mappedFields;
  }

  private mapContentfulFieldToKlaviyo(
    contentfulFieldId: string,
    klaviyoBlockName: string,
    value: string
  ): FieldMapping {
    return this.createFieldMapping(contentfulFieldId, klaviyoBlockName, value);
  }

  private mapContentfulEntryToKlaviyo(entry: any, fieldMappings: FieldMapping[]): FieldMapping[] {
    return fieldMappings.map((mapping) => {
      const value = entry.fields[mapping.contentfulFieldId];
      return this.createFieldMapping(mapping.contentfulFieldId, mapping.klaviyoBlockName, value);
    });
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

      const response = await this.callApi('/api/klaviyo/proxy/template-universal-content', 'POST', {
        name,
        contentType,
        fields: mappedFields,
      });
      return response;
    } catch (error) {
      console.error('Error creating universal content block:', error);
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
      const response = await this.callApi(
        `/api/klaviyo/proxy/template-universal-content/${blockId}`,
        'PUT',
        {
          fields: mappedFields,
        }
      );
      return response;
    } catch (error) {
      console.error('Error updating universal content block:', error);
      throw error;
    }
  }

  async uploadImage(imageUrl: string): Promise<any> {
    console.log('Uploading image:', imageUrl);

    try {
      const uploadedImage = await this.callApi('/images', 'POST', {
        url: imageUrl,
      });
      console.log('Uploaded image:', uploadedImage);
      return uploadedImage;
    } catch (error: any) {
      console.error('Failed to upload image:', error);
      throw new Error(`Failed to upload image: ${error.message}`);
    }
  }

  // Helper method to extract asset URL from Contentful asset reference
  private getAssetUrl(entry: any, fieldId: string): string | null {
    console.log(`Extracting asset URL for field ${fieldId}`);

    try {
      // First, check if we're dealing with the new SDK format
      if (entry.fields[fieldId]?._fieldLocales) {
        console.log(`Field ${fieldId} has _fieldLocales format`);
        const assetData = entry.fields[fieldId]._fieldLocales['en-US']._value;
        console.log(`Asset data from _fieldLocales:`, assetData);

        // If it's a string, it might be a JSON string that needs parsing
        if (typeof assetData === 'string' && assetData.includes('"sys"')) {
          try {
            console.log(`Asset data is a JSON string:`, assetData);
            const parsed = JSON.parse(assetData);

            // Check for Link type references to assets
            if (parsed.sys?.type === 'Link' && parsed.sys?.linkType === 'Asset') {
              // This is a link to an asset, but we need to resolve it
              console.log('Asset link found but needs to be resolved:', assetData);
              return null;
            }
          } catch (e) {
            // Not a valid JSON string, continue with other checks
            console.log(`Error parsing asset data:`, e);
          }
        }

        // If it's an object with fields property, it might be a resolved asset
        if (assetData?.fields?.file?.['en-US']?.url) {
          console.log(`Found file URL in _fieldLocales:`, assetData.fields.file['en-US'].url);
          return `https:${assetData.fields.file['en-US'].url}`;
        }
      }

      // Check for CMA-resolved asset
      if (entry.fields[fieldId]?.['en-US']?.fields?.file?.url) {
        console.log(
          `Found CMA-resolved asset with direct URL:`,
          entry.fields[fieldId]['en-US'].fields.file.url
        );
        return `https:${entry.fields[fieldId]['en-US'].fields.file.url}`;
      }

      // Check for old SDK format (direct access to fields)
      if (entry.fields[fieldId]?.['en-US']?.fields?.file?.['en-US']?.url) {
        console.log(
          `Found asset URL in old SDK format:`,
          entry.fields[fieldId]['en-US'].fields.file['en-US'].url
        );
        return `https:${entry.fields[fieldId]['en-US'].fields.file['en-US'].url}`;
      }

      // For assets that have already been published, check for the standard format
      if (entry.fields[fieldId]?.['en-US']?.url) {
        console.log(`Found direct asset URL:`, entry.fields[fieldId]['en-US'].url);
        return entry.fields[fieldId]['en-US'].url.startsWith('//')
          ? `https:${entry.fields[fieldId]['en-US'].url}`
          : entry.fields[fieldId]['en-US'].url;
      }

      // Check for Link references to assets that have been resolved
      const fieldValue = entry.fields[fieldId]?.['en-US'];
      if (
        fieldValue &&
        fieldValue.sys &&
        fieldValue.sys.type === 'Link' &&
        fieldValue.sys.linkType === 'Asset'
      ) {
        console.log(`Found Link reference to Asset but URL not available`);
        // We can't extract the URL directly, but we can log the asset ID for debugging
        if (fieldValue.sys.id) {
          console.log(`Asset ID from Link: ${fieldValue.sys.id}`);
        }
        return null;
      }

      console.log(
        'Could not extract asset URL from',
        JSON.stringify(entry.fields[fieldId], null, 2)
      );
      return null;
    } catch (error) {
      console.error('Error extracting asset URL:', error);
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
      console.warn(`Unhandled rich text node type: ${richTextNode.nodeType}`);
      return '';
    } catch (error) {
      console.error('Error converting rich text to HTML:', error);
      return '[Rich text conversion error]';
    }
  }

  async syncContent(mappings: FieldMapping[], entry: any) {
    console.log(`Starting content sync with ${mappings.length} mappings`);

    // First, log all the mappings we received
    for (const mapping of mappings) {
      console.log(
        `Mapping: field=${mapping.contentfulFieldId}, type=${mapping.fieldType}, block=${mapping.klaviyoBlockName}`
      );
    }

    const promises = [];
    for (const mapping of mappings) {
      try {
        console.log(`Processing mapping: ${JSON.stringify(mapping)}`);

        if (
          mapping.fieldType === 'text' ||
          mapping.fieldType === 'entry' ||
          mapping.fieldType === 'reference-array'
        ) {
          let content;

          // Handle different SDK versions for getting field values
          if (entry.fields[mapping.contentfulFieldId]?._fieldLocales) {
            // New SDK
            content = entry.fields[mapping.contentfulFieldId]._fieldLocales['en-US']._value || '';
          } else {
            // Old SDK
            content = entry.fields[mapping.contentfulFieldId]?.['en-US'] || '';
          }

          console.log(`Content type: ${typeof content}`, content);

          // Check if this is a rich text object with content array and nodeType document
          if (
            typeof content === 'object' &&
            (content.nodeType === 'document' ||
              (content.content &&
                Array.isArray(content.content) &&
                (content.nodeType === 'document' || !content.nodeType)))
          ) {
            console.log(`Found rich text object: ${JSON.stringify(content).substring(0, 100)}...`);

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

              console.log(`Converted rich text to HTML: ${html.substring(0, 100)}...`);

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
              console.error(`Error converting rich text to HTML:`, error);
              // If HTML conversion fails, fall back to JSON stringify
              content = JSON.stringify(content);
            }
          }

          // Special handling for HTML content (converted from rich text)
          if (
            typeof content === 'string' &&
            (content.startsWith('<p>') ||
              content.startsWith('<h') ||
              content.includes('</p>') ||
              content.includes('</h'))
          ) {
            promises.push(
              this.createUniversalContentBlock(mapping.klaviyoBlockName, 'html', [
                this.createFieldMapping(
                  mapping.contentfulFieldId,
                  mapping.klaviyoBlockName,
                  content
                ),
              ])
            );
            continue;
          }

          // Special handling for location data
          const formattedLocation = this.formatLocationData(content);
          if (formattedLocation !== null) {
            console.log(`Found and formatted location data: ${formattedLocation}`);

            // Use the formatted location string
            promises.push(
              this.createUniversalContentBlock(mapping.klaviyoBlockName, 'text', [
                this.createFieldMapping(
                  mapping.contentfulFieldId,
                  mapping.klaviyoBlockName,
                  formattedLocation
                ),
              ])
            );
            continue;
          }

          // Special handling for JSON objects
          const formattedJson = this.formatJsonObject(content);
          if (formattedJson !== null) {
            console.log(
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
            console.log(`Found processed reference array content: ${content.substring(0, 100)}...`);
            // This is already processed by onEntryUpdate, so we can use it directly
          }
          // Check for JSON strings of entry references in case they weren't fully processed
          else if (
            typeof content === 'string' &&
            content.includes('"sys"') &&
            content.includes('"linkType":"Entry"')
          ) {
            console.log(`Found Entry references in content: ${content.substring(0, 100)}...`);
            console.log(`This content was expected to be resolved by onEntryUpdate`);
            // We use the content as is, since resolving references should have happened in onEntryUpdate
          } else if (Array.isArray(content)) {
            // If it's an array, check if it's an array of references (which should have been processed)
            if (
              content.length > 0 &&
              content.some((item) => item?.sys?.type === 'Link' && item?.sys?.linkType === 'Entry')
            ) {
              console.log(`Found unprocessed array of references:`, content);
              // Since this should have been processed in onEntryUpdate, we'll just join the sys.id values
              const refIds = content
                .filter((item) => item?.sys?.id)
                .map((item) => `Reference ID: ${item.sys.id}`)
                .join(', ');
              content = refIds || JSON.stringify(content);
            } else {
              // For other arrays, stringify normally
              console.log(`Regular array content detected, stringifying:`, content);
              content = JSON.stringify(content);
            }
          } else if (typeof content === 'object' && content !== null) {
            // If it's any other object, stringify it
            console.log(`Object content detected, stringifying:`, content);
            content = JSON.stringify(content);
          }

          console.log(
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
          console.log('Processing image field:', mapping.contentfulFieldId);
          console.log(
            'Field data:',
            JSON.stringify(entry.fields[mapping.contentfulFieldId], null, 2)
          );

          // Try to extract image URL
          const imageUrl = this.getAssetUrl(entry, mapping.contentfulFieldId);

          if (imageUrl) {
            console.log('Uploading image URL to Klaviyo:', mapping.klaviyoBlockName, imageUrl);
            promises.push(this.uploadImage(imageUrl));
          } else {
            console.warn(`Could not extract image URL for field ${mapping.contentfulFieldId}`);

            // If we have a JSON string containing a sys.id reference, parse it and log
            try {
              const fieldData = entry.fields[mapping.contentfulFieldId];
              let assetReference;

              // Try to get the asset reference based on field structure
              if (fieldData?._fieldLocales?.['en-US']?._value) {
                assetReference = fieldData._fieldLocales['en-US']._value;
              } else if (fieldData?.['en-US']) {
                assetReference = fieldData['en-US'];
              }

              // If we have a string that looks like a JSON asset reference
              if (typeof assetReference === 'string' && assetReference.includes('"sys"')) {
                try {
                  const assetData = JSON.parse(assetReference);
                  if (
                    assetData.sys?.type === 'Link' &&
                    assetData.sys?.linkType === 'Asset' &&
                    assetData.sys?.id
                  ) {
                    console.error(
                      `Asset reference found but couldn't be resolved: ${assetData.sys.id}`
                    );
                    console.error(
                      'This indicates that the asset resolution in onEntryUpdate failed.'
                    );
                    console.error(
                      'The asset needs to be resolved before reaching the KlaviyoService.'
                    );
                  }
                  // Check for entry references as well
                  else if (
                    assetData.sys?.type === 'Link' &&
                    assetData.sys?.linkType === 'Entry' &&
                    assetData.sys?.id
                  ) {
                    console.error(`Entry reference found in image field: ${assetData.sys.id}`);
                    console.error(
                      'Entry references should be resolved to text content before reaching this point.'
                    );
                    console.error(
                      'Consider changing the field type to "entry" instead of "image".'
                    );
                  }
                } catch (e) {
                  // Not a valid JSON or not an asset reference
                  console.error('Error parsing potential asset/entry reference:', e);
                }
              } else {
                console.error('Unrecognized asset format:', assetReference);
              }
            } catch (e) {
              console.error('Error analyzing field data:', e);
            }
          }
        } else {
          console.warn(
            `Unknown field type "${mapping.fieldType}" for field ${mapping.contentfulFieldId}`
          );
        }
      } catch (error) {
        console.error(`Error syncing field ${mapping.contentfulFieldId}:`, error);
        // Continue with next mapping instead of stopping the entire process
      }
    }

    const results = await Promise.all(promises);

    return results;
  }

  // Update the createFieldMapping function
  private createFieldMapping(
    contentfulFieldId: string,
    klaviyoBlockName: string,
    value: string
  ): FieldMapping {
    return {
      name: klaviyoBlockName,
      type: 'text',
      severity: 'info',
      contentfulFieldId,
      fieldType: 'text',
      klaviyoBlockName,
      value: Boolean(value) ? String(value) : '',
    };
  }

  // Update the createImageFieldMapping function
  private createImageFieldMapping(
    contentfulFieldId: string,
    klaviyoBlockName: string,
    value: any
  ): FieldMapping {
    return {
      name: klaviyoBlockName,
      type: 'image',
      severity: 'info',
      contentfulFieldId,
      fieldType: 'image',
      klaviyoBlockName,
      value,
    };
  }

  // Update the createRichTextFieldMapping function
  private createRichTextFieldMapping(
    contentfulFieldId: string,
    klaviyoBlockName: string,
    value: any
  ): FieldMapping {
    return {
      name: klaviyoBlockName,
      type: 'richText',
      severity: 'info',
      contentfulFieldId,
      fieldType: 'richText',
      klaviyoBlockName,
      value,
    };
  }
}
