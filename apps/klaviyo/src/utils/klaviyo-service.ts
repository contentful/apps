import { documentToHtmlString } from '@contentful/rich-text-html-renderer';
import { FieldMapping } from '../config/klaviyo';
import { KnownSDK, CMAClient } from '@contentful/app-sdk';

interface KlaviyoCredentials {
  privateKey: string;
  publicKey: string;
}

declare global {
  interface Window {
    sdk: KnownSDK;
  }
}

export class KlaviyoService {
  private credentials: KlaviyoCredentials;
  private cma: CMAClient;

  constructor(credentials: KlaviyoCredentials, cma: CMAClient) {
    console.error('KlaviyoService constructor called with credentials:', {
      hasPrivateKey: !!credentials.privateKey,
      hasPublicKey: !!credentials.publicKey,
      privateKeyLength: credentials.privateKey?.length,
      publicKeyLength: credentials.publicKey?.length,
    });
    this.credentials = credentials;
    this.cma = cma;
  }

  /**
   * Safely extracts a field value, handling different field types
   */
  private safeFieldValue(fieldId: string, value: any): string {
    console.log(`Processing field ${fieldId} with value:`, JSON.stringify(value, null, 2));

    if (value === null || value === undefined) {
      return '';
    }

    // Handle rich text documents
    if (typeof value === 'object' && value.nodeType === 'document') {
      try {
        const html = documentToHtmlString(value);
        console.log(`Converted rich text to HTML: ${html}`);
        return html;
      } catch (error) {
        console.log(`Error converting rich text to HTML:`, error);
        return '';
      }
    }

    // Handle arrays
    if (Array.isArray(value)) {
      return value.map((item) => this.safeFieldValue(fieldId, item)).join(', ');
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
    console.log('Converting data to HTML:', JSON.stringify(data, null, 2));
    let html = '';
    for (const [key, value] of Object.entries(data)) {
      if (value) {
        html += `<div class="klaviyo-field" data-field="${key}">${value}</div>`;
      }
    }
    console.log('Generated HTML:', html);
    return html;
  }

  /**
   * Syncs content from Contentful to Klaviyo Universal Content
   */
  async syncContent(fieldMappings: FieldMapping[], entry: any, cma?: any): Promise<any> {
    console.log('=== SYNC CONTENT START ===');
    console.log('Field Mappings:', JSON.stringify(fieldMappings, null, 2));
    console.log('Entry:', JSON.stringify(entry, null, 2));

    try {
      const entryId = entry.sys?.id;
      if (!entryId) {
        console.error('Entry ID is missing');
        throw new Error('Entry ID is missing');
      }
      console.log('Processing entry ID:', entryId);

      // Only use the fieldMappings argument passed in
      if (!fieldMappings || !Array.isArray(fieldMappings) || fieldMappings.length === 0) {
        console.log('No field mappings provided, extracting all fields');
        const contentData: Record<string, any> = {};

        // Extract fields from the entry fields object
        if (entry.fields) {
          console.log('Entry fields:', JSON.stringify(entry.fields, null, 2));
          for (const fieldId in entry.fields) {
            try {
              const field = entry.fields[fieldId];
              console.log(`Processing field ${fieldId}:`, JSON.stringify(field, null, 2));

              // Handle localized fields
              if (typeof field === 'object' && !Array.isArray(field)) {
                const firstLocale = Object.keys(field)[0] || 'en-US';
                const value = field[firstLocale];
                console.log(`Localized field ${fieldId} value:`, JSON.stringify(value, null, 2));

                // Add the field to content data
                if (value !== undefined && value !== null) {
                  contentData[fieldId] = this.safeFieldValue(fieldId, value);
                  console.log(`Added to contentData: ${fieldId} =`, contentData[fieldId]);
                }
              } else {
                // Non-localized field
                if (field !== undefined && field !== null) {
                  contentData[fieldId] = this.safeFieldValue(fieldId, field);
                  console.log(
                    `Added to contentData (non-localized): ${fieldId} =`,
                    contentData[fieldId]
                  );
                }
              }
            } catch (error) {
              console.error(`Error extracting field ${fieldId}:`, error);
            }
          }
        }
      } else {
        // Send a separate content block for each mapping
        const responses = [];
        for (const mapping of fieldMappings) {
          try {
            console.log('Processing mapping:', JSON.stringify(mapping, null, 2));
            const contentfulFieldId = mapping.contentfulFieldId;
            const klaviyoBlockName = mapping.klaviyoBlockName || contentfulFieldId;

            // Use mapping.value if present, otherwise fallback to old extraction logic
            let value = mapping.value;
            console.log(`Initial value for ${contentfulFieldId}:`, JSON.stringify(value, null, 2));

            if (value === undefined) {
              if (entry.fields && entry.fields[contentfulFieldId]) {
                const field = entry.fields[contentfulFieldId];
                console.log(`Field from entry.fields:`, JSON.stringify(field, null, 2));

                if (typeof field === 'object' && !Array.isArray(field)) {
                  const firstLocale = Object.keys(field)[0];
                  if (firstLocale) {
                    value = field[firstLocale];
                    console.log(
                      `Localized value for ${contentfulFieldId}:`,
                      JSON.stringify(value, null, 2)
                    );
                  }
                } else {
                  value = field;
                  console.log(
                    `Non-localized value for ${contentfulFieldId}:`,
                    JSON.stringify(value, null, 2)
                  );
                }
              } else if (entry[contentfulFieldId] !== undefined) {
                value = entry[contentfulFieldId];
                console.log(
                  `Value from entry root for ${contentfulFieldId}:`,
                  JSON.stringify(value, null, 2)
                );
              }
            }

            if (value === undefined || value === null || value === '') {
              console.log(`Skipping empty value for ${contentfulFieldId}`);
              continue;
            }

            const contentData: Record<string, any> = {};
            let imageUrl: string = '';
            let altText = klaviyoBlockName;
            let htmlContent = '';

            // Handle different field types
            console.log(`Field type for ${contentfulFieldId}:`, mapping.fieldType);
            switch (mapping.fieldType?.toLowerCase()) {
              case 'image':
              case 'asset':
                console.log(`Processing image/asset field: ${contentfulFieldId}`);
                if (typeof value === 'object' && value.sys) {
                  let assetId = value.sys.id;
                  console.log(`Asset ID: ${assetId}`);

                  // Fetch the correct asset URL from CMA
                  let cmaUrl = '';
                  if (assetId && cma) {
                    cmaUrl = (await this.fetchAssetUrlFromCMA(assetId, entry, cma)) || '';
                    console.log(`CMA URL: ${cmaUrl}`);
                  }

                  if (!cmaUrl) {
                    console.error(
                      'Could not resolve a valid Contentful asset URL for image field:',
                      klaviyoBlockName
                    );
                    continue;
                  }

                  imageUrl = typeof cmaUrl === 'string' ? cmaUrl : '';
                  if (!imageUrl) {
                    console.error(
                      'Could not resolve a valid Contentful asset URL for image field:',
                      klaviyoBlockName
                    );
                    continue;
                  }

                  let imageName = klaviyoBlockName;

                  if (value.fields && value.fields.title) {
                    imageName =
                      value.fields.title['en-US'] || value.fields.title || klaviyoBlockName;
                  }

                  console.error(`Creating/updating image content: ${imageName}`);
                  const response = await this.createOrUpdateContent(
                    imageName,
                    '', // No HTML content for images
                    `${entryId}-${klaviyoBlockName}`,
                    'image',
                    imageUrl,
                    altText
                  );
                  console.error('Image content response:', JSON.stringify(response, null, 2));
                  responses.push(response);
                }
                break;

              case 'richtext':
                console.error(`Processing rich text field: ${contentfulFieldId}`);
                try {
                  const richTextHtml = this.processRichText(value);
                  console.error(`Rich text HTML: ${richTextHtml}`);
                  contentData[klaviyoBlockName] = richTextHtml;
                  htmlContent = this.convertDataToHTML(contentData);
                  console.error(`Creating/updating rich text content: ${klaviyoBlockName}`);
                  const response = await this.createOrUpdateContent(
                    klaviyoBlockName,
                    htmlContent,
                    `${entryId}-${klaviyoBlockName}`,
                    'text'
                  );
                  console.error('Rich text content response:', JSON.stringify(response, null, 2));
                  responses.push(response);
                } catch (error) {
                  console.error(`Error processing rich text field ${klaviyoBlockName}:`, error);
                }
                break;

              case 'json':
                console.error(`Processing JSON field: ${contentfulFieldId}`);
                try {
                  const jsonValue = typeof value === 'string' ? JSON.parse(value) : value;
                  contentData[klaviyoBlockName] = JSON.stringify(jsonValue, null, 2);
                  htmlContent = this.convertDataToHTML(contentData);
                  console.error(`Creating/updating JSON content: ${klaviyoBlockName}`);
                  const response = await this.createOrUpdateContent(
                    klaviyoBlockName,
                    htmlContent,
                    `${entryId}-${klaviyoBlockName}`,
                    'text'
                  );
                  console.error('JSON content response:', JSON.stringify(response, null, 2));
                  responses.push(response);
                } catch (error) {
                  console.error(`Error processing JSON field ${klaviyoBlockName}:`, error);
                }
                break;

              case 'entry':
              case 'reference-array':
                console.error(`Processing reference field: ${contentfulFieldId}`);
                try {
                  const processedValue = this.safeFieldValue(klaviyoBlockName, value);
                  console.error(`Processed reference value: ${processedValue}`);
                  if (processedValue) {
                    contentData[klaviyoBlockName] = processedValue;
                    htmlContent = this.convertDataToHTML(contentData);
                    console.error(`Creating/updating reference content: ${klaviyoBlockName}`);
                    const response = await this.createOrUpdateContent(
                      klaviyoBlockName,
                      htmlContent,
                      `${entryId}-${klaviyoBlockName}`,
                      'text'
                    );
                    console.error('Reference content response:', JSON.stringify(response, null, 2));
                    responses.push(response);
                  }
                } catch (error) {
                  console.error(`Error processing reference field ${klaviyoBlockName}:`, error);
                }
                break;

              default:
                // Handle text and other field types
                console.error(`Processing default field type: ${contentfulFieldId}`);
                try {
                  const processedValue = this.safeFieldValue(klaviyoBlockName, value);
                  console.error(`Processed value: ${processedValue}`);
                  if (processedValue) {
                    contentData[klaviyoBlockName] = processedValue;
                    htmlContent = this.convertDataToHTML(contentData);
                    console.error(`Creating/updating content: ${klaviyoBlockName}`);
                    const response = await this.createOrUpdateContent(
                      klaviyoBlockName,
                      htmlContent,
                      `${entryId}-${klaviyoBlockName}`,
                      'text'
                    );
                    console.error('Content response:', JSON.stringify(response, null, 2));
                    responses.push(response);
                  }
                } catch (error) {
                  console.error(`Error processing field ${klaviyoBlockName}:`, error);
                }
                break;
            }
          } catch (error) {
            console.error(`Error processing mapping for ${mapping.klaviyoBlockName}:`, error);
          }
        }
        console.error('=== SYNC CONTENT COMPLETE ===');
        return responses;
      }
    } catch (error) {
      console.error('Error in syncContent:', error);
      throw error;
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
    console.error('Creating/updating content:', {
      name,
      htmlContent,
      externalId,
      blockType,
      imageUrl,
      altText,
    });

    const payload = {
      data: {
        type: 'template-universal-content',
        attributes: {
          name,
          definition: {
            content_type: 'block',
            type: blockType,
            data:
              blockType === 'text'
                ? {
                    content: htmlContent,
                    styles: {},
                    display_options: {},
                  }
                : {
                    content: htmlContent,
                    ...(imageUrl && {
                      image_url: imageUrl,
                      alt_text: altText || name,
                    }),
                    styles: {},
                    display_options: {},
                  },
          },
        },
      },
    };

    console.error('Sending payload to Klaviyo:', JSON.stringify(payload, null, 2));

    try {
      if (!window.sdk.ids.app) {
        throw new Error('App ID is not available');
      }

      const response = await this.cma.appActionCall.createWithResponse(
        {
          appActionId: '5SUT62FpO3cuWVr9A7BrpK',
          appDefinitionId: window.sdk.ids.app,
          environmentId: window.sdk.ids.environment,
          spaceId: window.sdk.ids.space,
        },
        {
          parameters: {
            endpoint: 'template-universal-content',
            method: 'POST',
            data: JSON.stringify(payload),
            params: JSON.stringify({ page: { size: 1 } }),
            privateKey: this.credentials.privateKey,
            publicKey: this.credentials.publicKey,
          },
        }
      );

      if (!response || response.errors?.length > 0) {
        console.error('Klaviyo API error:', response?.errors);
        throw new Error(`Klaviyo API error: ${response?.errors?.[0]?.message || 'Unknown error'}`);
      }

      console.error('Klaviyo API response:', JSON.stringify(response, null, 2));
      return response;
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
        return file.url;
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
