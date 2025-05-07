import console from 'console';
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
   * Fetch the correct asset file URL from Contentful CMA
   */
  private async fetchAssetUrlFromCMA(
    assetId: string,
    entry: any,
    cma: any
  ): Promise<string | null> {
    console.log('fetchAssetUrlFromCMA', assetId, entry, cma);
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
      console.log('spaceId, environmentId, asset', spaceId, environmentId, asset);
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
      console.log('KlaviyoService: Starting content sync with field mappings');
      const entryId = entry.sys?.id;
      if (!entryId) {
        throw new Error('Entry ID is missing');
      }
      // Load klaviyoFieldMappings from entry (JSON string)
      let klaviyoFieldMappings: any[] = [];
      if (
        entry.fields &&
        entry.fields.klaviyoFieldMappings &&
        entry.fields.klaviyoFieldMappings['en-US']
      ) {
        try {
          klaviyoFieldMappings = JSON.parse(entry.fields.klaviyoFieldMappings['en-US']);
        } catch (e) {
          console.error('Failed to parse klaviyoFieldMappings:', e);
        }
      }
      // If no field mappings provided, fallback to old logic
      if (!fieldMappings || !Array.isArray(fieldMappings) || fieldMappings.length === 0) {
        const contentData: Record<string, any> = {};
        console.log('No field mappings provided, extracting all available fields from entry');

        // Check if we have the entry's content type ID to log more info
        const contentTypeId = entry.sys?.contentType?.sys?.id;
        if (contentTypeId) {
          console.log(
            `Entry's content type is ${contentTypeId}, but no mappings were found for it`
          );
        }

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

        console.log(
          `Extracted ${Object.keys(contentData).length} fields from entry without mappings`
        );
      } else {
        // Send a separate content block for each mapping
        const responses = [];
        for (const mapping of fieldMappings) {
          try {
            const contentfulFieldId = mapping.contentfulFieldId;
            const klaviyoBlockName = mapping.klaviyoBlockName || contentfulFieldId;
            let value;
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
            if (value === undefined || value === null || value === '') {
              console.log(`Skipping empty value for field ${contentfulFieldId}`);
              continue;
            }
            const contentData: Record<string, any> = {};
            let blockType: 'text' | 'image' = 'text';
            let imageUrl: string = '';
            let altText = klaviyoBlockName;
            let htmlContent = '';
            if (mapping.fieldType === 'image' || mapping.isAssetField) {
              if (typeof value === 'object' && value.sys) {
                let assetId = value.sys.id;
                // Fetch the correct asset URL from CMA
                let cmaUrl = '';
                console.log('assetId, entry, cma', assetId, entry, cma);
                if (assetId && cma) {
                  cmaUrl = (await this.fetchAssetUrlFromCMA(assetId, entry, cma)) || '';
                }
                if (!cmaUrl) {
                  console.error(
                    'Could not resolve a valid Contentful asset URL for image field:',
                    klaviyoBlockName
                  );
                  continue; // Skip this image block if we can't get a valid URL
                }
                imageUrl = typeof cmaUrl === 'string' ? cmaUrl : '';
                if (!imageUrl) {
                  console.error(
                    'Could not resolve a valid Contentful asset URL for image field:',
                    klaviyoBlockName
                  );
                  continue; // Skip this image block if we can't get a valid URL
                }
                // Find mapping for this field
                let mappingObj = klaviyoFieldMappings.find(
                  (m: any) =>
                    m.contentfulFieldId === contentfulFieldId || m.id === contentfulFieldId
                );
                let klaviyoImageId = mappingObj && mappingObj.klaviyoImageId;
                // Try to upload or patch to Klaviyo Images API
                let imageName = klaviyoBlockName;
                if (value.fields && value.fields.title) {
                  imageName = value.fields.title['en-US'] || value.fields.title || klaviyoBlockName;
                }
                let uploadedUrl = '';
                if (klaviyoImageId) {
                  // PATCH the image in Klaviyo
                  try {
                    await this.makeRequest('PATCH', `images/${klaviyoImageId}`, {
                      data: {
                        type: 'image',
                        id: klaviyoImageId,
                        attributes: {
                          name: imageName,
                        },
                      },
                    });
                    console.log(`Patched existing image in Klaviyo. ID: ${klaviyoImageId}`);
                    // Try to get the image URL from Klaviyo
                    const imgResp = await this.makeRequest('GET', `images/${klaviyoImageId}`);
                    uploadedUrl = imgResp?.data?.attributes?.image_url || imageUrl;
                  } catch (patchError) {
                    console.error('Error patching existing image in Klaviyo:', patchError);
                    uploadedUrl = imageUrl;
                  }
                } else {
                  // POST new image
                  const data = {
                    data: {
                      type: 'image',
                      attributes: {
                        import_from_url: imageUrl,
                        name: imageName,
                        hidden: false,
                      },
                    },
                  };
                  const response = await this.makeRequest('POST', 'images', data);
                  if (response && response.data && response.data.id) {
                    klaviyoImageId = response.data.id;
                    uploadedUrl = response.data.attributes?.image_url || imageUrl;
                    // Update mapping and save back to Contentful
                    if (mappingObj) {
                      mappingObj.klaviyoImageId = klaviyoImageId;
                    } else {
                      klaviyoFieldMappings.push({ ...mapping, klaviyoImageId });
                    }
                    // Save updated mappings to Contentful
                    if (cma && entryId) {
                      try {
                        // 1. Get the latest entry
                        let entryToUpdate = await cma.entry.get({
                          entryId,
                          spaceId: entry.sys.space.sys.id,
                          environmentId: entry.sys.environment.sys.id,
                        });
                        // 2. Update the field
                        entryToUpdate.fields.klaviyoFieldMappings = {
                          'en-US': JSON.stringify(klaviyoFieldMappings),
                        };
                        entryToUpdate = await cma.entry.update(
                          {
                            entryId,
                            spaceId: entry.sys.space.sys.id,
                            environmentId: entry.sys.environment.sys.id,
                          },
                          entryToUpdate
                        );
                        // 3. Re-fetch the entry to get the new version
                        entryToUpdate = await cma.entry.get({
                          entryId,
                          spaceId: entry.sys.space.sys.id,
                          environmentId: entry.sys.environment.sys.id,
                        });
                        // 4. Now publish with the latest version
                        await cma.entry.publish(
                          {
                            entryId,
                            spaceId: entry.sys.space.sys.id,
                            environmentId: entry.sys.environment.sys.id,
                          },
                          entryToUpdate
                        );
                        console.log(
                          'Updated klaviyoFieldMappings on entry with new Klaviyo image ID'
                        );
                      } catch (err) {
                        console.error('Failed to update klaviyoFieldMappings on entry:', err);
                      }
                    }
                  } else {
                    uploadedUrl = imageUrl;
                  }
                }
                blockType = 'image';
                contentData[klaviyoBlockName] = uploadedUrl;
                htmlContent = '';
              }
            } else if (
              (mapping.fieldType && mapping.fieldType.toLowerCase() === 'richtext') ||
              (value && value.nodeType === 'document')
            ) {
              // Always convert to HTML
              try {
                const richTextHtml = this.processRichText(value);
                contentData[klaviyoBlockName] = richTextHtml;
              } catch (e) {
                console.error('Error processing rich text:', e);
                contentData[klaviyoBlockName] = '';
              }
              blockType = 'text';
              htmlContent = this.convertDataToHTML(contentData);
            } else if (mapping.fieldType === 'json') {
              contentData[klaviyoBlockName] = JSON.stringify(value);
              blockType = 'text';
              htmlContent = this.convertDataToHTML(contentData);
            } else {
              contentData[klaviyoBlockName] = String(value || '');
              blockType = 'text';
              htmlContent = this.convertDataToHTML(contentData);
            }
            contentData.external_id = `${entryId}-${klaviyoBlockName}`;
            console.log(`Prepared content data for mapping ${klaviyoBlockName}:`, contentData);
            // Pass nameWithId to findContentByExternalId
            const existingContent = await this.findContentByExternalId(
              contentData.external_id,
              klaviyoBlockName
            );
            let response;
            if (blockType === 'image' && imageUrl) {
              // For image blocks, use the image block type
              if (existingContent) {
                response = await this.updateContent(
                  existingContent.id,
                  klaviyoBlockName,
                  '', // no HTML content
                  contentData.external_id,
                  'image',
                  imageUrl,
                  altText
                );
              } else {
                response = await this.createContent(
                  klaviyoBlockName,
                  '', // no HTML content
                  contentData.external_id,
                  'image',
                  imageUrl,
                  altText
                );
              }
            } else {
              // For text blocks, use the current logic
              if (existingContent) {
                response = await this.updateContent(
                  existingContent.id,
                  klaviyoBlockName,
                  htmlContent,
                  contentData.external_id,
                  'text'
                );
              } else {
                response = await this.createContent(
                  klaviyoBlockName,
                  htmlContent,
                  contentData.external_id,
                  'text'
                );
              }
            }
            responses.push(response);
          } catch (error) {
            console.error(
              `Error processing mapping for field ${mapping.contentfulFieldId}:`,
              error
            );
          }
        }
        return responses;
      }
    } catch (error) {
      console.error('Error in KlaviyoService.syncContent:', error);
      throw error;
    }
  }

  /**
   * Find content in Klaviyo by external ID (Contentful entry ID)
   */
  private async findContentByExternalId(externalId: string, nameWithId?: string): Promise<any> {
    try {
      console.log(
        `Looking for existing template-universal-content with external ID: ${externalId}`
      );
      const idPattern = `[ID:${externalId}]`;
      // First try: Get a list of templates and filter client-side since contains is not supported
      try {
        console.log('Getting list of templates to find matches for ID pattern');
        const response = await this.makeRequest('GET', 'template-universal-content', {
          'page[size]': 100, // Get a larger set to search through
        });
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
      // Try with a few potential name formats, most specific first
      const potentialNames = [
        nameWithId,
        `My Blog 2 ${idPattern}`,
        `Blog ${idPattern}`,
        `blog ${idPattern}`,
        `Content ${idPattern}`,
      ].filter(Boolean);
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
        }
      }
      console.log(`No existing content found for ID pattern: ${idPattern}`);
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
      console.log(`Creating new template-universal-content with name: ${nameWithId}`);
      let definition;
      if (blockType === 'image' && imageUrl) {
        definition = {
          content_type: 'block',
          type: 'image',
          data: {
            src: imageUrl,
            properties: {
              alt_text: altText || name,
              dynamic: false,
            },
            styles: {
              block_padding_bottom: 0,
              block_padding_top: 0,
              block_padding_right: 0,
              block_padding_left: 0,
            },
            display_options: {},
          },
        };
      } else {
        definition = {
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
        };
      }
      const data = {
        data: {
          type: 'template-universal-content',
          attributes: {
            name: nameWithId,
            definition,
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
    externalId: string,
    blockType: 'text' | 'image' = 'text',
    imageUrl?: string,
    altText?: string
  ): Promise<any> {
    try {
      const nameWithId = `${name} [ID:${externalId}]`;
      console.log(`Updating template-universal-content with ID: ${id} and name: ${nameWithId}`);
      let definition;
      if (blockType === 'image' && imageUrl) {
        definition = {
          content_type: 'block',
          type: 'image',
          data: {
            src: imageUrl,
            properties: {
              alt_text: altText || name,
              dynamic: false,
            },
            styles: {
              block_padding_bottom: 0,
              block_padding_top: 0,
              block_padding_right: 0,
              block_padding_left: 0,
            },
            display_options: {},
          },
        };
      } else {
        definition = {
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
      console.log(
        `Updating content with ID: ${id}, content length: ${htmlContent.length} characters`
      );
      const result = await this.makeRequest('PATCH', `template-universal-content/${id}`, data);
      console.log(`Successfully updated content with ID: ${id}, response:`, result);
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
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') return value;
    // If value is a rich text document, convert to HTML
    if (value && typeof value === 'object' && value.nodeType === 'document') {
      return this.processRichText(value);
    }
    // If key suggests rich text but value is object, try to convert
    if (key.toLowerCase().includes('richtext') && value && typeof value === 'object') {
      return this.processRichText(value);
    }
    // Fallback: stringify
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }

  /**
   * Convert structured data to HTML for Klaviyo
   */
  private convertDataToHTML(data: Record<string, any>): string {
    console.log('Creating HTML content with fields:', Object.keys(data));
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
      const safeValue = this.safeFieldValue(key, value);
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
        const safeValue = this.safeFieldValue(key, value);
        if (safeValue === '') {
          console.log(`Skipping empty field: ${key}`);
          continue;
        }
        console.log(`Processing field for HTML: ${key}, type: ${typeof value}`);
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

  // Helper to find an image in Klaviyo by URL
  private async findKlaviyoImageByUrl(
    imageUrl: string
  ): Promise<{ id: string; url: string; name: string } | null> {
    let cursor: string | undefined = undefined;
    const pageSize = 100;
    let foundImage = null;
    let hasMore = true;
    while (hasMore && !foundImage) {
      const params: Record<string, string> = { 'page[size]': String(pageSize) };
      if (cursor) params['page[cursor]'] = cursor;
      const response = await this.makeRequest('GET', 'images', params);
      const images = response?.data || [];
      foundImage = images.find((img: any) => img?.attributes?.image_url === imageUrl);
      const nextLink = response?.links?.next;
      hasMore = !!nextLink && !foundImage;
      if (hasMore && nextLink) {
        const urlObj = new URL(nextLink);
        cursor = urlObj.searchParams.get('page[cursor]') || undefined;
      }
    }
    if (foundImage) {
      return {
        id: foundImage.id,
        url: foundImage.attributes.image_url,
        name: foundImage.attributes.name,
      };
    }
    return null;
  }

  // Helper to upload an image to Klaviyo Images API and return the Klaviyo image URL
  private async uploadImageToKlaviyo(imageUrl: string, name: string): Promise<string | null> {
    try {
      // First, check if the image already exists
      const existingImage = await this.findKlaviyoImageByUrl(imageUrl);
      if (existingImage) {
        // PATCH the image to update/touch it
        try {
          await this.makeRequest('PATCH', `images/${existingImage.id}`, {
            data: { type: 'image' },
          });
          console.log(`Patched existing image in Klaviyo. ID: ${existingImage.id}`);
        } catch (patchError) {
          console.error('Error patching existing image in Klaviyo:', patchError);
        }
        return existingImage.url;
      }
      // If not found, upload as new
      const data = {
        data: {
          type: 'image',
          attributes: {
            import_from_url: imageUrl,
            name: name,
            hidden: false,
          },
        },
      };
      const response = await this.makeRequest('POST', 'images', data);
      // Klaviyo returns the image URL in response.data.attributes.url
      if (response && response.data && response.data.attributes && response.data.attributes.url) {
        return response.data.attributes.url;
      }
      return null;
    } catch (error) {
      console.error('Error uploading image to Klaviyo:', error);
      return null;
    }
  }
}
