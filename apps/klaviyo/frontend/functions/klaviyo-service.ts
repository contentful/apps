import { PlainClientAPI } from 'contentful-management';

// Define interfaces
interface FieldMapping {
  contentfulFieldId: string;
  fieldType: 'text' | 'image' | 'entry' | 'reference-array' | 'richText' | 'json';
  klaviyoBlockName: string;
  contentTypeId?: string;
  fields?: any;
  name: string;
  type: string;
  severity: string;
  value: any;
  isAssetField?: boolean;
}

interface KlaviyoCredentials {
  privateKey: string;
  publicKey: string;
  auth: string;
}

export class KlaviyoService {
  private credentials: KlaviyoCredentials;
  private apiUrl: string;
  private apiRevision: string;

  constructor(credentials: KlaviyoCredentials) {
    this.credentials = credentials;
    this.apiUrl = 'https://a.klaviyo.com/api';
    this.apiRevision = '2025-04-15'; // Use this revision date as requested

    // If auth string wasn't provided, construct it with the privateKey
    if (!this.credentials.auth && this.credentials.privateKey) {
      this.credentials.auth = `Klaviyo-API-Key ${this.credentials.privateKey}`;
    }
  }

  /**
   * Syncs content from Contentful to Klaviyo Universal Content
   * @param fieldMappings Field mappings defining how to map Contentful fields to Klaviyo
   * @param entry The Contentful entry data
   * @returns Promise with the results of the sync operation
   */
  async syncContent(fieldMappings: FieldMapping[], entry: any): Promise<any> {
    try {
      console.log('KlaviyoService: Starting content sync with field mappings');

      // Get the entry ID to track existing Klaviyo content
      const entryId = entry.sys?.id;
      if (!entryId) {
        throw new Error('Entry ID is missing');
      }

      // Transform Contentful fields to Klaviyo content data
      const contentData: Record<string, any> = {};

      console.log(`Processing entry with ${fieldMappings.length} field mappings`);

      // If no field mappings provided, extract all available fields from the entry
      if (fieldMappings.length === 0) {
        console.log('No field mappings provided, extracting all available fields from entry');

        // Extract fields from the entry fields object
        if (entry.fields) {
          console.log(`Entry has ${Object.keys(entry.fields).length} fields in the fields object`);

          for (const fieldId in entry.fields) {
            try {
              const field = entry.fields[fieldId];

              // Handle localized fields
              if (typeof field === 'object' && !Array.isArray(field)) {
                const firstLocale = Object.keys(field)[0] || 'en-US';
                const value = field[firstLocale];

                // Add the field to content data
                if (value !== undefined && value !== null) {
                  console.log(`Adding field ${fieldId} from fields object (type: ${typeof value})`);
                  contentData[fieldId] =
                    typeof value === 'object' ? JSON.stringify(value) : String(value);
                }
              } else {
                // Non-localized field
                if (field !== undefined && field !== null) {
                  console.log(`Adding non-localized field ${fieldId} (type: ${typeof field})`);
                  contentData[fieldId] =
                    typeof field === 'object' ? JSON.stringify(field) : String(field);
                }
              }
            } catch (error) {
              console.error(`Error extracting field ${fieldId}:`, error);
            }
          }
        }

        // Also extract direct fields at the top level if they exist
        for (const key in entry) {
          // Skip system fields and objects
          if (
            key !== 'sys' &&
            key !== 'fields' &&
            key !== 'metadata' &&
            typeof entry[key] !== 'function'
          ) {
            try {
              const value = entry[key];

              if (value !== undefined && value !== null) {
                console.log(`Adding direct field ${key} (type: ${typeof value})`);
                contentData[key] =
                  typeof value === 'object' ? JSON.stringify(value) : String(value);
              }
            } catch (error) {
              console.error(`Error extracting direct field ${key}:`, error);
            }
          }
        }

        console.log(
          `Extracted ${Object.keys(contentData).length} fields from entry without mappings`
        );
      }
      // Process each field mapping to extract data
      else {
        for (const mapping of fieldMappings) {
          try {
            // Properly get the fields from the mapping
            const contentfulFieldId = mapping.contentfulFieldId;
            const klaviyoBlockName = mapping.klaviyoBlockName || contentfulFieldId;

            // Extract field value from entry
            let value;

            // First check if the entry has direct fields
            if (entry.fields && entry.fields[contentfulFieldId]) {
              // Entry in CMA format with locales
              const field = entry.fields[contentfulFieldId];
              // Try to get from first locale if it's a localized field
              if (typeof field === 'object' && !Array.isArray(field)) {
                const firstLocale = Object.keys(field)[0];
                if (firstLocale) {
                  value = field[firstLocale];
                }
              } else {
                value = field;
              }
            } else if (entry[contentfulFieldId] !== undefined) {
              // Direct field access format
              value = entry[contentfulFieldId];
            }

            console.log(
              `Processing field ${contentfulFieldId} -> ${klaviyoBlockName}, value type: ${typeof value}`
            );

            // Skip empty values
            if (value === undefined || value === null || value === '') {
              console.log(`Skipping empty value for field ${contentfulFieldId}`);
              continue;
            }

            // Add to content data - handle different field types appropriately
            if (mapping.fieldType === 'image' || mapping.isAssetField) {
              // For image fields, resolve the asset URL
              if (typeof value === 'object' && value.sys) {
                // Try to extract the image URL from the asset value
                let imageUrl = '';

                // First check if the _resolvedUrl field is present (set by our entry-sync-function)
                if (value._resolvedUrl) {
                  imageUrl = value._resolvedUrl;
                }
                // Check if we have a normal Contentful asset structure
                else if (value.fields?.file?.['en-US']?.url || value.fields?.file?.url) {
                  const fileUrl = value.fields.file['en-US']?.url || value.fields.file.url;
                  // Make sure the URL starts with https:
                  imageUrl = fileUrl.startsWith('//') ? `https:${fileUrl}` : fileUrl;
                }

                // Fallback: Construct URL from asset ID if no direct URL found
                if (!imageUrl && value.sys.id) {
                  const assetId = value.sys.id;
                  const spaceId = value.sys.space?.sys?.id || entry.sys.space?.sys?.id || '';

                  if (spaceId) {
                    imageUrl = `https://images.ctfassets.net/${spaceId}/${assetId}/asset.jpg`;
                  }
                }

                // Use the resolved URL or the placeholder if we couldn't extract anything
                contentData[klaviyoBlockName] = imageUrl || 'https://example.com/asset-placeholder';

                console.log(
                  `Resolved image URL for ${klaviyoBlockName}: ${contentData[klaviyoBlockName]}`
                );
              }
            }
            // Handle different field types
            else if (mapping.fieldType === 'richText') {
              // Process rich text (converts to HTML)
              if (value && value.nodeType === 'document') {
                try {
                  const richTextHtml = this.processRichText(value);
                  contentData[klaviyoBlockName] = richTextHtml;
                  console.log(`Processed rich text for ${klaviyoBlockName}`);
                } catch (e) {
                  console.error('Error processing rich text:', e);
                  contentData[klaviyoBlockName] = '';
                }
              } else {
                // If not a proper rich text object, store as is or empty string
                contentData[klaviyoBlockName] = value || '';
              }
            } else if (mapping.fieldType === 'json') {
              // JSON fields: stringify to preserve structure
              contentData[klaviyoBlockName] = JSON.stringify(value);
            } else {
              // Simple fields (text, number, etc.) - convert to string for consistency
              contentData[klaviyoBlockName] = String(value || '');
            }

            console.log(
              `Successfully mapped ${contentfulFieldId} -> ${klaviyoBlockName} with value type: ${typeof contentData[
                klaviyoBlockName
              ]}`
            );
          } catch (error) {
            console.error(
              `Error processing field mapping ${mapping.contentfulFieldId} -> ${mapping.klaviyoBlockName}:`,
              error
            );
          }
        }
      }

      // Add additional metadata useful for tracking
      contentData.external_id = entryId;
      contentData.updated_at = new Date().toISOString();

      // Add content type ID if available
      if (entry.sys?.contentType?.sys?.id) {
        contentData.content_type = entry.sys.contentType.sys.id;
      }

      // Prepare content name based on entry title or ID
      let contentName = '';

      // Try to get a title from the entry if available
      if (entry && entry.fields) {
        const titleField = entry.fields.title || entry.fields.name;
        if (titleField) {
          const locale = Object.keys(titleField)[0] || 'en-US';
          contentName = titleField[locale] || '';
        }
      }

      // Fallback to content type name + entry ID if no title found
      if (!contentName) {
        const contentTypeName = entry.sys?.contentType?.sys?.id || 'content';
        contentName = `${
          contentTypeName.charAt(0).toUpperCase() + contentTypeName.slice(1)
        } ${entryId}`;
      }

      // Log summary of what we're about to send
      console.log(
        `Prepared content data with ${
          Object.keys(contentData).length
        } fields for content "${contentName}"`
      );

      // Look for existing content by entry ID to determine if this is an update
      const existingContent = await this.findContentByExternalId(entryId);

      // Prepare response object
      let response;

      // Generate HTML content from template data
      const htmlContent = this.convertDataToHTML(contentData);

      // Check if we need to update or create
      if (existingContent) {
        console.log(`Found existing content with ID: ${existingContent.id}`);
        response = await this.updateContent(
          existingContent.id,
          contentName,
          htmlContent,
          contentData.external_id
        );
      } else {
        console.log('Creating new content in Klaviyo');
        response = await this.createContent(contentName, htmlContent, contentData.external_id);
      }

      return response;
    } catch (error) {
      console.error('Error in KlaviyoService.syncContent:', error);
      throw error;
    }
  }

  /**
   * Find content in Klaviyo by external ID (Contentful entry ID)
   */
  private async findContentByExternalId(externalId: string): Promise<any> {
    try {
      console.log(
        `Looking for existing template-universal-content with external ID: ${externalId}`
      );

      // Query for template-universal-content with name containing the external ID
      // Use the ID pattern we're adding to the name field: [ID:externalId]
      const idPattern = `[ID:${externalId}]`;

      // First try: Get a list of templates and filter client-side since contains is not supported
      try {
        console.log('Getting list of templates to find matches for ID pattern');
        const response = await this.makeRequest('GET', 'template-universal-content', {
          'page[size]': 100, // Get a larger set to search through
        });

        // Check for valid response data
        if (response?.data && Array.isArray(response.data)) {
          console.log(
            `Retrieved ${response.data.length} templates from Klaviyo to search for ID pattern: ${idPattern}`
          );

          // Find templates with our ID pattern in the name
          const matches = response.data.filter(
            (item: any) => item.attributes?.name && item.attributes.name.includes(idPattern)
          );

          if (matches.length > 0) {
            console.log(`Found ${matches.length} templates with ID pattern: ${idPattern}`);
            console.log(
              `Using first match with ID: ${matches[0].id}, name: "${matches[0].attributes?.name}"`
            );
            return matches[0];
          }

          console.log(
            `No templates found containing ID pattern: ${idPattern} among ${response.data.length} templates`
          );
        }
      } catch (listError) {
        console.error('Error retrieving template list:', listError);
      }

      // Second try: Use the exact name with the ID pattern
      // Try with a few potential name formats
      const potentialNames = [
        `My Blog 2 ${idPattern}`,
        `Blog ${idPattern}`,
        `blog ${idPattern}`,
        `Content ${idPattern}`,
      ];

      for (const name of potentialNames) {
        try {
          console.log(`Trying to find template with exact name: "${name}"`);
          const response = await this.makeRequest('GET', 'template-universal-content', {
            filter: `equals(name,"${name}")`,
            'page[size]': 10,
          });

          if (response?.data && Array.isArray(response.data) && response.data.length > 0) {
            console.log(`Found template with name "${name}", ID: ${response.data[0].id}`);
            return response.data[0];
          }
        } catch (nameError) {
          console.error(`Error finding template with name "${name}":`, nameError);
          // Continue to the next name
        }
      }

      console.log(`No existing content found for ID pattern: ${idPattern}`);
      return null;
    } catch (error: unknown) {
      console.error('Error finding content by external ID:', error);

      // Try to extract useful information from the error
      if (error && typeof error === 'object' && 'response' in error) {
        const apiError = error as { response: { status: number; statusText: string; data: any } };
        console.error('API Error Response:', {
          status: apiError.response.status,
          statusText: apiError.response.statusText,
          data: apiError.response.data,
        });
      }

      // Don't throw here, just return null so we can create a new item
      return null;
    }
  }

  /**
   * Create new universal content in Klaviyo
   */
  private async createContent(name: string, htmlContent: string, externalId: string): Promise<any> {
    try {
      // Include the external ID in the name for tracking
      const nameWithId = `${name} [ID:${externalId}]`;
      console.log(`Creating new template-universal-content with name: ${nameWithId}`);

      const data = {
        data: {
          type: 'template-universal-content',
          attributes: {
            name: nameWithId,
            definition: {
              content_type: 'block',
              type: 'text',
              data: {
                content: htmlContent,
                styles: {
                  block_padding_bottom: 0,
                  block_padding_top: 0,
                  block_padding_right: 0,
                  block_padding_left: 0,
                },
                display_options: {},
              },
            },
          },
        },
      };

      console.log('Creating content with data:', JSON.stringify(data, null, 2));
      return await this.makeRequest('POST', 'template-universal-content', data);
    } catch (error) {
      console.error('Error creating content:', error);
      throw error;
    }
  }

  /**
   * Update existing universal content in Klaviyo
   */
  private async updateContent(
    id: string,
    name: string,
    htmlContent: string,
    externalId: string
  ): Promise<any> {
    try {
      // Include the external ID in the name for tracking
      const nameWithId = `${name} [ID:${externalId}]`;
      console.log(`Updating template-universal-content with ID: ${id} and name: ${nameWithId}`);

      // Log the HTML content size to help with debugging
      console.log(`HTML content size for update: ${htmlContent.length} characters`);

      const data = {
        data: {
          type: 'template-universal-content',
          id: id,
          attributes: {
            name: nameWithId,
            definition: {
              content_type: 'block',
              type: 'text',
              data: {
                content: htmlContent,
                styles: {
                  block_padding_bottom: 0,
                  block_padding_top: 0,
                  block_padding_right: 0,
                  block_padding_left: 0,
                },
                display_options: {},
              },
            },
          },
        },
      };

      console.log(
        `Updating content with ID: ${id}, content length: ${htmlContent.length} characters`
      );
      const result = await this.makeRequest('PATCH', `template-universal-content/${id}`, data);
      console.log(`Successfully updated content with ID: ${id}, response:`, result);
      return result;
    } catch (error: unknown) {
      console.error('Error updating content:', error);

      // Try to extract useful information from the error
      if (error && typeof error === 'object' && 'response' in error) {
        const apiError = error as { response: { status: number; statusText: string; data: any } };
        console.error('API Error Response:', {
          status: apiError.response.status,
          statusText: apiError.response.statusText,
          data: apiError.response.data,
        });
      }

      throw error;
    }
  }

  /**
   * Format complex values safely for HTML display
   */
  private formatValueForDisplay(value: any): string {
    if (value === null || value === undefined) {
      return '';
    }

    // Handle basic types
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }

    // Handle dates
    if (value instanceof Date) {
      return value.toISOString();
    }

    // Handle location objects
    if (typeof value === 'object' && value.lat !== undefined && value.lon !== undefined) {
      return `Latitude: ${value.lat}, Longitude: ${value.lon}`;
    }

    // Handle arrays and objects by stringifying them
    try {
      return JSON.stringify(value, null, 2);
    } catch (e) {
      return '[Complex Value]';
    }
  }

  /**
   * Convert structured data to HTML for Klaviyo
   */
  private convertDataToHTML(data: Record<string, any>): string {
    console.log('Creating HTML content with fields:', Object.keys(data));

    // Start with basic HTML template
    let html = `<!DOCTYPE html>
<html>
<head>
 <meta charset="utf-8">
 <title>${this.escapeHtml(data.title || 'Contentful Content')}</title>
 <meta name="viewport" content="width=device-width, initial-scale=1.0">
 <style>
 body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
 .content { max-width: 600px; margin: 0 auto; }
 img { max-width: 100%; height: auto; }
 .field { margin-bottom: 20px; }
 .field-label { font-weight: bold; margin-bottom: 5px; }
 .field-value { line-height: 1.5; }
 pre { background: #f5f5f5; padding: 10px; border-radius: 4px; overflow-x: auto; }
 </style>
</head>
<body>
 <div class="content">
 <h1>${this.escapeHtml(data.title || 'Contentful Content')}</h1>`;

    // Track which fields we actually included
    const includedFields: string[] = [];

    // Add each field to the HTML content
    for (const key in data) {
      // Skip metadata fields, but process them separately
      if (key === 'title' || key === 'external_id') {
        continue; // These fields are handled elsewhere
      }

      const value = data[key];

      // Skip empty values
      if (value === undefined || value === null || value === '') {
        console.log(`Skipping empty field: ${key}`);
        continue;
      }

      console.log(`Processing field for HTML: ${key}, type: ${typeof value}`);

      // Handle rich text content - it's already processed HTML
      if (
        key.includes('richText') ||
        (typeof value === 'string' && value.includes('<') && value.includes('>'))
      ) {
        html += `
 <div class="field">
 <div class="field-label">${this.escapeHtml(key)}</div>
 <div class="field-value">${value}</div>
 </div>`;
        includedFields.push(key);
        continue;
      }

      // Handle image fields - they're URLs
      if (
        typeof value === 'string' &&
        value.startsWith('http') &&
        (value.endsWith('.jpg') ||
          value.endsWith('.png') ||
          value.endsWith('.gif') ||
          value.includes('/asset.') ||
          value.includes('/images/'))
      ) {
        html += `
 <div class="field">
 <div class="field-label">${this.escapeHtml(key)}</div>
 <div class="field-value"><img src="${value}" alt="${this.escapeHtml(data.title || key)}" /></div>
 </div>`;
        includedFields.push(key);
        continue;
      }

      // Handle complex objects by using pretty formatting
      if (typeof value === 'object' && value !== null) {
        const formattedValue = this.formatValueForDisplay(value);
        html += `
 <div class="field">
 <div class="field-label">${this.escapeHtml(key)}</div>
 <div class="field-value"><pre>${this.escapeHtml(formattedValue)}</pre></div>
 </div>`;
        includedFields.push(key);
      } else {
        // For simple values
        const displayValue = this.formatValueForDisplay(value);
        html += `
 <div class="field">
 <div class="field-label">${this.escapeHtml(key)}</div>
 <div class="field-value">${this.escapeHtml(displayValue)}</div>
 </div>`;
        includedFields.push(key);
      }
    }

    // Always add last updated field
    html += `
 <div class="field">
 <div class="field-label">Last Updated</div>
 <div class="field-value">${data.updated_at || new Date().toISOString()}</div>
 </div>
 </div>
</body>
</html>`;

    console.log(
      `Generated HTML with ${includedFields.length} fields: ${includedFields.join(', ')}`
    );
    return html;
  }

  /**
   * Convert rich text to HTML
   */
  private convertRichTextToHtml(richText: any): string {
    if (!richText || !richText.content) {
      return '';
    }

    let html = '';

    for (const node of richText.content) {
      if (node.nodeType === 'paragraph') {
        html += `<p>${this.processRichTextContent(node.content)}</p>`;
      } else if (node.nodeType.startsWith('heading-')) {
        const level = node.nodeType.split('-')[1];
        html += `<h${level}>${this.processRichTextContent(node.content)}</h${level}>`;
      } else if (node.nodeType === 'unordered-list') {
        html += '<ul>';
        for (const listItem of node.content) {
          html += `<li>${this.processRichTextContent(listItem.content)}</li>`;
        }
        html += '</ul>';
      } else if (node.nodeType === 'ordered-list') {
        html += '<ol>';
        for (const listItem of node.content) {
          html += `<li>${this.processRichTextContent(listItem.content)}</li>`;
        }
        html += '</ol>';
      } else if (node.nodeType === 'embedded-asset-block') {
        // Handle embedded assets (images)
        if (node.data && node.data.target && node.data.target.fields) {
          const asset = node.data.target;
          if (asset.fields.file && asset.fields.title) {
            const file = asset.fields.file['en-US'] || asset.fields.file;
            const title = asset.fields.title['en-US'] || asset.fields.title;
            const url = file.url.startsWith('//') ? `https:${file.url}` : file.url;
            html += `<img src="${url}" alt="${title}" />`;
          }
        }
      }
    }

    return html;
  }

  /**
   * Process rich text content and convert it to HTML
   */
  private processRichText(richText: any): string {
    if (!richText || !richText.content) {
      return '';
    }

    let html = '';

    for (const node of richText.content) {
      if (node.nodeType === 'paragraph') {
        html += `<p>${this.processRichTextContent(node.content)}</p>`;
      } else if (node.nodeType.startsWith('heading-')) {
        const level = node.nodeType.split('-')[1];
        html += `<h${level}>${this.processRichTextContent(node.content)}</h${level}>`;
      } else if (node.nodeType === 'unordered-list') {
        html += '<ul>';
        for (const listItem of node.content) {
          html += `<li>${this.processRichTextContent(listItem.content)}</li>`;
        }
        html += '</ul>';
      } else if (node.nodeType === 'ordered-list') {
        html += '<ol>';
        for (const listItem of node.content) {
          html += `<li>${this.processRichTextContent(listItem.content)}</li>`;
        }
        html += '</ol>';
      } else if (node.nodeType === 'embedded-asset-block') {
        // Handle embedded assets (images)
        if (node.data && node.data.target && node.data.target.fields) {
          const asset = node.data.target;
          if (asset.fields.file && asset.fields.title) {
            const file = asset.fields.file['en-US'] || asset.fields.file;
            const title = asset.fields.title['en-US'] || asset.fields.title;
            const url = file.url.startsWith('//') ? `https:${file.url}` : file.url;
            html += `<img src="${url}" alt="${title}" />`;
          }
        }
      }
    }

    return html;
  }

  /**
   * Process rich text content nodes to HTML
   */
  private processRichTextContent(content: any[]): string {
    if (!content || !Array.isArray(content)) {
      return '';
    }

    let result = '';

    for (const node of content) {
      if (node.nodeType === 'text') {
        let text = node.value;
        if (node.marks && node.marks.length > 0) {
          for (const mark of node.marks) {
            if (mark.type === 'bold') {
              text = `<strong>${text}</strong>`;
            } else if (mark.type === 'italic') {
              text = `<em>${text}</em>`;
            } else if (mark.type === 'underline') {
              text = `<u>${text}</u>`;
            } else if (mark.type === 'code') {
              text = `<code>${text}</code>`;
            }
          }
        }
        result += text;
      } else if (node.nodeType === 'hyperlink') {
        const url = node.data.uri;
        result += `<a href="${url}">${this.processRichTextContent(node.content)}</a>`;
      } else if (node.content) {
        result += this.processRichTextContent(node.content);
      }
    }

    return result;
  }

  /**
   * Escape HTML special characters
   */
  private escapeHtml(text: string): string {
    if (typeof text !== 'string') {
      text = String(text);
    }

    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Make a request to the Klaviyo API
   */
  private async makeRequest(method: string, endpoint: string, data?: any): Promise<any> {
    // Ensure the endpoint has trailing slash as required by Klaviyo
    const formattedEndpoint = endpoint.endsWith('/') ? endpoint : `${endpoint}/`;
    const url = `${this.apiUrl}/${formattedEndpoint}`;

    console.log(`Making ${method} request to Klaviyo API: ${url}`);

    // Check if we have a valid auth string
    if (!this.credentials.auth) {
      throw new Error('Klaviyo API key is required');
    }

    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      revision: this.apiRevision,
      Authorization: this.credentials.auth,
    };

    console.log(`Using API revision: ${this.apiRevision}`);
    console.log(`Request headers:`, JSON.stringify(headers));

    let config: RequestInit = {
      method,
      headers,
    };

    let fullUrl = url;

    // For GET requests, convert data to query params
    if (method.toUpperCase() === 'GET' && data) {
      console.log('Preparing GET request with parameters:', data);

      const params = new URLSearchParams();

      // Handle filter parameters correctly according to Klaviyo's format
      for (const [key, value] of Object.entries(data)) {
        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
          params.append(key, String(value));
        }
      }

      const queryString = params.toString();
      if (queryString) {
        fullUrl = `${url}${url.includes('?') ? '&' : '?'}${queryString}`;
        console.log(`GET request with query params: ${fullUrl}`);
      }
    } else if (data) {
      // For other methods, add request body
      config.body = JSON.stringify(data);
      console.log(`${method} request body:`, JSON.stringify(data, null, 2));
    }

    try {
      console.log(`Sending ${method} request to: ${fullUrl}`);
      const response = await fetch(fullUrl, config);

      // Read the response text for debugging
      const responseText = await response.text();

      if (!response.ok) {
        console.error(`API error (${response.status}): ${responseText}`);
        console.error(`Request headers:`, headers);
        console.error(`Request URL: ${fullUrl}`);

        throw new Error(`Klaviyo API error (${response.status}): ${responseText}`);
      }

      // Parse the JSON response if it's not empty
      let responseData;
      try {
        responseData = responseText ? JSON.parse(responseText) : {};
        console.log(`Successful API response:`, JSON.stringify(responseData, null, 2));
        return responseData;
      } catch (parseError: any) {
        console.error(`Error parsing response JSON:`, parseError);
        console.error(`Raw response:`, responseText);
        throw new Error(`Error parsing Klaviyo API response: ${parseError.message}`);
      }
    } catch (error) {
      console.error('Error making Klaviyo API request:', error);
      throw error;
    }
  }
}
