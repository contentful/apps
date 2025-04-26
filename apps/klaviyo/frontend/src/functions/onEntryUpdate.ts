import type { SidebarExtensionSDK } from '@contentful/app-sdk';
import { KlaviyoService } from '../services/klaviyo';
import { FieldMapping } from '../config/klaviyo';
import { createClient } from 'contentful-management';

interface EntryEventData {
  entry: any;
  sdk: SidebarExtensionSDK;
  mappings: FieldMapping[];
}

// Helper function to check if a value is a JSON string asset reference
function isAssetLinkString(value: any): boolean {
  if (typeof value !== 'string') return false;

  try {
    const parsed = JSON.parse(value);
    return (
      parsed &&
      parsed.sys &&
      parsed.sys.type === 'Link' &&
      parsed.sys.linkType === 'Asset' &&
      parsed.sys.id
    );
  } catch (e) {
    return false;
  }
}

// Helper function to check if a value is a JSON string entry reference
function isEntryLinkString(value: any): boolean {
  if (typeof value !== 'string') return false;

  try {
    const parsed = JSON.parse(value);
    return (
      parsed &&
      parsed.sys &&
      parsed.sys.type === 'Link' &&
      parsed.sys.linkType === 'Entry' &&
      parsed.sys.id
    );
  } catch (e) {
    return false;
  }
}

// Helper function to extract id from a string reference
function getIdFromString(value: string): string | null {
  try {
    const parsed = JSON.parse(value);
    return parsed?.sys?.id || null;
  } catch (e) {
    return null;
  }
}

// Helper function to get linkType from a string reference
function getLinkTypeFromString(value: string): string | null {
  try {
    const parsed = JSON.parse(value);
    return parsed?.sys?.linkType || null;
  } catch (e) {
    return null;
  }
}

// Helper function to resolve asset references
async function resolveAssetReferences(
  sdk: SidebarExtensionSDK,
  entry: any,
  mappings: FieldMapping[]
) {
  try {
    // Only continue if we have image field mappings
    const imageFields = mappings.filter((mapping) => mapping.fieldType === 'image');
    if (imageFields.length === 0) {
      return entry;
    }

    console.log('Entry fields before resolution:', JSON.stringify(entry.fields, null, 2));

    const entryId = entry.sys.id;

    // Get access token from the SDK
    // The SDK gives us direct access to a CMA client
    const cma = sdk.cma;
    if (!cma) {
      console.error('CMA client not available');
      return entry;
    }

    // Create a copy of the entry to modify
    const resolvedEntry = JSON.parse(JSON.stringify(entry));

    // Process each image field mapping
    for (const mapping of imageFields) {
      const fieldId = mapping.contentfulFieldId;
      console.log(`Processing field ${fieldId}`);

      try {
        // Check for different field formats
        if (entry.fields[fieldId]?._fieldLocales?.['en-US']?._value) {
          // New SDK format with _fieldLocales
          const fieldValue = entry.fields[fieldId]._fieldLocales['en-US']._value;
          console.log(`Field value for ${fieldId}:`, fieldValue);

          // If it's a string reference to an asset
          if (isAssetLinkString(fieldValue)) {
            const assetId = getIdFromString(fieldValue);
            console.log(`Found asset ID in string: ${assetId}`);

            if (assetId) {
              try {
                // Fetch the asset
                const asset = await cma.asset.get({ assetId });
                console.log(`Found asset:`, asset);

                // Replace the string reference with the asset object
                // Create the structure that getAssetUrl expects
                resolvedEntry.fields[fieldId] = {
                  'en-US': asset,
                };
              } catch (assetError) {
                console.error(`Error fetching asset ${assetId}:`, assetError);
              }
            }
          }
          // If it's a string reference to an entry
          else if (isEntryLinkString(fieldValue)) {
            const linkedEntryId = getIdFromString(fieldValue);
            console.log(`Found entry ID in string: ${linkedEntryId}`);

            if (linkedEntryId) {
              try {
                // Fetch the linked entry
                const linkedEntry = await cma.entry.get({ entryId: linkedEntryId });
                console.log(`Found linked entry:`, linkedEntry);

                // Replace the string reference with the entry object
                resolvedEntry.fields[fieldId] = {
                  'en-US': linkedEntry,
                };
              } catch (entryError) {
                console.error(`Error fetching linked entry ${linkedEntryId}:`, entryError);
              }
            }
          }
        } else if (entry.fields[fieldId]?.['en-US']) {
          // Standard field format
          const fieldValue = entry.fields[fieldId]['en-US'];
          console.log(`Standard field value for ${fieldId}:`, fieldValue);

          // If it's a direct asset link
          if (fieldValue?.sys?.type === 'Link' && fieldValue?.sys?.linkType === 'Asset') {
            const assetId = fieldValue.sys.id;
            console.log(`Found asset ID in direct link: ${assetId}`);

            try {
              // Fetch the asset
              const asset = await cma.asset.get({ assetId });
              console.log(`Found asset:`, asset);

              // Replace the link with the asset object
              resolvedEntry.fields[fieldId]['en-US'] = asset;
            } catch (assetError) {
              console.error(`Error fetching asset ${assetId}:`, assetError);
            }
          }
          // If it's a direct entry link
          else if (fieldValue?.sys?.type === 'Link' && fieldValue?.sys?.linkType === 'Entry') {
            const linkedEntryId = fieldValue.sys.id;
            console.log(`Found entry ID in direct link: ${linkedEntryId}`);

            try {
              // Fetch the linked entry
              const linkedEntry = await cma.entry.get({ entryId: linkedEntryId });
              console.log(`Found linked entry:`, linkedEntry);

              // Replace the link with the entry object
              resolvedEntry.fields[fieldId]['en-US'] = linkedEntry;
            } catch (entryError) {
              console.error(`Error fetching linked entry ${linkedEntryId}:`, entryError);
            }
          }
          // If it's a string reference to an asset
          else if (typeof fieldValue === 'string' && isAssetLinkString(fieldValue)) {
            const assetId = getIdFromString(fieldValue);
            console.log(`Found asset ID in string: ${assetId}`);

            if (assetId) {
              try {
                // Fetch the asset
                const asset = await cma.asset.get({ assetId });
                console.log(`Found asset:`, asset);

                // Replace the string reference with the asset object
                resolvedEntry.fields[fieldId]['en-US'] = asset;
              } catch (assetError) {
                console.error(`Error fetching asset ${assetId}:`, assetError);
              }
            }
          }
          // If it's a string reference to an entry
          else if (typeof fieldValue === 'string' && isEntryLinkString(fieldValue)) {
            const linkedEntryId = getIdFromString(fieldValue);
            console.log(`Found entry ID in string: ${linkedEntryId}`);

            if (linkedEntryId) {
              try {
                // Fetch the linked entry
                const linkedEntry = await cma.entry.get({ entryId: linkedEntryId });
                console.log(`Found linked entry:`, linkedEntry);

                // Replace the string reference with the entry object
                resolvedEntry.fields[fieldId]['en-US'] = linkedEntry;
              } catch (entryError) {
                console.error(`Error fetching linked entry ${linkedEntryId}:`, entryError);
              }
            }
          }
        }
      } catch (fieldError) {
        console.error(`Error processing field ${fieldId}:`, fieldError);
      }
    }

    console.log('Entry fields after resolution:', JSON.stringify(resolvedEntry.fields, null, 2));
    return resolvedEntry;
  } catch (error) {
    console.error('Error resolving asset references:', error);
    return entry; // Return original entry if we can't resolve assets
  }
}

// Helper function to extract data from a resolved entry
function extractContentFromEntry(entry: any, targetFieldId?: string): string {
  try {
    if (!entry) return '';

    // If a specific field is specified, try to get that field
    if (targetFieldId && entry.fields && entry.fields[targetFieldId]) {
      // Get the field value, accounting for locale structure
      const fieldValue =
        entry.fields[targetFieldId]['en-US'] ||
        entry.fields[targetFieldId]._fieldLocales?.['en-US']?._value;

      if (fieldValue !== undefined && fieldValue !== null) {
        // If it's a primitive type, return as string
        if (
          typeof fieldValue === 'string' ||
          typeof fieldValue === 'number' ||
          typeof fieldValue === 'boolean'
        ) {
          return String(fieldValue);
        }
        // If it's an object, stringify it
        return JSON.stringify(fieldValue);
      }
    }

    // If no specific field or field not found, try to create a useful representation
    // First, check if we have a title or name field
    const commonFields = ['title', 'name', 'heading', 'label', 'id'];
    for (const commonField of commonFields) {
      if (entry.fields && entry.fields[commonField]) {
        const value =
          entry.fields[commonField]['en-US'] ||
          entry.fields[commonField]._fieldLocales?.['en-US']?._value;
        if (value) return String(value);
      }
    }

    // If no common field found, return the entry ID
    if (entry.sys && entry.sys.id) {
      return `Referenced entry: ${entry.sys.id}`;
    }

    // As a last resort, return a generic message
    return 'Referenced content';
  } catch (error) {
    console.error('Error extracting content from entry:', error);
    return 'Error extracting content';
  }
}

// Helper function to check if a string is an array of entry references
function isEntryReferenceArray(value: string): boolean {
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return false;

    // Check if it's an array of entry references
    return parsed.some(
      (item) => item?.sys?.type === 'Link' && item?.sys?.linkType === 'Entry' && item?.sys?.id
    );
  } catch (e) {
    return false;
  }
}

// Helper function to check if a value is an array of entry references (non-string format)
function isDirectEntryReferenceArray(value: any): boolean {
  if (!Array.isArray(value)) return false;

  // Check if it's an array of entry references
  return value.some(
    (item) => item?.sys?.type === 'Link' && item?.sys?.linkType === 'Entry' && item?.sys?.id
  );
}

// Helper function to extract entry IDs from a reference array
function getEntryIdsFromArray(value: string): string[] {
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter(
        (item) => item?.sys?.type === 'Link' && item?.sys?.linkType === 'Entry' && item?.sys?.id
      )
      .map((item) => item.sys.id);
  } catch (e) {
    return [];
  }
}

// Helper function to extract entry IDs from a direct reference array
function getEntryIdsFromDirectArray(value: any[]): string[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter(
      (item) => item?.sys?.type === 'Link' && item?.sys?.linkType === 'Entry' && item?.sys?.id
    )
    .map((item) => item.sys.id);
}

// Helper function to resolve entry reference arrays
async function resolveEntryReferenceArray(
  sdk: SidebarExtensionSDK,
  value: string | any[]
): Promise<string> {
  try {
    let entryIds: string[] = [];

    // Handle different input formats
    if (typeof value === 'string') {
      entryIds = getEntryIdsFromArray(value);
    } else if (Array.isArray(value)) {
      entryIds = getEntryIdsFromDirectArray(value);
    }

    if (entryIds.length === 0) {
      if (typeof value === 'string') {
        return value;
      } else {
        return JSON.stringify(value);
      }
    }

    console.log(`Resolving array of ${entryIds.length} entry references`);

    const resolvedEntries = [];
    for (const entryId of entryIds) {
      try {
        // Fetch the linked entry
        const linkedEntry = await sdk.cma.entry.get({ entryId });

        // Extract content from the linked entry
        const entryContent = extractContentFromEntry(linkedEntry);
        resolvedEntries.push(entryContent);
      } catch (error) {
        console.error(`Error resolving entry reference ${entryId}:`, error);
        resolvedEntries.push(`[Unresolved reference: ${entryId}]`);
      }
    }

    return resolvedEntries.join(', ');
  } catch (error) {
    console.error('Error resolving entry reference array:', error);
    if (typeof value === 'string') {
      return value;
    } else {
      return JSON.stringify(value);
    }
  }
}

// Helper function to process field with possible _fieldLocales format
function processFieldValue(field: any): any {
  // Check if the field has the new SDK format with _fieldLocales
  if (field?._fieldLocales?.['en-US']?._value !== undefined) {
    return field._fieldLocales['en-US']._value;
  }

  // For getValue method (SDK field object)
  if (typeof field.getValue === 'function') {
    return field.getValue();
  }

  // For standard field format
  if (field?.['en-US'] !== undefined) {
    return field['en-US'];
  }

  // Just return the field itself as a fallback
  return field;
}

// Helper function to check if a value is a Contentful rich text document
function isRichTextDocument(value: any): boolean {
  console.log('Checking rich text document type:', typeof value);
  if (typeof value === 'string') {
    console.log('String value:', value.substring(0, 100));
    return value.includes('"nodeType":"document"');
  }

  return (
    value &&
    typeof value === 'object' &&
    (value.nodeType === 'document' ||
      (typeof value.content === 'string' && value.content.includes('"nodeType":"document"')) ||
      (Array.isArray(value.content) && value.content.length > 0))
  );
}

// Helper function to convert Contentful rich text to HTML
function richTextToHtml(richTextNode: any): string {
  if (!richTextNode) return '';

  try {
    console.log('Rich text node type before processing:', typeof richTextNode);

    // Handle string JSON case - parse it to an object
    if (typeof richTextNode === 'string') {
      try {
        richTextNode = JSON.parse(richTextNode);
        console.log('Parsed JSON string to object');
      } catch (e) {
        console.error('Error parsing rich text JSON string:', e);
        return richTextNode;
      }
    }

    // If content is a string that contains a serialized rich text document
    if (
      typeof richTextNode === 'object' &&
      typeof richTextNode.content === 'string' &&
      richTextNode.content.includes('"nodeType":"document"')
    ) {
      try {
        // Try to parse it as JSON
        richTextNode = JSON.parse(richTextNode.content);
        console.log('Parsed content string to object');
      } catch (e) {
        console.error('Error parsing rich text string:', e);
        return richTextNode.content;
      }
    }

    // If the content is already in the format shown in the example
    // (an object with data:{}, content:[], nodeType:document)
    if (
      typeof richTextNode === 'object' &&
      !richTextNode.nodeType &&
      richTextNode.content &&
      Array.isArray(richTextNode.content)
    ) {
      console.log('Converting direct rich text object to HTML');
      // Create a document node containing the content array
      return richTextToHtml({
        nodeType: 'document',
        data: richTextNode.data || {},
        content: richTextNode.content,
      });
    }

    // Handle document node
    if (richTextNode.nodeType === 'document') {
      return richTextNode.content?.map((node: any) => richTextToHtml(node)).join('') || '';
    }

    // Handle paragraph node
    if (richTextNode.nodeType === 'paragraph') {
      const content = richTextNode.content?.map((node: any) => richTextToHtml(node)).join('') || '';
      return `<p>${content}</p>`;
    }

    // Handle heading nodes
    if (richTextNode.nodeType === 'heading-1') {
      const content = richTextNode.content?.map((node: any) => richTextToHtml(node)).join('') || '';
      return `<h1>${content}</h1>`;
    }
    if (richTextNode.nodeType === 'heading-2') {
      const content = richTextNode.content?.map((node: any) => richTextToHtml(node)).join('') || '';
      return `<h2>${content}</h2>`;
    }
    if (richTextNode.nodeType === 'heading-3') {
      const content = richTextNode.content?.map((node: any) => richTextToHtml(node)).join('') || '';
      return `<h3>${content}</h3>`;
    }
    if (richTextNode.nodeType === 'heading-4') {
      const content = richTextNode.content?.map((node: any) => richTextToHtml(node)).join('') || '';
      return `<h4>${content}</h4>`;
    }
    if (richTextNode.nodeType === 'heading-5') {
      const content = richTextNode.content?.map((node: any) => richTextToHtml(node)).join('') || '';
      return `<h5>${content}</h5>`;
    }
    if (richTextNode.nodeType === 'heading-6') {
      const content = richTextNode.content?.map((node: any) => richTextToHtml(node)).join('') || '';
      return `<h6>${content}</h6>`;
    }

    // Handle list nodes
    if (richTextNode.nodeType === 'unordered-list') {
      const content = richTextNode.content?.map((node: any) => richTextToHtml(node)).join('') || '';
      return `<ul>${content}</ul>`;
    }
    if (richTextNode.nodeType === 'ordered-list') {
      const content = richTextNode.content?.map((node: any) => richTextToHtml(node)).join('') || '';
      return `<ol>${content}</ol>`;
    }
    if (richTextNode.nodeType === 'list-item') {
      const content = richTextNode.content?.map((node: any) => richTextToHtml(node)).join('') || '';
      return `<li>${content}</li>`;
    }

    // Handle hyperlink
    if (richTextNode.nodeType === 'hyperlink') {
      const content = richTextNode.content?.map((node: any) => richTextToHtml(node)).join('') || '';
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
          } else if (mark.type === 'strikethrough') {
            content = `<strike>${content}</strike>`;
          } else if (mark.type === 'strike-through') {
            content = `<strike>${content}</strike>`;
          } else if (mark.type === 'strike') {
            content = `<strike>${content}</strike>`;
          } else {
            console.log(`Unhandled text mark type: ${mark.type}`);
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
      const content = richTextNode.content?.map((node: any) => richTextToHtml(node)).join('') || '';
      return `<blockquote>${content}</blockquote>`;
    }

    // Handle embedded entry or asset (skip or replace with placeholder)
    if (
      richTextNode.nodeType === 'embedded-entry-block' ||
      richTextNode.nodeType === 'embedded-asset-block' ||
      richTextNode.nodeType === 'embedded-entry-inline' ||
      richTextNode.nodeType === 'embedded-asset-inline'
    ) {
      return '[Embedded content]';
    }

    // Fallback for unhandled node types
    console.warn(`Unhandled rich text node type: ${richTextNode.nodeType}`);
    return '';
  } catch (error) {
    console.error('Error converting rich text to HTML:', error, richTextNode);
    // If we got a JSON string but couldn't properly process it,
    // return it directly to Klaviyo to handle
    if (
      typeof richTextNode === 'string' &&
      (richTextNode.includes('"nodeType":"document"') || richTextNode.includes('"content":'))
    ) {
      return richTextNode;
    }
    return JSON.stringify(richTextNode);
  }
}

export async function onEntryUpdate(event: EntryEventData) {
  const { entry, sdk, mappings } = event;

  // Log mappings to verify field types
  console.log(
    'Processing mappings:',
    mappings.map((m) => ({
      field: m.contentfulFieldId,
      type: m.fieldType,
      blockName: m.klaviyoBlockName,
    }))
  );

  // Get the app installation parameters for OAuth credentials
  const parameters = sdk.parameters.installation;
  const oauthConfig = {
    clientId: parameters?.klaviyoClientId as string,
    clientSecret: parameters?.klaviyoClientSecret as string,
    redirectUri: parameters?.klaviyoRedirectUri as string,
  };

  // Check for required parameters
  if (!oauthConfig.clientId) {
    console.error('Klaviyo Client ID is missing from installation parameters');
    sdk.notifier.error('Klaviyo Client ID is missing from installation parameters');
    return;
  }

  if (!oauthConfig.clientSecret) {
    console.error('Klaviyo Client Secret is missing from installation parameters');
    sdk.notifier.error('Klaviyo Client Secret is missing from installation parameters');
    return;
  }

  if (!oauthConfig.redirectUri) {
    console.error('Klaviyo Redirect URI is missing from installation parameters');
    sdk.notifier.error('Klaviyo Redirect URI is missing from installation parameters');
    return;
  }

  // Check if we have an access token
  const accessToken = localStorage.getItem('klaviyo_access_token');
  if (!accessToken) {
    console.error('No access token available - OAuth authentication required');
    sdk.notifier.error(
      'Authentication required: No access token available. Please use the Klaviyo app configuration to connect to Klaviyo.'
    );
    return;
  }

  if (!mappings || mappings.length === 0) {
    console.log('No field mappings found for entry:', entry.sys.id);
    return;
  }

  // Check if we have any image fields to process
  const hasImageFields = mappings.some((mapping) => mapping.fieldType === 'image');
  console.log(`Has image fields to process: ${hasImageFields}`);

  try {
    // Create a modified entry with properly resolved assets
    const processedEntry = {
      sys: entry.sys,
      fields: {} as Record<string, any>,
    };

    // Process each mapping to ensure assets are properly handled
    for (const mapping of mappings) {
      const fieldId = mapping.contentfulFieldId;
      const field = entry.fields[fieldId];

      console.log(`Processing field ${fieldId} with type ${mapping.fieldType}`);

      // For image fields, get the actual asset URL using the SDK
      if (mapping.fieldType === 'image') {
        console.log(`Processing image field ${fieldId}`);

        try {
          // Get the asset reference using the SDK
          const assetValue = field.getValue();
          console.log(`Asset value for ${fieldId}:`, assetValue);

          // Case 1: Direct asset reference with sys.id
          if (assetValue && assetValue.sys) {
            let assetId;
            let isAssetLink = false;
            let isEntryLink = false;

            // Check if it's an asset reference or a link to an asset or entry
            if (assetValue.sys.type === 'Link') {
              if (assetValue.sys.linkType === 'Asset') {
                assetId = assetValue.sys.id;
                isAssetLink = true;
                console.log(`Found Asset link with ID: ${assetId}`);
              } else if (assetValue.sys.linkType === 'Entry') {
                assetId = assetValue.sys.id;
                isEntryLink = true;
                console.log(`Found Entry link with ID: ${assetId}`);
              }
            } else if (assetValue.sys.type === 'Asset') {
              assetId = assetValue.sys.id;
              console.log(`Found direct Asset with ID: ${assetId}`);
            }

            if (assetId) {
              try {
                // Try to get the asset or entry directly through the SDK
                let asset;
                if (isAssetLink) {
                  // For asset links, we need to resolve to get the actual asset
                  asset = await sdk.cma.asset.get({ assetId });
                } else if (isEntryLink) {
                  // For entry links, fetch the linked entry
                  const linkedEntry = await sdk.cma.entry.get({ entryId: assetId });
                  console.log(`Linked entry retrieved:`, linkedEntry);

                  // Extract content from the linked entry
                  const entryContent = extractContentFromEntry(linkedEntry);
                  console.log(`Extracted content from linked entry: ${entryContent}`);

                  // Store the extracted content
                  processedEntry.fields[fieldId] = {
                    'en-US': entryContent,
                  };
                  continue; // Skip the rest of this iteration
                } else {
                  // Direct asset, no need to resolve
                  asset = assetValue;
                }

                if (asset) {
                  console.log(`Asset retrieved:`, asset);

                  // Create a structure that will work with our existing code
                  processedEntry.fields[fieldId] = {
                    'en-US': asset,
                  };
                }
              } catch (assetError) {
                console.error(`Error fetching asset/entry ${assetId}:`, assetError);

                // Fallback: If we can't get the asset, try to get the URL directly from the UI extension
                try {
                  // Check if we can get a URL from the current UI
                  if (field.getValue() && field.getValue().fields && field.getValue().fields.file) {
                    const fileUrl = field.getValue().fields.file.url;
                    if (fileUrl) {
                      console.log(`Found file URL directly: ${fileUrl}`);
                      // Create a structure with just the URL for our service to use
                      processedEntry.fields[fieldId] = {
                        'en-US': {
                          fields: {
                            file: {
                              url: fileUrl,
                            },
                          },
                        },
                      };
                    }
                  }
                } catch (urlError) {
                  console.error(`Error getting asset URL:`, urlError);
                  // Just pass through the original value as a last resort
                  processedEntry.fields[fieldId] = {
                    'en-US': assetValue,
                  };
                }
              }
            }
          }
          // Case 2: JSON string reference to an asset or entry
          else if (typeof assetValue === 'string' && assetValue.includes('"sys"')) {
            console.log(`Found JSON string reference: ${assetValue}`);

            try {
              const parsed = JSON.parse(assetValue);
              if (parsed.sys) {
                let id;
                let isAssetLink = false;
                let isEntryLink = false;

                // Check if it's an asset reference or a link to an asset or entry
                if (parsed.sys.type === 'Link') {
                  id = parsed.sys.id;
                  if (parsed.sys.linkType === 'Asset') {
                    isAssetLink = true;
                    console.log(`Found Asset link in JSON with ID: ${id}`);
                  } else if (parsed.sys.linkType === 'Entry') {
                    isEntryLink = true;
                    console.log(`Found Entry link in JSON with ID: ${id}`);
                  }
                } else if (parsed.sys.type === 'Asset') {
                  id = parsed.sys.id;
                  console.log(`Found direct Asset in JSON with ID: ${id}`);
                }

                if (id) {
                  try {
                    if (isAssetLink) {
                      // Try to get the asset through the CMA
                      const asset = await sdk.cma.asset.get({ assetId: id });
                      console.log(`Asset retrieved from string reference:`, asset);

                      // Store the asset in our processed entry
                      processedEntry.fields[fieldId] = {
                        'en-US': asset,
                      };
                    } else if (isEntryLink) {
                      // Try to get the linked entry through the CMA
                      const linkedEntry = await sdk.cma.entry.get({ entryId: id });
                      console.log(`Entry retrieved from string reference:`, linkedEntry);

                      // Extract content from the linked entry
                      const entryContent = extractContentFromEntry(linkedEntry);
                      console.log(`Extracted content from linked entry: ${entryContent}`);

                      // Store the extracted content
                      processedEntry.fields[fieldId] = {
                        'en-US': entryContent,
                      };
                    }
                  } catch (fetchError) {
                    console.error(`Error fetching reference ${id}:`, fetchError);
                    // Pass through the original
                    processedEntry.fields[fieldId] = {
                      'en-US': assetValue,
                    };
                  }
                }
              }
            } catch (parseError) {
              console.error(`Error parsing reference:`, parseError);
              // Pass through the original
              processedEntry.fields[fieldId] = {
                'en-US': assetValue,
              };
            }
          } else {
            // Unsupported format, just pass it through
            console.log(`Unsupported asset format:`, assetValue);
            processedEntry.fields[fieldId] = {
              'en-US': assetValue,
            };
          }
        } catch (fieldError) {
          console.error(`Error processing field ${fieldId}:`, fieldError);
          // Pass through the original field if we encounter an error
          if (entry.fields[fieldId]) {
            processedEntry.fields[fieldId] = entry.fields[fieldId];
          }
        }
      }
      // For entry field type, which is specifically for entry references
      else if (mapping.fieldType === 'entry') {
        console.log(`Processing entry reference field ${fieldId}`);

        try {
          // Get the field value, handling different formats
          const value = processFieldValue(field);
          console.log(`Entry reference value for ${fieldId}:`, value);

          // Handle different types of entry references

          // 1. Direct Entry object
          if (value && value.sys && value.sys.type === 'Entry') {
            console.log(`Direct Entry object found`);
            // Extract content from this entry
            const entryContent = extractContentFromEntry(value);
            processedEntry.fields[fieldId] = {
              'en-US': entryContent,
            };
          }
          // 2. Entry Link
          else if (
            value &&
            value.sys &&
            value.sys.type === 'Link' &&
            value.sys.linkType === 'Entry'
          ) {
            const entryId = value.sys.id;
            console.log(`Entry link found with ID: ${entryId}`);

            try {
              // Fetch the linked entry
              const linkedEntry = await sdk.cma.entry.get({ entryId });

              // Extract content from the linked entry
              const entryContent = extractContentFromEntry(linkedEntry);
              console.log(`Content extracted from linked entry: ${entryContent}`);

              processedEntry.fields[fieldId] = {
                'en-US': entryContent,
              };
            } catch (error) {
              console.error(`Error resolving entry link: ${error}`);
              processedEntry.fields[fieldId] = {
                'en-US': `[Unresolved entry: ${entryId}]`,
              };
            }
          }
          // 3. Array of Entry Links (direct array format)
          else if (isDirectEntryReferenceArray(value)) {
            console.log(`Direct array of entry references detected`);
            const resolvedContent = await resolveEntryReferenceArray(sdk, value);
            processedEntry.fields[fieldId] = {
              'en-US': resolvedContent,
            };
          }
          // 4. String with JSON entry reference
          else if (typeof value === 'string' && value.includes('"sys"')) {
            console.log(`JSON string reference found: ${value}`);

            // Check if it's an array of references
            if (isEntryReferenceArray(value)) {
              console.log(`Array of entry references detected`);
              const resolvedContent = await resolveEntryReferenceArray(sdk, value);
              processedEntry.fields[fieldId] = {
                'en-US': resolvedContent,
              };
            }
            // Single entry reference
            else {
              try {
                const parsed = JSON.parse(value);
                if (parsed.sys && parsed.sys.type === 'Link' && parsed.sys.linkType === 'Entry') {
                  const entryId = parsed.sys.id;

                  try {
                    // Fetch the linked entry
                    const linkedEntry = await sdk.cma.entry.get({ entryId });

                    // Extract content from the linked entry
                    const entryContent = extractContentFromEntry(linkedEntry);
                    console.log(`Content extracted from entry reference: ${entryContent}`);

                    processedEntry.fields[fieldId] = {
                      'en-US': entryContent,
                    };
                  } catch (error) {
                    console.error(`Error resolving entry reference: ${error}`);
                    processedEntry.fields[fieldId] = {
                      'en-US': `[Unresolved entry: ${entryId}]`,
                    };
                  }
                } else {
                  console.warn(`Unrecognized JSON structure:`, parsed);
                  processedEntry.fields[fieldId] = {
                    'en-US': value,
                  };
                }
              } catch (error) {
                console.error(`Error parsing JSON string: ${error}`);
                processedEntry.fields[fieldId] = {
                  'en-US': value,
                };
              }
            }
          }
          // 5. Other types of values
          else {
            console.log(`Unknown entry reference format:`, value);
            processedEntry.fields[fieldId] = {
              'en-US': value,
            };
          }
        } catch (error) {
          console.error(`Error processing entry reference field ${fieldId}:`, error);
          processedEntry.fields[fieldId] = entry.fields[fieldId];
        }
      }
      // For reference-array field type, which is specifically for arrays of entry references
      else if (mapping.fieldType === 'reference-array') {
        console.log(`Processing reference array field ${fieldId}`);

        try {
          // Get the field value, handling different formats
          const value = processFieldValue(field);
          console.log(`Reference array value for ${fieldId}:`, value);

          // Direct array of Entry Links
          if (isDirectEntryReferenceArray(value)) {
            console.log(`Direct array of entry references detected`);
            const resolvedContent = await resolveEntryReferenceArray(sdk, value);
            processedEntry.fields[fieldId] = {
              'en-US': resolvedContent,
            };
          }
          // JSON string array of Entry Links
          else if (typeof value === 'string' && isEntryReferenceArray(value)) {
            console.log(`JSON string array of entry references detected`);
            const resolvedContent = await resolveEntryReferenceArray(sdk, value);
            processedEntry.fields[fieldId] = {
              'en-US': resolvedContent,
            };
          }
          // _fieldLocales format that needs special handling
          else if (field?._fieldLocales?.['en-US']?._value) {
            console.log(`Field with _fieldLocales detected`);
            const fieldValue = field._fieldLocales['en-US']._value;

            if (isDirectEntryReferenceArray(fieldValue)) {
              console.log(`_fieldLocales contains array of entry references`);
              const resolvedContent = await resolveEntryReferenceArray(sdk, fieldValue);
              processedEntry.fields[fieldId] = {
                'en-US': resolvedContent,
              };
            } else {
              console.warn(`Unrecognized _fieldLocales value:`, fieldValue);
              processedEntry.fields[fieldId] = {
                'en-US': JSON.stringify(fieldValue),
              };
            }
          }
          // Unknown format, just pass through as JSON
          else {
            console.log(`Unknown reference array format:`, value);
            if (typeof value === 'object') {
              processedEntry.fields[fieldId] = {
                'en-US': JSON.stringify(value),
              };
            } else {
              processedEntry.fields[fieldId] = {
                'en-US': value,
              };
            }
          }
        } catch (error) {
          console.error(`Error processing reference array field ${fieldId}:`, error);
          processedEntry.fields[fieldId] = entry.fields[fieldId];
        }
      }
      // Text fields
      else {
        // For text fields, check if they contain entry references or rich text
        try {
          // Get the field value, handling different formats
          const textValue = processFieldValue(field);
          console.log(
            `Text field ${fieldId} value:`,
            typeof textValue === 'object' ? 'Complex object' : textValue
          );

          // First, check if this is a rich text document
          if (isRichTextDocument(textValue)) {
            console.log(`Rich text document detected in text field ${fieldId}`);

            // Convert rich text to HTML
            const htmlContent = richTextToHtml(textValue);
            console.log(
              `Converted rich text to HTML: ${htmlContent.substring(0, 100)}${
                htmlContent.length > 100 ? '...' : ''
              }`
            );

            // Store the HTML content
            processedEntry.fields[fieldId] = {
              'en-US': htmlContent,
            };
            continue;
          }

          // Handle the object structure seen in the example
          // {data: {}, content: [...], nodeType: "document"}
          if (
            typeof textValue === 'object' &&
            textValue.data &&
            Array.isArray(textValue.content) &&
            textValue.nodeType === 'document'
          ) {
            console.log(`Rich text document with standard structure detected`);

            // Convert to HTML
            const htmlContent = richTextToHtml(textValue);
            console.log(
              `Converted rich text to HTML: ${htmlContent.substring(0, 100)}${
                htmlContent.length > 100 ? '...' : ''
              }`
            );

            // Store the HTML content
            processedEntry.fields[fieldId] = {
              'en-US': htmlContent,
            };
            continue;
          }

          // Handle the structure from the example
          // {data: {}, content: [...]} without explicit nodeType
          if (typeof textValue === 'object' && textValue.data && Array.isArray(textValue.content)) {
            console.log(`Rich text content array detected without explicit nodeType`);

            // Convert to HTML by creating a document node with the content
            const htmlContent = richTextToHtml({
              nodeType: 'document',
              data: textValue.data,
              content: textValue.content,
            });
            console.log(
              `Converted rich text to HTML: ${htmlContent.substring(0, 100)}${
                htmlContent.length > 100 ? '...' : ''
              }`
            );

            // Store the HTML content
            processedEntry.fields[fieldId] = {
              'en-US': htmlContent,
            };
            continue;
          }

          // For Rich Text fields that come as JSON string instead of parsed object
          if (typeof textValue === 'string' && textValue.includes('"nodeType":"document"')) {
            console.log(`Rich text found as JSON string`);

            try {
              // Parse the JSON string and convert to HTML
              const richTextObj = JSON.parse(textValue);
              const htmlContent = richTextToHtml(richTextObj);
              console.log(
                `Converted JSON string rich text to HTML: ${htmlContent.substring(0, 100)}${
                  htmlContent.length > 100 ? '...' : ''
                }`
              );

              // Store the HTML content
              processedEntry.fields[fieldId] = {
                'en-US': htmlContent,
              };
            } catch (parseError) {
              console.error(`Error parsing rich text JSON string:`, parseError);
              // If we can't parse it, just pass it through
              processedEntry.fields[fieldId] = {
                'en-US': textValue,
              };
            }
            continue;
          }

          // Then check for rich text in _fieldLocales format
          if (
            field?._fieldLocales?.['en-US']?._value &&
            isRichTextDocument(field._fieldLocales['en-US']._value)
          ) {
            console.log(`Rich text document found in _fieldLocales._value`);
            const richTextValue = field._fieldLocales['en-US']._value;

            // Convert rich text to HTML
            const htmlContent = richTextToHtml(richTextValue);
            console.log(
              `Converted rich text to HTML: ${htmlContent.substring(0, 100)}${
                htmlContent.length > 100 ? '...' : ''
              }`
            );

            // Store the HTML content
            processedEntry.fields[fieldId] = {
              'en-US': htmlContent,
            };
            continue;
          }

          // Handle _fieldLocales format specifically for reference arrays
          if (
            field?._fieldLocales?.['en-US']?._value &&
            Array.isArray(field._fieldLocales['en-US']._value) &&
            isDirectEntryReferenceArray(field._fieldLocales['en-US']._value)
          ) {
            console.log(`Array of references found in _fieldLocales._value`);
            const fieldValue = field._fieldLocales['en-US']._value;
            const resolvedContent = await resolveEntryReferenceArray(sdk, fieldValue);
            processedEntry.fields[fieldId] = {
              'en-US': resolvedContent,
            };
            continue;
          }

          // Check if this is a direct array of entry references
          if (isDirectEntryReferenceArray(textValue)) {
            console.log(`Direct array of entry references detected in text field`);
            const resolvedContent = await resolveEntryReferenceArray(sdk, textValue);
            processedEntry.fields[fieldId] = {
              'en-US': resolvedContent,
            };
            continue;
          }

          // Check if this is a JSON string array of entry references
          if (
            typeof textValue === 'string' &&
            textValue.includes('"sys"') &&
            textValue.includes('"linkType":"Entry"')
          ) {
            // Check if it's an array of references
            if (isEntryReferenceArray(textValue)) {
              console.log(`Array of entry references detected in text field`);
              const resolvedContent = await resolveEntryReferenceArray(sdk, textValue);
              processedEntry.fields[fieldId] = {
                'en-US': resolvedContent,
              };
              continue;
            }

            // Single entry reference
            console.log(`Found potential Entry reference in text field: ${textValue}`);

            try {
              const parsed = JSON.parse(textValue);
              if (
                parsed.sys &&
                parsed.sys.type === 'Link' &&
                parsed.sys.linkType === 'Entry' &&
                parsed.sys.id
              ) {
                const linkedEntryId = parsed.sys.id;
                console.log(`Found Entry link ID: ${linkedEntryId}`);

                try {
                  // Fetch the linked entry
                  const linkedEntry = await sdk.cma.entry.get({ entryId: linkedEntryId });
                  console.log(`Linked entry retrieved:`, linkedEntry);

                  // Extract content from the linked entry
                  const entryContent = extractContentFromEntry(linkedEntry);
                  console.log(`Extracted content from linked entry: ${entryContent}`);

                  // Store the extracted content
                  processedEntry.fields[fieldId] = {
                    'en-US': entryContent,
                  };
                  continue; // Skip the rest of this iteration
                } catch (entryError) {
                  console.error(`Error fetching linked entry ${linkedEntryId}:`, entryError);
                  // Fall back to original value
                }
              }
            } catch (parseError) {
              console.error(`Error parsing entry reference:`, parseError);
            }
          }

          // If we didn't handle it as a special case, just copy the original value
          processedEntry.fields[fieldId] = entry.fields[fieldId];
        } catch (fieldError) {
          console.error(`Error processing text field ${fieldId}:`, fieldError);
          // Pass through the original field
          processedEntry.fields[fieldId] = entry.fields[fieldId];
        }
      }
    }

    console.log('Processed entry:', processedEntry);

    // Initialize Klaviyo service with OAuth config
    const klaviyoService = new KlaviyoService(oauthConfig);

    // Sync content to Klaviyo
    const results = await klaviyoService.syncContent(mappings, processedEntry);
    console.log('Successfully synced content to Klaviyo:', results);

    // Show success notification
    sdk.notifier.success('Content successfully synced to Klaviyo');
  } catch (error) {
    console.error('Error syncing content to Klaviyo:', error);

    // Special handling for OAuth errors
    if (
      error instanceof Error &&
      (error.message.includes('Authentication required') ||
        error.message.includes('Authentication failed') ||
        error.message.includes('Your session has expired'))
    ) {
      // Clear token to force re-authentication
      localStorage.removeItem('klaviyo_access_token');
      localStorage.removeItem('klaviyo_refresh_token');
      localStorage.removeItem('klaviyo_token_expires_at');
      sdk.notifier.error(
        'Authentication failed: Your session has expired. Please reconnect to Klaviyo in the app configuration.'
      );
    } else {
      sdk.notifier.error('Failed to sync content to Klaviyo. See console for details.');
    }
  }
}
