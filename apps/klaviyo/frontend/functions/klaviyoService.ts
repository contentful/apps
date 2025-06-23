import { OAuthSDK } from './initiateOauth';

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
  klaviyoImageId?: string;
}

export class KlaviyoService {
  private apiUrl: string;
  private apiRevision: string;
  private oauthSdk: OAuthSDK;
  constructor(oauthSdk: OAuthSDK) {
    this.apiUrl = 'https://a.klaviyo.com/api';
    this.apiRevision = '2025-04-15'; // Use this revision date as requested
    this.oauthSdk = oauthSdk;
  }

  /**
   * Fetch the correct asset file URL from Contentful CMA
   */
  private async fetchAssetUrlFromCMA(
    assetId: string,
    entry: any,
    cma: any
  ): Promise<string | null> {
    try {
      if (!cma) {
        console.error('CMA client not provided for asset resolution');
        return null;
      }
      const spaceId = entry.sys?.space?.sys?.id;
      const environmentId = entry.sys?.environment?.sys?.id;
      if (!spaceId || !environmentId) {
        console.error('Missing spaceId or environmentId for asset resolution');
        return null;
      }
      const asset = await cma.asset.get({ assetId, spaceId, environmentId });
      if (asset && asset.fields && asset.fields.file) {
        // Use the first locale available
        const locales = Object.keys(asset.fields.file);
        const fileField = asset.fields.file[locales[0]];
        if (fileField && fileField.url) {
          return fileField.url.startsWith('//') ? `https:${fileField.url}` : fileField.url;
        }
      }
      return null;
    } catch (error) {
      console.error('Error fetching asset from CMA:', error);
      return null;
    }
  }

  /**
   * Syncs content from Contentful to Klaviyo Universal Content
   * @param fieldMappings Field mappings defining how to map Contentful fields to Klaviyo
   * @param entry The Contentful entry data
   * @param cma The Contentful CMA client
   * @returns Promise with the results of the sync operation
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
        // Send a separate content block for each mapping
        const responses: any[] = [];
        const processedFields = new Map<string, Set<string>>(); // Map of base field name to set of locales

        for (const mapping of fieldMappings) {
          try {
            const contentfulFieldId = mapping.contentfulFieldId;
            let klaviyoBlockName = mapping.klaviyoBlockName || contentfulFieldId;

            // Extract the last locale from the field name, if present
            const lastLocaleMatch = klaviyoBlockName.match(/-([a-z]{2}(?:-[A-Z]{2})?)$/);
            let locale = '';
            let baseName = klaviyoBlockName;
            if (lastLocaleMatch) {
              locale = lastLocaleMatch[1];
              // Remove the locale suffix
              baseName = klaviyoBlockName.replace(
                /-[a-z]{2}(?:-[A-Z]{2})?(-[a-z]{2}(?:-[A-Z]{2})?)?$/,
                ''
              );
            }
            // Now, always process the field, with or without locale
            const blockName = locale ? `${baseName}-${locale}` : baseName;
            const externalId = locale
              ? `${entryId}-${baseName}-${locale}`
              : `${entryId}-${baseName}`;

            // Skip if we've already processed this base field for this locale (or for no-locale)
            if (!processedFields.has(baseName)) {
              processedFields.set(baseName, new Set());
            }
            const locales = processedFields.get(baseName)!;
            if (locales.has(locale)) {
              console.log(`Skipping duplicate field mapping for ${baseName} in locale ${locale}`);
              continue;
            }
            locales.add(locale);

            // Use mapping.value if present, otherwise fallback to old extraction logic
            let value = mapping.value;

            if (value === undefined) {
              if (entry.fields && entry.fields[contentfulFieldId]) {
                const field = entry.fields[contentfulFieldId];

                if (typeof field === 'object' && !Array.isArray(field) && locale) {
                  // Get the field value for the specific locale
                  value = field[locale];

                  if (value === undefined) {
                    console.log(`No value found for field ${baseName} in locale ${locale}`);
                    continue;
                  }
                } else {
                  value = field;
                }
              } else if (entry[contentfulFieldId] !== undefined) {
                value = entry[contentfulFieldId];
              }
            }

            if (value === undefined || value === null || value === '') {
              console.error(
                `Skipping empty value for ${baseName}${locale ? ` in locale ${locale}` : ''}`
              );
              continue;
            }

            const contentData: Record<string, any> = {};
            let imageUrl: string = '';
            let altText = `${baseName}${locale ? ` (${locale})` : ''}`;
            let htmlContent = '';

            console.log(
              `Processing field ${baseName}${
                locale ? ` with locale ${locale}` : ''
              } - Block name: ${blockName}, External ID: ${externalId}`
            );

            // Handle different field types
            switch (mapping.fieldType?.toLowerCase()) {
              case 'image':
              case 'asset':
                if (typeof value === 'object' && value.sys) {
                  let assetId = value.sys.id;

                  // Fetch the correct asset URL from CMA
                  let cmaUrl = '';
                  if (assetId && cma) {
                    cmaUrl = (await this.fetchAssetUrlFromCMA(assetId, entry, cma)) || '';
                  }

                  if (!cmaUrl) {
                    console.error(
                      'Could not resolve a valid Contentful asset URL for image field:',
                      blockName
                    );
                    continue;
                  }

                  imageUrl = typeof cmaUrl === 'string' ? cmaUrl : '';
                  if (!imageUrl) {
                    console.error(
                      'Could not resolve a valid Contentful asset URL for image field:',
                      blockName
                    );
                    continue;
                  }

                  // Handle image upload to Klaviyo
                  let mappingObj = fieldMappings.find(
                    (m: any) =>
                      m.contentfulFieldId === contentfulFieldId || m.id === contentfulFieldId
                  );
                  let klaviyoImageId = mappingObj && mappingObj.klaviyoImageId;
                  let imageName = blockName;

                  if (value.fields && value.fields.title) {
                    imageName = value.fields.title[locale] || value.fields.title || blockName;
                  }

                  const response = await this.createOrUpdateContent(
                    imageName,
                    '', // No HTML content for images
                    externalId,
                    'image',
                    imageUrl,
                    altText
                  );
                  responses.push(response);
                }
                break;

              case 'richtext':
                try {
                  const richTextHtml = this.processRichText(value);
                  contentData[baseName] = richTextHtml;
                  htmlContent = this.convertDataToHTML(contentData);
                  const response = await this.createOrUpdateContent(
                    blockName,
                    htmlContent,
                    externalId,
                    'text'
                  );
                  responses.push(response);
                } catch (error) {
                  console.error(`Error processing rich text field ${blockName}:`, error);
                }
                break;

              case 'json':
                try {
                  const jsonValue = typeof value === 'string' ? JSON.parse(value) : value;
                  contentData[baseName] = JSON.stringify(jsonValue, null, 2);
                  htmlContent = this.convertDataToHTML(contentData);
                  const response = await this.createOrUpdateContent(
                    blockName,
                    htmlContent,
                    externalId,
                    'text'
                  );
                  responses.push(response);
                } catch (error) {
                  console.error(`Error processing JSON field ${blockName}:`, error);
                }
                break;

              case 'entry':
              case 'reference-array':
                try {
                  const processedValue = this.safeFieldValue(baseName, value);
                  if (processedValue) {
                    contentData[baseName] = processedValue;
                    htmlContent = this.convertDataToHTML(contentData);
                    const response = await this.createOrUpdateContent(
                      blockName,
                      htmlContent,
                      externalId,
                      'text'
                    );
                    responses.push(response);
                  }
                } catch (error) {
                  console.error(`Error processing reference field ${blockName}:`, error);
                }
                break;

              default:
                // Handle text and other field types
                try {
                  const processedValue = this.safeFieldValue(baseName, value);
                  if (processedValue) {
                    contentData[baseName] = processedValue;
                    htmlContent = this.convertDataToHTML(contentData);
                    const response = await this.createOrUpdateContent(
                      blockName,
                      htmlContent,
                      externalId,
                      'text'
                    );
                    responses.push(response);
                  }
                } catch (error) {
                  console.error(`Error processing field ${blockName}:`, error);
                }
                break;
            }
          } catch (error) {
            console.error(`Error processing mapping for ${mapping.klaviyoBlockName}:`, error);
          }
        }
        return responses;
      }
    } catch (error) {
      console.error('Error in syncContent:', error);
      throw error;
    }
  }

  /**
   * Find content in Klaviyo by external ID (Contentful entry ID)
   */
  private async findContentByExternalId(externalId: string, nameWithId?: string): Promise<any> {
    try {
      const idPattern = `[ID:${externalId}]`;
      // First try: Get a list of templates and filter client-side since contains is not supported
      try {
        const response = await this.makeRequest('GET', 'template-universal-content', {
          'page[size]': 100, // Get a larger set to search through
        });
        if (response?.data && Array.isArray(response.data)) {
          // Find templates with our ID pattern in the name
          const matches = response.data.filter(
            (item: any) => item.attributes?.name && item.attributes.name.includes(idPattern)
          );
          if (matches.length > 0) {
            return matches[0];
          }
        }
      } catch (listError) {
        console.error('Error retrieving template list:', listError);
      }
      // Try with a few potential name formats, most specific first
      const potentialNames = [nameWithId, `${idPattern}`].filter(Boolean);
      for (const name of potentialNames) {
        try {
          const response = await this.makeRequest('GET', 'template-universal-content', {
            filter: `equals(name,"${name}")`,
            'page[size]': 10,
          });
          if (response?.data && Array.isArray(response.data) && response.data.length > 0) {
            return response.data[0];
          }
        } catch (nameError) {
          console.error(`Error finding template with name "${name}":`, nameError);
        }
      }
      return null;
    } catch (error: unknown) {
      console.error('Error finding content by external ID:', error);
      if (error && typeof error === 'object' && 'response' in error) {
        const apiError = error as { response: { status: number; statusText: string; data: any } };
        console.error('API Error Response:', {
          status: apiError.response.status,
          statusText: apiError.response.statusText,
          data: apiError.response.data,
        });
      }
      return null;
    }
  }

  /**
   * Create new universal content in Klaviyo
   */
  private async createContent(
    name: string,
    htmlContent: string,
    externalId: string,
    blockType: 'text' | 'image' = 'text',
    imageUrl?: string,
    altText?: string
  ): Promise<any> {
    try {
      const nameWithId = `${name} [ID:${externalId}]`;
      let definition;
      if (blockType === 'image' && imageUrl) {
        definition = {
          content_type: 'block',
          type: 'image',
          data: {
            url: imageUrl,
            properties: {
              alt_text: altText || name,
              dynamic: false,
            },
            styles: {},
            display_options: {},
          },
        };
      } else {
        definition = {
          content_type: 'block',
          type: 'text',
          data: {
            content: htmlContent,
            styles: {},
            display_options: {},
          },
        };
      }
      // Universal content block data model
      const data = {
        data: {
          type: 'template-universal-content',
          attributes: {
            name: nameWithId,
            definition,
          },
        },
      };
      console.log('Creating content:', data);
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
    externalId: string,
    blockType: 'text' | 'image' = 'text',
    imageUrl?: string,
    altText?: string
  ): Promise<any> {
    try {
      const nameWithId = `${name} [ID:${externalId}]`;
      let definition;
      if (blockType === 'image' && imageUrl) {
        definition = {
          content_type: 'block',
          type: 'image',
          data: {
            url: imageUrl,
            properties: {
              alt_text: altText || name,
              dynamic: false,
            },
            styles: {},
            display_options: {},
          },
        };
      } else {
        definition = {
          content_type: 'block',
          type: 'text',
          data: {
            content: htmlContent,
            styles: {},
            display_options: {},
          },
        };
      }
      const data = {
        data: {
          type: 'template-universal-content',
          id: id,
          attributes: {
            name: nameWithId,
            definition,
          },
        },
      };
      const result = await this.makeRequest('PATCH', `template-universal-content/${id}`, data);
      return result;
    } catch (error: unknown) {
      console.error('Error updating content:', error);
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
   * Safely format a field value for HTML output, converting rich text objects to HTML.
   */
  private safeFieldValue(key: string, value: any): string {
    console.log(`Processing field ${key} with value:`, value);

    if (value === null || value === undefined) {
      console.log(`Field ${key} is null or undefined`);
      return '';
    }

    if (typeof value === 'string') {
      console.log(`Field ${key} is a string:`, value);
      return value;
    }

    // Handle rich text
    if (value && typeof value === 'object') {
      if (value.nodeType === 'document') {
        console.log(`Field ${key} is a rich text document`);
        return this.processRichText(value);
      }

      // Handle rich text in other formats
      if (
        key.toLowerCase().includes('richtext') ||
        (value.content && Array.isArray(value.content))
      ) {
        console.log(`Field ${key} appears to be rich text`);
        return this.processRichText(value);
      }

      // Handle arrays
      if (Array.isArray(value)) {
        console.log(`Field ${key} is an array`);
        return value.map((item) => this.safeFieldValue(key, item)).join(', ');
      }

      // Handle objects with sys property (references)
      if (value.sys) {
        console.log(`Field ${key} is a reference`);
        if (value.sys.type === 'Link') {
          return value.sys.id;
        }
        return JSON.stringify(value);
      }

      // Handle objects with fields property (entries)
      if (value.fields) {
        console.log(`Field ${key} has fields property`);
        const firstLocale = Object.keys(value.fields)[0] || 'en-US';
        const fieldValue = value.fields[firstLocale];
        if (fieldValue !== undefined) {
          return this.safeFieldValue(key, fieldValue);
        }
      }

      // Try to extract a display value
      if (value.title) {
        console.log(`Field ${key} has title property`);
        return value.title;
      }
      if (value.name) {
        console.log(`Field ${key} has name property`);
        return value.name;
      }
      if (value.value) {
        console.log(`Field ${key} has value property`);
        return value.value;
      }
    }

    // Fallback: stringify
    try {
      console.log(`Field ${key} using fallback stringify`);
      const stringified = JSON.stringify(value);
      return stringified === '{}' ? '' : stringified;
    } catch {
      console.log(`Field ${key} using String() fallback`);
      return String(value);
    }
  }

  /**
   * Convert structured data to HTML for Klaviyo
   */
  private convertDataToHTML(data: Record<string, any>): string {
    console.log('Converting data to HTML:', data);
    const fieldKeys = Object.keys(data).filter((key) => key !== 'title' && key !== 'external_id');
    const heading = fieldKeys.length > 0 ? fieldKeys[0] : '';
    let html = `<!DOCTYPE html>
<html>
<head>
 <meta charset="utf-8">
 <title>${this.escapeHtml(heading)}</title>
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
 <div class="content">`;
    if (heading) {
      html += `\n <h1>${this.escapeHtml(heading)}</h1>`;
    }
    const includedFields: string[] = [];
    if (fieldKeys.length === 1) {
      // Only one mapped field: just show the value, no label
      const key = fieldKeys[0];
      const value = data[key];
      console.log(`Processing single field ${key} with value:`, value);
      const safeValue = this.safeFieldValue(key, value);
      console.log(`Safe value for ${key}:`, safeValue);
      if (safeValue !== '') {
        if (
          key.includes('richText') ||
          (typeof safeValue === 'string' && safeValue.includes('<') && safeValue.includes('>'))
        ) {
          html += `\n <div class="field-value">${safeValue}</div>`;
        } else if (
          typeof safeValue === 'string' &&
          safeValue.startsWith('http') &&
          (safeValue.endsWith('.jpg') ||
            safeValue.endsWith('.png') ||
            safeValue.endsWith('.gif') ||
            safeValue.includes('/asset.') ||
            safeValue.includes('/images/'))
        ) {
          html += `\n <div class="field-value"><img src="${safeValue}" alt="${this.escapeHtml(
            heading || key
          )}" /></div>`;
        } else {
          html += `\n <div class="field-value">${this.escapeHtml(safeValue)}</div>`;
        }
        includedFields.push(key);
      }
    } else {
      // Multiple fields: keep the label/value structure
      for (const key in data) {
        if (key === 'title' || key === 'external_id') {
          continue;
        }
        const value = data[key];
        console.log(`Processing field ${key} with value:`, value);
        const safeValue = this.safeFieldValue(key, value);
        console.log(`Safe value for ${key}:`, safeValue);
        if (safeValue === '') {
          continue;
        }
        if (
          key.includes('richText') ||
          (typeof safeValue === 'string' && safeValue.includes('<') && safeValue.includes('>'))
        ) {
          html += `\n <div class="field">\n <div class="field-label">${this.escapeHtml(
            key
          )}</div>\n <div class="field-value">${safeValue}</div>\n </div>`;
          includedFields.push(key);
          continue;
        }
        if (
          typeof safeValue === 'string' &&
          safeValue.startsWith('http') &&
          (safeValue.endsWith('.jpg') ||
            safeValue.endsWith('.png') ||
            safeValue.endsWith('.gif') ||
            safeValue.includes('/asset.') ||
            safeValue.includes('/images/'))
        ) {
          html += `\n <div class="field">\n <div class="field-label">${this.escapeHtml(
            key
          )}</div>\n <div class="field-value"><img src="${safeValue}" alt="${this.escapeHtml(
            heading || key
          )}" /></div>\n </div>`;
          includedFields.push(key);
          continue;
        }
        html += `\n <div class="field">\n <div class="field-label">${this.escapeHtml(
          key
        )}</div>\n <div class="field-value">${this.escapeHtml(safeValue)}</div>\n </div>`;
        includedFields.push(key);
      }
    }
    html += `\n </div>\n</body>\n</html>`;
    console.log('Generated HTML:', html);
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

    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      revision: this.apiRevision,
    };

    let config: RequestInit = {
      method,
      headers,
    };

    let fullUrl = url;

    // For GET requests, convert data to query params
    if (method.toUpperCase() === 'GET' && data) {
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
      }
    } else if (data && method.toUpperCase() !== 'GET') {
      // For non-GET methods, add request body
      config.body = JSON.stringify(data);
    }

    try {
      const token = await this.oauthSdk.token();

      // Ensure token is a string
      let tokenString: string;
      if (typeof token === 'string') {
        tokenString = token;
      } else if (token && typeof token === 'object' && 'accessToken' in token) {
        tokenString = (token as any).accessToken;
      } else if (token && typeof token === 'object' && 'access_token' in token) {
        tokenString = (token as any).access_token;
      } else if (token && typeof token === 'object' && 'token' in token) {
        tokenString = (token as any).token;
      } else {
        console.error('Invalid token format:', token);
        throw new Error('Invalid token format received from OAuth SDK');
      }

      headers['Authorization'] = `Bearer ${tokenString}`;

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

  private async createOrUpdateContent(
    name: string,
    htmlContent: string,
    externalId: string,
    blockType: 'text' | 'image' = 'text',
    imageUrl?: string,
    altText?: string
  ): Promise<any> {
    const contentData = {
      external_id: externalId,
    };

    // Find existing content by external ID
    const existingContent = await this.findContentByExternalId(externalId, name);

    if (existingContent) {
      return this.updateContent(
        existingContent.id,
        name,
        htmlContent,
        externalId,
        blockType,
        imageUrl,
        altText
      );
    } else {
      return this.createContent(name, htmlContent, externalId, blockType, imageUrl, altText);
    }
  }
}
