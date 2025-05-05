const axios = require('axios');

// Klaviyo API URLs
const KLAVIYO_API_URL = 'https://a.klaviyo.com/api';
const KLAVIYO_API_REVISION = '2025-04-15';

// Define CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,Origin,Accept',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Access-Control-Max-Age': '86400',
  'Access-Control-Allow-Credentials': true,
};

// Response formatter
const formatResponse = (statusCode, body, headers = {}) => {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
      ...headers,
    },
    body: JSON.stringify(body),
  };
};

// Validate Klaviyo API credentials
const validateCredentials = async (privateKey) => {
  try {
    console.log('Validating credentials with Klaviyo API');

    const response = await axios.get(`${KLAVIYO_API_URL}/accounts/`, {
      headers: {
        Accept: 'application/json',
        revision: KLAVIYO_API_REVISION,
        Authorization: `Klaviyo-API-Key ${privateKey}`,
      },
      timeout: 25000, // 25 seconds timeout for API requests
    });

    console.log('Successfully validated Klaviyo credentials');
    return { valid: true, data: response.data };
  } catch (error) {
    console.error(
      'Error validating Klaviyo credentials:',
      error.response?.status,
      error.response?.statusText,
      error.response?.data || error.message
    );

    // Check specific error cases
    if (error.response?.status === 401) {
      return {
        valid: false,
        error: 'Authentication failed: Invalid API key',
      };
    } else if (error.response?.status === 403) {
      return {
        valid: false,
        error: 'Authentication failed: API key does not have permission to access this endpoint',
      };
    } else if (error.response?.status === 404) {
      return {
        valid: false,
        error:
          'Authentication failed: API endpoint not found. You may need to update the Klaviyo API version.',
      };
    }

    return {
      valid: false,
      error: error.response?.data?.message || error.message,
    };
  }
};

// Klaviyo API handlers
const trackEvent = async (data, privateKey) => {
  try {
    const response = await axios.post(
      `${KLAVIYO_API_URL}/events/`,
      {
        data: {
          type: 'event',
          attributes: {
            profile: data.customerProperties,
            metric: { name: data.event },
            properties: data.properties,
          },
        },
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          revision: KLAVIYO_API_REVISION,
          Authorization: `Klaviyo-API-Key ${privateKey}`,
        },
        timeout: 25000, // 25 seconds timeout for API requests
      }
    );
    return response.data;
  } catch (error) {
    console.error(
      'Error tracking Klaviyo event:',
      error.response?.status,
      error.response?.statusText,
      error.response?.data || error.message
    );
    throw error;
  }
};

// Utility function to debug content data
const debugContentPayload = (data, prefix = '') => {
  console.log(`${prefix} Debugging content payload:`);

  try {
    // Check if data has the right structure
    const hasDataNode = !!data.data;
    console.log(`${prefix} Has data node:`, hasDataNode);

    if (hasDataNode) {
      const contentType = data.data.attributes?.definition?.type || 'unknown';
      console.log(`${prefix} Content type:`, contentType);

      // Check if data has styles for text blocks
      if (contentType === 'text') {
        const hasStyles = !!data.data.attributes?.definition?.data?.styles;
        console.log(`${prefix} Has styles:`, hasStyles);

        if (hasStyles) {
          const stylesKeys = Object.keys(data.data.attributes.definition.data.styles);
          console.log(`${prefix} Styles keys:`, stylesKeys);
          console.log(`${prefix} Styles empty:`, stylesKeys.length === 0);
        }

        const hasDisplayOptions = !!data.data.attributes?.definition?.data?.display_options;
        console.log(`${prefix} Has display_options:`, hasDisplayOptions);

        if (hasDisplayOptions) {
          const optionsKeys = Object.keys(data.data.attributes.definition.data.display_options);
          console.log(`${prefix} Display options keys:`, optionsKeys);
          console.log(`${prefix} Display options empty:`, optionsKeys.length === 0);
        }
      }
    }

    // If data is in a different format, try to extract important info
    if (!hasDataNode && data.fields) {
      console.log(`${prefix} Has fields array:`, Array.isArray(data.fields));
      console.log(`${prefix} Field count:`, data.fields.length);
      console.log(
        `${prefix} Content type from fields:`,
        data.fields && data.fields.some((f) => f.type === 'html' || f.fieldType === 'richText')
          ? 'html'
          : 'text'
      );
    }
  } catch (err) {
    console.log(`${prefix} Debug error:`, err.message);
  }
};

/**
 * Find content by external ID in Klaviyo
 * This searches for content blocks that have the external ID in their name
 */
const findContentByExternalId = async (externalId, privateKey) => {
  try {
    console.log(`Searching for content with external ID: ${externalId}`);

    // Since we can't use contains for filtering, we'll need to fetch all content blocks
    // and filter them on our side
    const response = await axios({
      method: 'get',
      url: `${KLAVIYO_API_URL}/template-universal-content/`,
      params: {
        page_size: 100, // Request a large page size to get as many items as possible
      },
      headers: {
        Accept: 'application/json',
        revision: KLAVIYO_API_REVISION,
        Authorization: `Klaviyo-API-Key ${privateKey}`,
      },
      timeout: 25000, // 25 seconds timeout for API requests
    });

    // Check if we got any content blocks
    if (response.data.data && response.data.data.length > 0) {
      console.log(
        `Retrieved ${response.data.data.length} content blocks, filtering for external ID: ${externalId}`
      );

      // Look for external ID marker in the name
      const idMarker = `[ID:${externalId}]`;
      const matchingContent = response.data.data.find(
        (item) => item.attributes && item.attributes.name && item.attributes.name.includes(idMarker)
      );

      if (matchingContent) {
        console.log(
          `Found content block matching external ID: ${externalId}, ID: ${matchingContent.id}`
        );
        return matchingContent;
      }
    }

    console.log(`No content found with external ID: ${externalId}`);
    return null;
  } catch (error) {
    console.error(
      'Error searching for content by external ID:',
      error.response?.status,
      error.response?.statusText,
      error.response?.data || error.message
    );

    // Don't throw - just return null if we can't find it
    return null;
  }
};

const uploadContent = async (data, privateKey) => {
  try {
    // Debug incoming content data
    debugContentPayload(data, '[INITIAL]');

    // Check if this is an update operation (has an ID)
    const isUpdate = !!data.id;
    console.log(`Upload operation: ${isUpdate ? 'UPDATE' : 'CREATE'}, ID: ${data.id || 'none'}`);

    const method = isUpdate ? 'patch' : 'post';

    // Determine which endpoint to use based on data.objectType or default to template-universal-content
    const endpointType = data.objectType || 'template-universal-content';
    const endpoint = isUpdate ? `${endpointType}/${data.id}/` : `${endpointType}/`;

    console.log(`${isUpdate ? 'Updating' : 'Creating'} content in Klaviyo:`, {
      method,
      endpoint,
      endpointType,
      contentId: data.id,
      apiUrl: `${KLAVIYO_API_URL}/${endpoint}`,
    });

    // Process any fields to extract localized content
    if (data.fields && Array.isArray(data.fields)) {
      data.fields = data.fields.map((field) => {
        if (field.value && typeof field.value === 'object' && !Array.isArray(field.value)) {
          // Check if this is a localized text field object
          if (field.value['en-US'] !== undefined || Object.keys(field.value).length === 1) {
            console.log(`Processing localized field value in uploadContent: ${field.fieldId}`);
            const extractedValue = extractTextFromLocalizedField(field.value);
            console.log(`Extracted value: "${extractedValue}"`);
            return {
              ...field,
              value: extractedValue,
            };
          }
        }
        return field;
      });
    }

    // Format the request body according to Klaviyo's JSON:API requirements
    let requestBody;

    // If data is already in the correct format with a 'data' object at the root, use it directly
    if (
      data.data &&
      typeof data.data === 'object' &&
      (data.data.type === 'universal-content' || data.data.type === 'template-universal-content')
    ) {
      requestBody = data;

      // Ensure the type is set to template-universal-content
      if (data.data.type === 'universal-content') {
        requestBody.data.type = 'template-universal-content';
      }

      // Process content if it's a localized object or any JSON object
      if (
        requestBody.data.attributes?.definition?.data?.content &&
        typeof requestBody.data.attributes.definition.data.content === 'object'
      ) {
        const content = requestBody.data.attributes.definition.data.content;
        console.log('Processing content object in definition data');
        // First try to extract text from localized field
        const extractedContent = extractTextFromLocalizedField(content);

        // If we got something other than [object Object], use it
        if (extractedContent !== '[object Object]') {
          requestBody.data.attributes.definition.data.content = extractedContent;
          console.log(`Extracted content text: "${extractedContent}"`);
        } else {
          // Otherwise format it as JSON
          requestBody.data.attributes.definition.data.content = formatJsonForDisplay(content);
          console.log('Formatted content as JSON');
        }
      }
    } else {
      // Otherwise, wrap the data in a proper JSON:API format
      const contentType =
        data.contentType === 'html' ||
        (data.fields && data.fields.some((f) => f.type === 'html' || f.fieldType === 'richText'))
          ? 'html'
          : 'text';

      // Extract field content, handling localized objects if needed
      let fieldContent = '';
      if (data.fields && data.fields.length > 0) {
        fieldContent = formatFieldsToHtml(data.fields);
      } else if (data.content) {
        // If content is an object (localized or JSON), format it appropriately
        if (typeof data.content === 'object' && !Array.isArray(data.content)) {
          console.log('Processing direct content object');

          // First try to extract text from localized field
          const extractedContent = extractTextFromLocalizedField(data.content);

          // If we got something other than [object Object], use it
          if (extractedContent !== '[object Object]') {
            fieldContent = extractedContent;
            console.log(`Extracted content text: "${extractedContent}"`);
          } else {
            // Otherwise format it as JSON with proper HTML formatting for display
            const formattedJson = formatJsonForDisplay(data.content);
            fieldContent = `<pre class="json-object">${escapeHtml(formattedJson)}</pre>`;
            console.log('Formatted content as JSON');
          }
        } else {
          fieldContent = data.content;
        }
      }

      // Create the base request body structure
      requestBody = {
        data: {
          type: endpointType,
          attributes: {
            name: data.name || 'Universal Content Block',
            definition: {
              content_type: 'block',
              type: contentType,
              data: {
                content: fieldContent,
                // Only include display_options, never styles for creation
                display_options: {},
              },
            },
          },
        },
      };

      // Store the name with the external ID so we can find it later for updates
      if (data.external_id) {
        // Append the external ID to the name for tracking purposes
        requestBody.data.attributes.name = `${requestBody.data.attributes.name} [ID:${data.external_id}]`;
        console.log(`Using external_id in name: ${data.external_id}`);
      }

      // Never add styles for initial creation or for updates - Klaviyo doesn't allow this
      // Leave this commented block as a reminder
      // if (isUpdate) {
      //   requestBody.data.attributes.definition.data.styles = {};
      // }

      // If this is an update, add the ID
      if (isUpdate) {
        requestBody.data.id = data.id;
        console.log(`Added ID to request data: ${data.id}`);
      }
    }

    console.log('Sending request body to Klaviyo:', JSON.stringify(requestBody, null, 2));

    // FAILSAFE: Check to ensure TextBlockData has proper configuration for both POST and PATCH
    if (requestBody?.data?.attributes?.definition?.type === 'text') {
      console.log('FAILSAFE: Ensuring TextBlockData has proper configuration');

      // Ensure data section exists
      if (!requestBody.data.attributes.definition.data) {
        requestBody.data.attributes.definition.data = {};
      }

      // For updates, we include styles; for creation, we remove styles
      if (method.toLowerCase() === 'patch') {
        // For PATCH requests, remove styles entirely - Klaviyo doesn't allow styles in PATCH
        delete requestBody.data.attributes.definition.data.styles;
        console.log("PATCH request: removed styles property as it's not allowed in updates");
      } else if (method.toLowerCase() === 'post') {
        // For POST requests, remove styles entirely as they're not allowed on create
        delete requestBody.data.attributes.definition.data.styles;
      }

      // Always include display_options
      requestBody.data.attributes.definition.data.display_options = {};

      console.log('FAILSAFE: Updated request body:', JSON.stringify(requestBody, null, 2));
    }

    // ADDITIONAL CHECK: Make sure styles is removed for all HTML content in PATCH requests
    if (
      method.toLowerCase() === 'patch' &&
      requestBody?.data?.attributes?.definition?.type === 'html' &&
      requestBody?.data?.attributes?.definition?.data?.styles
    ) {
      delete requestBody.data.attributes.definition.data.styles;
      console.log(
        "PATCH request for HTML content: removed styles property as it's not allowed in updates"
      );
    }

    // Debug final request body before sending
    debugContentPayload(requestBody, '[FINAL]');

    console.log(`Making ${method.toUpperCase()} request to: ${KLAVIYO_API_URL}/${endpoint}`);
    console.log(`Using API revision: ${KLAVIYO_API_REVISION}`);

    const response = await axios({
      method,
      url: `${KLAVIYO_API_URL}/${endpoint}`,
      data: requestBody,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        revision: KLAVIYO_API_REVISION,
        Authorization: `Klaviyo-API-Key ${privateKey}`,
      },
      timeout: 25000, // 25 seconds timeout for API requests
    });

    console.log(`Klaviyo API response status: ${response.status}`);
    console.log(`Response headers:`, response.headers);

    return response.data;
  } catch (error) {
    console.error(
      'Error with Klaviyo content operation:',
      error.response?.status,
      error.response?.statusText,
      error.response?.data || error.message
    );

    // More detailed error logging
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response headers:', error.response.headers);
    }

    throw error;
  }
};

const identifyProfile = async (data, privateKey) => {
  try {
    const response = await axios.post(
      `${KLAVIYO_API_URL}/profiles/`,
      {
        data: {
          type: 'profile',
          attributes: data.properties,
        },
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          revision: KLAVIYO_API_REVISION,
          Authorization: `Klaviyo-API-Key ${privateKey}`,
        },
        timeout: 25000, // 25 seconds timeout for API requests
      }
    );
    return response.data;
  } catch (error) {
    console.error(
      'Error identifying Klaviyo profile:',
      error.response?.status,
      error.response?.statusText,
      error.response?.data || error.message
    );
    throw error;
  }
};

// Define allowlist of permitted endpoints
const ALLOWED_ENDPOINTS = ['template-universal-content', 'images'];

// Main Lambda handler
exports.handler = async (event) => {
  console.log('--- Incoming Request ---');
  console.log('Method:', event.httpMethod);
  console.log('Path:', event.path);
  console.log('Headers:', event.headers);
  console.log('Body:', event.body);
  console.log('------------------------');

  // Handle preflight OPTIONS request for CORS
  if (event.httpMethod === 'OPTIONS') {
    console.log('Handling OPTIONS preflight request');
    return {
      statusCode: 204,
      headers: corsHeaders,
      body: '',
    };
  }

  try {
    // Handle credential validation endpoint
    if (event.path === '/api/klaviyo/proxy/validate-credentials' && event.httpMethod === 'POST') {
      console.log('Validating Klaviyo credentials');
      try {
        const body = JSON.parse(event.body || '{}');
        const { privateKey, publicKey } = body;

        if (!privateKey) {
          return formatResponse(400, {
            valid: false,
            message: 'Private key is required',
          });
        }

        const validation = await validateCredentials(privateKey);

        return formatResponse(validation.valid ? 200 : 401, {
          valid: validation.valid,
          message: validation.valid
            ? 'Credentials validated successfully'
            : `Authentication failed: ${validation.error}`,
        });
      } catch (error) {
        console.error('Error in validate-credentials endpoint:', error);
        return formatResponse(500, {
          valid: false,
          message: `Server error: ${error.message}`,
        });
      }
    }

    // Handle API proxy request
    if (event.path === '/api/klaviyo/proxy/request' && event.httpMethod === 'POST') {
      console.log(`Processing API proxy request`);
      try {
        const body = JSON.parse(event.body || '{}');
        const { endpoint, method, data, params, privateKey, publicKey } = body;

        if (!privateKey) {
          return formatResponse(400, { error: 'Missing private API key' });
        }

        if (!endpoint) {
          return formatResponse(400, { error: 'Missing endpoint parameter' });
        }

        // Validate endpoint against allowlist
        const baseEndpoint = endpoint.split('/')[0]; // Get the first part of the path
        if (!ALLOWED_ENDPOINTS.includes(baseEndpoint)) {
          return formatResponse(403, {
            error: 'Forbidden',
            message: 'The requested endpoint is not allowed',
          });
        }

        try {
          // Ensure the endpoint has the trailing slash required by Klaviyo API
          const formattedEndpoint = endpoint.endsWith('/') ? endpoint : `${endpoint}/`;
          console.log(`Making request to Klaviyo API endpoint: ${formattedEndpoint}`);

          // Build URL with query parameters for GET requests
          let url = `${KLAVIYO_API_URL}/${formattedEndpoint}`;
          let requestParams = method.toLowerCase() === 'get' ? params || {} : undefined;
          let requestData = method.toLowerCase() !== 'get' ? data : undefined;

          // For GET requests with query parameters, log them
          if (method.toLowerCase() === 'get' && params) {
            console.log('GET request with query parameters:', params);
          }

          // PROXY HANDLER FAILSAFE: Validate and fix TextBlockData for universal or template-universal content
          if (
            (method.toLowerCase() === 'post' || method.toLowerCase() === 'patch') &&
            (formattedEndpoint.includes('universal-content') ||
              formattedEndpoint.includes('template-universal-content')) &&
            requestData?.data?.attributes?.definition?.type === 'text'
          ) {
            console.log('PROXY HANDLER: Validating TextBlockData for text block');

            // Ensure data structure exists
            if (!requestData.data.attributes.definition.data) {
              requestData.data.attributes.definition.data = {};
            }

            // Handle styles based on request method
            if (method.toLowerCase() === 'post') {
              // For POST requests, REMOVE styles as they're not allowed on create
              if (requestData.data.attributes.definition.data.styles) {
                console.log(
                  'PROXY HANDLER: Removing styles for POST request as they are not allowed on create'
                );
                delete requestData.data.attributes.definition.data.styles;
              }
            } else if (method.toLowerCase() === 'patch') {
              // For PATCH requests, ensure styles exists (required for updates)
              requestData.data.attributes.definition.data.styles =
                requestData.data.attributes.definition.data.styles || {};
            }

            // Set valid display options
            requestData.data.attributes.definition.data.display_options = {};

            console.log('PROXY HANDLER: Updated TextBlockData configuration');
            console.log('PROXY HANDLER: Final request data:', JSON.stringify(requestData, null, 2));
          }

          // Make request to Klaviyo API
          const response = await axios({
            method: method || 'get',
            url: url,
            data: requestData,
            params: requestParams,
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
              revision: KLAVIYO_API_REVISION,
              Authorization: `Klaviyo-API-Key ${privateKey}`,
            },
            timeout: 25000, // 25 seconds timeout for API requests
          });

          console.log(`Klaviyo API response status: ${response.status}`);
          return formatResponse(200, { data: response.data });
        } catch (error) {
          console.error(
            'Error calling Klaviyo API:',
            error.response?.status,
            error.response?.statusText,
            error.response?.data || error.message
          );

          const statusCode = error.response?.status || 500;
          return formatResponse(statusCode, {
            error: 'API request failed',
            details: error.response?.data || { message: error.message },
          });
        }
      } catch (error) {
        console.error('Error processing proxy request:', error);
        return formatResponse(400, {
          error: 'Invalid request',
          message: error.message,
        });
      }
    }

    // Handle old proxy format (for backward compatibility)
    if (event.path === '/api/klaviyo/proxy' && event.httpMethod === 'POST') {
      console.log(`Processing legacy proxy request`);
      try {
        const body = JSON.parse(event.body || '{}');
        const { action, data, privateKey, publicKey } = body;

        if (!privateKey) {
          return formatResponse(400, { error: 'Missing private API key' });
        }

        if (!action) {
          return formatResponse(400, { error: 'Missing action parameter' });
        }

        try {
          let result;

          // Process based on action type
          if (action === 'track') {
            result = await trackEvent(data, privateKey);
          } else if (action === 'identify') {
            result = await identifyProfile(data, privateKey);
          } else if (action === 'upload') {
            result = await uploadContent(data, privateKey);
          }
          // Handle sync actions
          else if (action === 'syncMark') {
            console.log(`Processing sync mark action for entry ${data.entryId}`);
            // Simple success response for now
            result = { success: true, message: 'Entry marked for sync' };
          } else if (action === 'syncMarkForSync') {
            console.log(
              `Processing mark for sync action for entry ${data.entryId} of type ${data.contentTypeId}`
            );
            // Simple success response for now
            result = { success: true, message: 'Entry marked for sync' };
          } else if (action === 'syncUpdateStatus') {
            console.log(`Processing update sync status action for entry ${data.entryId}`);
            // Simple success response for now
            result = { success: true, message: 'Sync status updated' };
          } else if (action === 'syncEntry') {
            console.log('Processing sync entry action for entry', data.entryId);

            try {
              console.log('Received syncEntry data:', JSON.stringify(data, null, 2));

              // Extract space ID if provided
              let spaceId = data.spaceId;

              // If no space ID provided, try to extract from entry data
              if (!spaceId) {
                console.log(
                  'No space ID provided in request data. Will attempt to extract from entry data.'
                );

                // Attempt to detect it in the entry references
                if (
                  data.entryData &&
                  data.entryData.reference &&
                  Array.isArray(data.entryData.reference)
                ) {
                  for (const ref of data.entryData.reference) {
                    if (ref.sys && ref.sys.space && ref.sys.space.sys && ref.sys.space.sys.id) {
                      spaceId = ref.sys.space.sys.id;
                      console.log(`Extracted space ID from reference: ${spaceId}`);
                      break;
                    }
                  }
                }
              }

              console.log(`Using provided entry data:`, JSON.stringify(data.entryData, null, 2));

              // Check if field mappings were provided
              const fieldMappings = data.fieldMappings || [];
              console.log(`Found ${fieldMappings.length} field mappings in request`);

              // Prepare content for Klaviyo
              // Extract relevant fields from the entry
              const contentType = data.contentTypeId;

              // Helper function to get a good title from various entry formats
              function extractTitleFromEntry(entry, contentTypeId) {
                // Various ways title might be available
                if (entry.title) {
                  if (typeof entry.title === 'string') {
                    return entry.title;
                  }
                  // Handle localization object format
                  if (typeof entry.title === 'object') {
                    // Try to get first value from title object (common for localized titles)
                    if (entry.title['en-US']) {
                      return entry.title['en-US'];
                    }
                    // Try first value
                    const firstValue = Object.values(entry.title)[0];
                    if (firstValue) {
                      return String(firstValue);
                    }
                  }
                }

                // Try other common title fields
                if (entry.name && typeof entry.name === 'string') {
                  return entry.name;
                }

                if (entry.headline && typeof entry.headline === 'string') {
                  return entry.headline;
                }

                // Use fallback with entry ID and content type
                return `Content from ${contentTypeId} (ID: ${data.entryId.substring(0, 8)})`;
              }

              // Get base title for entries
              const baseTitle = extractTitleFromEntry(data.entryData, contentType);

              // Array to store all upload results
              const uploadResults = [];

              // If no field mappings, create a generic placeholder entry
              if (!fieldMappings || fieldMappings.length === 0) {
                console.warn('No field mappings provided, creating a placeholder entry');

                const externalId = `${data.entryId}-default`;
                const existingContent = await findContentByExternalId(externalId, privateKey);

                let klaviyoPayload;

                if (existingContent) {
                  console.log(
                    `Found existing fallback content, id: ${existingContent.id}, name: "${existingContent.attributes?.name}"`
                  );

                  // Create an update payload
                  klaviyoPayload = {
                    id: existingContent.id,
                    name: baseTitle,
                    contentType: 'html',
                    objectType: 'template-universal-content',
                    external_id: externalId,
                    fields: [
                      {
                        fieldId: 'content',
                        fieldType: 'text',
                        value: fallbackContent,
                      },
                    ],
                  };
                  console.log(
                    `Created update payload with ID: ${klaviyoPayload.id} for fallback content`
                  );
                } else {
                  // Create a new payload
                  klaviyoPayload = {
                    name: baseTitle,
                    contentType: 'html',
                    objectType: 'template-universal-content',
                    external_id: externalId,
                    fields: [
                      {
                        fieldId: 'content',
                        fieldType: 'text',
                        value: fallbackContent,
                      },
                    ],
                  };
                }

                const uploadResult = await uploadContent(klaviyoPayload, privateKey);
                uploadResults.push(uploadResult);
              } else {
                // Process each field mapping as a separate entry
                for (const mapping of fieldMappings) {
                  const { contentfulFieldId, klaviyoBlockName, fieldType } = mapping;
                  console.log(
                    `Processing field mapping: ${contentfulFieldId} -> ${klaviyoBlockName} (${fieldType})`
                  );

                  // Look for space ID in data if available, will be useful for asset URLs
                  let spaceId = '';
                  if (data.spaceId) {
                    spaceId = data.spaceId;
                    console.log(`Found space ID in request data: ${spaceId}`);
                  } else if (
                    data.entryData &&
                    data.entryData.sys &&
                    data.entryData.sys.space &&
                    data.entryData.sys.space.sys
                  ) {
                    spaceId = data.entryData.sys.space.sys.id;
                    console.log(`Found space ID in entry data: ${spaceId}`);
                  }

                  // Skip if field doesn't exist in entry
                  if (!data.entryData[contentfulFieldId]) {
                    console.log(`Field ${contentfulFieldId} not found in entry, skipping`);
                    continue;
                  }

                  const value = data.entryData[contentfulFieldId];
                  let processedValue = value;
                  let processedFieldType = fieldType || 'text';

                  // Early detection of image fields to ensure proper processing
                  // This helps prevent the field from being treated as regular text
                  if (
                    processedFieldType === 'image' ||
                    contentfulFieldId === 'titleImage' ||
                    (typeof value === 'object' && value?.sys?.linkType === 'Asset') ||
                    (typeof value === 'string' &&
                      (value.includes('"linkType":"Asset"') ||
                        value.includes('linkType\\":\\"Asset')))
                  ) {
                    console.log(`Confirmed image field type for ${contentfulFieldId}`);
                    processedFieldType = 'image';

                    // Skip the localized content check for image fields
                    // Continue to image processing...
                  }
                  // Handle localized content first (common case)
                  else if (
                    value &&
                    typeof value === 'object' &&
                    !Array.isArray(value) &&
                    (value['en-US'] !== undefined || Object.keys(value).length === 1)
                  ) {
                    console.log(`Detected localized content in field ${contentfulFieldId}`);

                    // Extract the text value from the localized object
                    const extractedText = extractTextFromLocalizedField(value);
                    console.log(
                      `Extracted text from localized field ${contentfulFieldId}: "${extractedText}"`
                    );

                    // Use extracted text as the processed value
                    processedValue = extractedText;
                  }
                  // Handle rich text content
                  else if (
                    processedFieldType === 'richText' ||
                    (value &&
                      typeof value === 'object' &&
                      (value.nodeType === 'document' ||
                        (value.content && Array.isArray(value.content))))
                  ) {
                    console.log(`Detected rich text content in field ${contentfulFieldId}`);
                    processedFieldType = 'richText';

                    // If value is already a string (pre-formatted HTML), use it directly
                    if (
                      typeof value === 'string' &&
                      (value.startsWith('<') || value.includes('</'))
                    ) {
                      processedValue = value;
                    }
                    // Otherwise, convert object to JSON string for storage
                    else if (typeof value === 'object') {
                      processedValue = JSON.stringify(value);
                    }
                  }
                  // Handle entry references
                  else if (
                    processedFieldType === 'entry' ||
                    processedFieldType === 'reference-array'
                  ) {
                    console.log(`Detected reference content in field ${contentfulFieldId}`);

                    // For references, store as JSON
                    if (typeof value !== 'string') {
                      processedValue = JSON.stringify(value);
                    }
                  }
                  // Handle regular text or other content
                  else if (typeof value === 'object') {
                    console.log(`Converting object to JSON string for field ${contentfulFieldId}`);
                    processedValue = JSON.stringify(value);
                  }

                  // Skip creating template-universal-content for images that were already uploaded to images API
                  if (processedFieldType === 'image') {
                    console.log(`Processing image field ${contentfulFieldId} for Klaviyo...`);
                    try {
                      console.log(`Attempting to upload image for field: ${contentfulFieldId}`);
                      const imageResult = await processImageField(
                        value,
                        klaviyoBlockName,
                        spaceId,
                        privateKey
                      );
                      if (imageResult.success && imageResult.url) {
                        // Successfully uploaded to Images API
                        console.log(
                          `Successfully uploaded image to Klaviyo Images API: ${imageResult.url}`
                        );
                        uploadResults.push({
                          data: {
                            id: imageResult.id || `image-${Date.now()}`,
                            type: 'image',
                            attributes: {
                              name: klaviyoBlockName,
                              url: imageResult.url,
                            },
                          },
                          meta: {
                            message: 'Image uploaded directly to images API',
                          },
                        });
                      } else {
                        // Image upload failed - log and skip
                        console.error(
                          `Image upload failed for field ${contentfulFieldId}: ${imageResult.error}`
                        );
                      }
                      // Always skip to the next field for images
                      continue;
                    } catch (imageError) {
                      console.error(
                        `Error processing image field ${contentfulFieldId}:`,
                        imageError
                      );
                      // Always skip to the next field for images
                      continue;
                    }
                  }

                  // Check if content already exists in Klaviyo
                  const externalId = `${data.entryId}-${contentfulFieldId}`;
                  console.log(`Checking for existing content with external ID ${externalId}`);
                  const existingContent = await findContentByExternalId(externalId, privateKey);

                  let fieldPayload;

                  if (existingContent) {
                    console.log(
                      `Found existing content for field ${contentfulFieldId}, id: ${existingContent.id}, name: "${existingContent.attributes?.name}"`
                    );

                    // For image fields, check if the value is already a URL (indicating successful upload to images API)
                    let fieldValue = processedValue;
                    let finalFieldType = processedFieldType;

                    // If this is an image and the value is a URL, change the field type to 'text' to properly display the image
                    if (processedFieldType === 'image') {
                      console.log(`Processing image field for ${klaviyoBlockName}`);

                      if (typeof processedValue === 'string' && processedValue.startsWith('http')) {
                        console.log(
                          `Converting image field to HTML with image tag for ${klaviyoBlockName}`
                        );
                        finalFieldType = 'text';
                        // Add HTML img tag for better display in Klaviyo
                        fieldValue = `<img src="${processedValue}" alt="${klaviyoBlockName}" style="max-width:100%;" />`;
                      } else if (
                        typeof processedValue === 'string' &&
                        processedValue.includes('"sys"')
                      ) {
                        // This is a stringified JSON reference that couldn't be uploaded
                        console.log(
                          `Image reference couldn't be uploaded, creating a note in the content`
                        );
                        finalFieldType = 'text';
                        fieldValue = `<p>Image reference (please make sure spaceId is provided): ${processedValue}</p>`;
                      }
                    }

                    // Create an update payload with the existing ID
                    fieldPayload = {
                      id: existingContent.id,
                      name: klaviyoBlockName,
                      contentType: 'html',
                      objectType: 'template-universal-content',
                      external_id: externalId,
                      fields: [
                        {
                          fieldId: klaviyoBlockName || contentfulFieldId,
                          fieldType: finalFieldType,
                          value: fieldValue,
                        },
                      ],
                    };
                  } else {
                    // For image fields, check if the value is already a URL (indicating successful upload to images API)
                    let fieldValue = processedValue;
                    let finalFieldType = processedFieldType;

                    // If this is an image and the value is a URL, change the field type to 'text' to properly display the image
                    if (processedFieldType === 'image') {
                      console.log(`Processing new image field for ${klaviyoBlockName}`);

                      if (typeof processedValue === 'string' && processedValue.startsWith('http')) {
                        console.log(
                          `Converting image field to HTML with image tag for ${klaviyoBlockName}`
                        );
                        finalFieldType = 'text';
                        // Add HTML img tag for better display in Klaviyo
                        fieldValue = `<img src="${processedValue}" alt="${klaviyoBlockName}" style="max-width:100%;" />`;
                      } else if (
                        typeof processedValue === 'string' &&
                        processedValue.includes('"sys"')
                      ) {
                        // This is a stringified JSON reference that couldn't be uploaded
                        console.log(
                          `Image reference couldn't be uploaded, creating a note in the content`
                        );
                        finalFieldType = 'text';
                        fieldValue = `<p>Image reference (please make sure spaceId is provided): ${processedValue}</p>`;
                      }
                    }

                    // Create a new content payload
                    fieldPayload = {
                      name: klaviyoBlockName,
                      contentType: 'html',
                      objectType: 'template-universal-content',
                      external_id: externalId,
                      fields: [
                        {
                          fieldId: klaviyoBlockName || contentfulFieldId,
                          fieldType: finalFieldType,
                          value: fieldValue,
                        },
                      ],
                    };
                  }

                  const uploadResult = await uploadContent(fieldPayload, privateKey);
                  uploadResults.push(uploadResult);
                }
              }

              // Return success with all results
              result = {
                success: true,
                message: `Entry synced successfully to Klaviyo with ${uploadResults.length} fields`,
                klaviyoContent: uploadResults,
              };
            } catch (error) {
              console.error(
                'Error syncing entry to Klaviyo:',
                error.response?.status,
                error.response?.statusText,
                error.response?.data || error.message
              );

              return formatResponse(error.response?.status || 500, {
                success: false,
                message: 'Failed to sync entry to Klaviyo: ' + (error.message || 'Unknown error'),
                error: error.response?.data || error.message,
              });
            }
          } else if (action === 'syncFetchStatus') {
            console.log(`Processing fetch sync status action for entry ${data.entryId}`);
            // Simple mock response
            result = {
              entryId: data.entryId,
              needsSync: false,
            };
          } else if (action === 'syncFetchDetailedStatus') {
            console.log(`Processing fetch detailed sync status for entry ${data.entryId}`);
            // Simple mock response
            result = {
              entryId: data.entryId,
              contentTypeId: data.contentTypeId,
              contentTypeName: 'Content Type',
              lastSynced: Date.now(),
              fieldsUpdatedAt: {},
              needsSync: false,
              syncCompleted: true,
            };
          } else if (action === 'syncFetchAllStatuses') {
            console.log(`Processing fetch all sync statuses`);
            // Simple mock response
            result = [
              {
                entryId: '1',
                contentTypeId: 'content-type',
                contentTypeName: 'Content Type',
                lastSynced: Date.now(),
                fieldsUpdatedAt: {},
                needsSync: false,
                syncCompleted: true,
              },
            ];
          } else {
            return formatResponse(400, { error: `Unknown action: ${action}` });
          }

          return formatResponse(200, { success: true, data: result });
        } catch (error) {
          console.error(
            `Error in ${action} operation:`,
            error.response?.status,
            error.response?.statusText,
            error.response?.data || error.message
          );

          const statusCode = error.response?.status || 500;
          return formatResponse(statusCode, {
            error: `${action} operation failed`,
            details: error.response?.data || { message: error.message },
          });
        }
      } catch (error) {
        console.error('Error processing legacy proxy request:', error);
        return formatResponse(400, {
          error: 'Invalid request',
          message: error.message,
        });
      }
    }

    // Default response for unknown endpoints
    return formatResponse(404, { error: 'Endpoint not found', path: event.path });
  } catch (error) {
    console.error('Lambda error:', error);
    return formatResponse(500, { error: 'Internal server error', details: error.message });
  }
};

/**
 * Formats the field array into HTML content
 * @param {Array} fields - Array of field objects with fieldId, fieldType, and value
 * @returns {string} - HTML formatted content
 */
function formatFieldsToHtml(fields) {
  if (!fields || !Array.isArray(fields) || fields.length === 0) {
    return '';
  }

  // CSS styles for our content - only for HTML display
  const css = `
    <style>
      .klaviyo-content {
        font-family: Arial, sans-serif;
        max-width: 100%;
        margin: 0 auto;
        padding: 0;
      }
      .klaviyo-field {
        margin-bottom: 20px;
        padding: 0;
      }
      .klaviyo-field h3 {
        margin: 0 0 8px 0;
        padding: 0;
        font-size: 16px;
        font-weight: bold;
        color: #333;
      }
      .field-content {
        margin: 0;
        padding: 0;
        font-size: 14px;
        line-height: 1.5;
        color: #444;
      }
      .klaviyo-field-richtext .field-content,
      .klaviyo-field-html .field-content {
        /* Allow rich text to use its own formatting */
      }
      .json-object {
        background-color: #f5f5f5;
        border: 1px solid #ddd;
        border-radius: 4px;
        padding: 8px;
        font-family: monospace;
        white-space: pre-wrap;
        overflow-wrap: break-word;
      }
    </style>
  `;

  // Build HTML content from all fields
  const fieldsHtml = fields
    .map((field) => {
      // Skip undefined or null values
      if (field.value === undefined || field.value === null) {
        return '';
      }

      const fieldId = field.fieldId || 'Field';
      const fieldType = (field.fieldType || 'text').toLowerCase();

      // Process the field value based on type
      let processedValue = field.value;

      // Check if we have a localized object
      if (typeof processedValue === 'object' && !Array.isArray(processedValue)) {
        // Check for localized field value structure
        if (processedValue['en-US'] !== undefined || Object.keys(processedValue).length === 1) {
          console.log(`[formatFieldsToHtml] Processing localized field: ${fieldId}`);
          processedValue = extractTextFromLocalizedField(processedValue);
          console.log(`[formatFieldsToHtml] Extracted: "${processedValue}"`);
        }
      }

      let formattedValue;

      // Handle different field types
      if (fieldType === 'richtext' || fieldType === 'html') {
        // For rich text, use value as-is since it should already be HTML
        formattedValue =
          typeof processedValue === 'string'
            ? processedValue
            : typeof processedValue === 'object'
            ? JSON.stringify(processedValue)
            : String(processedValue);
      } else if (
        fieldType === 'json' ||
        (typeof processedValue === 'object' && processedValue !== null)
      ) {
        // Format JSON objects nicely with syntax highlighting
        try {
          const jsonString = formatJsonForDisplay(processedValue);
          formattedValue = `<pre class="json-object">${escapeHtml(jsonString)}</pre>`;
        } catch (e) {
          formattedValue = String(processedValue);
        }
      } else if (
        fieldType === 'location' ||
        (typeof processedValue === 'string' && isLocationField(processedValue))
      ) {
        // Format location fields
        formattedValue = formatLocationField(processedValue);
      } else {
        // For regular text, escape HTML characters
        const rawValue =
          typeof processedValue === 'string'
            ? processedValue
            : typeof processedValue === 'object'
            ? JSON.stringify(processedValue)
            : String(processedValue);

        formattedValue = escapeHtml(rawValue);
      }

      // Return field in HTML format
      return `<div class="klaviyo-field klaviyo-field-${fieldType}">
      <h3>${escapeHtml(fieldId)}</h3>
      <div class="field-content">${formattedValue}</div>
    </div>`;
    })
    .join('\n');

  // Wrap all content with our container and styles
  return `${css}<div class="klaviyo-content">${fieldsHtml}</div>`;
}

/**
 * Escapes HTML special characters to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} - Escaped text
 */
function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Helper function to extract text from localized field values
 * @param {any} value The field value that might be in locale format like {"en-US": "value"}
 * @returns {string} The extracted string value
 */
function extractTextFromLocalizedField(value) {
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
    console.error('Error converting value to string:', e);
    return '';
  }
}

/**
 * Helper function to format JSON objects for display
 * @param {any} value The JSON object to format
 * @returns {string} A formatted string representation of the JSON
 */
function formatJsonForDisplay(value) {
  if (value === null || value === undefined) {
    return '';
  }

  try {
    if (typeof value === 'object') {
      // First check if it's a localized field and extract the text if so
      const localizedText = extractTextFromLocalizedField(value);
      if (localizedText && localizedText !== '[object Object]') {
        return localizedText;
      }

      // Otherwise format it as pretty JSON
      return JSON.stringify(value, null, 2);
    }

    // Return non-objects as strings
    return String(value);
  } catch (error) {
    console.error('Error formatting JSON for display:', error);
    return String(value || '');
  }
}

/**
 * Helper function to check if a string value is a Contentful location field format
 * @param {string} value String to check
 * @returns {boolean} true if it's a location field
 */
function isLocationField(value) {
  if (!value || typeof value !== 'string') return false;

  // Check if it's just a latitude coordinate
  if (/^-?\d+\.\d+$/.test(value)) {
    return true;
  }

  // Check for "lat,lng" format (comma-separated coordinates)
  if (/^-?\d+\.\d+,-?\d+\.\d+$/.test(value)) {
    return true;
  }

  return false;
}

/**
 * Format a location field for display
 * @param {string} value Location field value
 * @returns {string} Formatted location field
 */
function formatLocationField(value) {
  if (!value) return '';

  // First check if the string already contains a comma (lat,lng format)
  if (value.includes(',')) {
    const [lat, lng] = value.split(',');
    return `Latitude: ${lat}, Longitude: ${lng}`;
  }

  // If it's just a number (likely just the latitude), try to warn about incomplete coordinates
  if (/^-?\d+\.\d+$/.test(value)) {
    console.log(`Warning: Incomplete location field value. Only has one coordinate: ${value}`);
    return `Coordinates: ${value} (incomplete location data)`;
  }

  // Return the original value if we can't parse it
  return value;
}

/**
 * Process an image field and upload it to Klaviyo's Images API
 * @param {any} value The image field value
 * @param {string} imageTitle The title for the image
 * @param {string} spaceId The Contentful space ID
 * @param {string} privateKey The Klaviyo API key
 * @returns {Promise<{success: boolean, url?: string, id?: string, error?: string}>}
 */
async function processImageField(value, imageTitle, spaceId, privateKey) {
  console.log('Processing image field for upload to Klaviyo Images API');

  // Extract image URL from asset reference
  let imageUrl = '';
  let assetId = '';
  let processedValue = value; // Make a copy that we can modify

  try {
    console.log(`Raw image value type: ${typeof value}`);
    console.log(`Raw image value: ${JSON.stringify(value)}`);

    // Check if it's a stringified JSON object
    if (typeof value === 'string' && (value.includes('"sys"') || value.includes('\\"sys\\"'))) {
      try {
        // Handle escaped JSON strings
        const cleanValue = value.replace(/\\"/g, '"').replace(/^"/, '').replace(/"$/, '');
        console.log('Cleaning stringified asset reference:', cleanValue);

        // Parse the string into an object
        const parsedValue = JSON.parse(cleanValue);
        console.log('Successfully parsed asset reference:', JSON.stringify(parsedValue));

        // Extract asset ID
        if (parsedValue.sys && parsedValue.sys.id) {
          assetId = parsedValue.sys.id;
          console.log(`Extracted asset ID from parsed string: ${assetId}`);

          // Create a cloned value to avoid modifying the constant
          processedValue = { ...parsedValue };
        }
      } catch (e) {
        console.error('Failed to parse stringified asset reference:', e);

        // Try alternative parsing for deeply nested JSON strings
        try {
          const doubleStringified = JSON.parse(value);
          if (typeof doubleStringified === 'string' && doubleStringified.includes('"sys"')) {
            const parsedInner = JSON.parse(doubleStringified);
            console.log('Parsed double-stringified asset reference:', JSON.stringify(parsedInner));

            if (parsedInner.sys && parsedInner.sys.id) {
              assetId = parsedInner.sys.id;
              console.log(`Extracted asset ID from double-parsed string: ${assetId}`);
              processedValue = { ...parsedInner };
            }
          }
        } catch (innerError) {
          console.error('Failed alternative parsing:', innerError);
        }
      }
    } else if (typeof value === 'object' && value?.sys?.id) {
      // Direct object reference
      assetId = value.sys.id;
      console.log(`Using direct asset ID from object: ${assetId}`);
    }

    // First check if the _resolvedUrl field is present (set by entry-sync-function)
    if (processedValue && processedValue._resolvedUrl) {
      imageUrl = processedValue._resolvedUrl;
      console.log(`Using _resolvedUrl: ${imageUrl}`);
    }
    // Check if we have a normal Contentful asset structure
    else if (
      (processedValue && processedValue.fields?.file?.['en-US']?.url) ||
      (processedValue && processedValue.fields?.file?.url)
    ) {
      const fileUrl = processedValue.fields.file['en-US']?.url || processedValue.fields.file.url;
      // Make sure the URL starts with https:
      imageUrl = fileUrl.startsWith('//') ? `https:${fileUrl}` : fileUrl;
      console.log(`Using URL from fields.file: ${imageUrl}`);
    }

    // Fallback: Construct URL from asset ID if no direct URL found
    if (!imageUrl && assetId) {
      console.log(`Using asset ID for URL construction: ${assetId}`);

      if (!spaceId) {
        console.error('No spaceId available for asset URL construction. Skipping image upload.');
        return { success: false, error: 'No spaceId available for asset URL construction.' };
      }
      // Use Contentful Images API with proper parameters
      const params = [
        'fm=jpg', // Format as JPEG
        'fit=fill', // Resize to fit dimensions
        'w=1200', // Max width 1200px
        'q=80', // 80% quality
      ].join('&');
      imageUrl = `https://images.ctfassets.net/${spaceId}/${assetId}?${params}`;
    }

    console.log(`Final image URL for upload: ${imageUrl}`);

    if (!imageUrl) {
      return { success: false, error: 'Could not extract image URL from asset reference' };
    }

    // Try to upload the image to Klaviyo
    try {
      // Format data for Klaviyo images API
      const imageRequestBody = {
        data: {
          type: 'image',
          attributes: {
            name: imageTitle || 'Contentful Image',
            import_from_url: imageUrl,
          },
        },
      };

      console.log(`Image upload request body:`, JSON.stringify(imageRequestBody));

      const imageResponse = await axios({
        method: 'post',
        url: `${KLAVIYO_API_URL}/images/`,
        data: imageRequestBody,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          revision: KLAVIYO_API_REVISION,
          Authorization: `Klaviyo-API-Key ${privateKey}`,
        },
        timeout: 25000, // 25 seconds timeout
      });

      // Log detailed success information for debugging
      console.log(`Image upload successful - Status: ${imageResponse.status}`);
      console.log(`Response headers: ${JSON.stringify(imageResponse.headers)}`);
      console.log(`Response data: ${JSON.stringify(imageResponse.data)}`);

      if (imageResponse.data && imageResponse.data.data) {
        const imageId = imageResponse.data.data.id;
        const imageKlaviyoUrl = imageResponse.data.data.attributes.url;

        console.log(`Image uploaded successfully. ID: ${imageId}, URL: ${imageKlaviyoUrl}`);
        return {
          success: true,
          url: imageKlaviyoUrl,
          id: imageId,
        };
      }

      return { success: false, error: 'Unexpected image upload response format' };
    } catch (uploadError) {
      console.error(
        'Error uploading image to Klaviyo:',
        uploadError.response?.status,
        uploadError.response?.data || uploadError.message
      );

      // If the first upload attempt failed, try with alternative formats
      if (uploadError.response && uploadError.response.status === 400 && assetId) {
        if (!spaceId) {
          console.error(
            'No spaceId available for asset URL construction (alternative formats). Skipping image upload.'
          );
          return { success: false, error: 'No spaceId available for asset URL construction.' };
        }
        console.log('First upload attempt failed. Trying with alternative image formats...');
        // Try with different formats that Contentful supports
        const alternativeFormats = [
          `https://images.ctfassets.net/${spaceId}/${assetId}?w=1000&h=1000&fit=fill`, // Square image
          `https://images.ctfassets.net/${spaceId}/${assetId}?w=1920&h=1080&fit=fill`, // 16:9 image
          `https://images.ctfassets.net/${spaceId}/${assetId}?fm=jpg&w=1200&q=80`, // JPG format with settings
          `https://images.ctfassets.net/${spaceId}/${assetId}?fm=png&w=1200`, // PNG format
          `https://downloads.ctfassets.net/${spaceId}/${assetId}`, // Download URL (last resort)
        ];
        // Try each alternative format
        for (const alternativeUrl of alternativeFormats) {
          try {
            console.log(`Trying alternative image URL: ${alternativeUrl}`);
            const altImageRequestBody = {
              data: {
                type: 'image',
                attributes: {
                  name: imageTitle || 'Contentful Image',
                  import_from_url: alternativeUrl,
                },
              },
            };
            const altImageResponse = await axios({
              method: 'post',
              url: `${KLAVIYO_API_URL}/images/`,
              data: altImageRequestBody,
              headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                revision: KLAVIYO_API_REVISION,
                Authorization: `Klaviyo-API-Key ${privateKey}`,
              },
              timeout: 25000, // 25 seconds timeout
            });
            if (altImageResponse.data && altImageResponse.data.data) {
              const altImageId = altImageResponse.data.data.id;
              const altImageKlaviyoUrl = altImageResponse.data.data.attributes.url;
              console.log(
                `Alternative image uploaded successfully. ID: ${altImageId}, URL: ${altImageKlaviyoUrl}`
              );
              return {
                success: true,
                url: altImageKlaviyoUrl,
                id: altImageId,
              };
            }
          } catch (altUploadError) {
            console.log(
              `Alternative upload with ${alternativeUrl} failed:`,
              altUploadError.response?.status || altUploadError.message
            );
            // Continue to next format
          }
        }
      }

      // If we get here, all attempts failed
      return { success: false, error: uploadError.message || 'Image upload failed' };
    }
  } catch (e) {
    console.error('Error processing image field:', e);
    return { success: false, error: e.message };
  }
}
