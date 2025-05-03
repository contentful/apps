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
    } else {
      // Otherwise, wrap the data in a proper JSON:API format
      const contentType =
        data.contentType === 'html' ||
        (data.fields && data.fields.some((f) => f.type === 'html' || f.fieldType === 'richText'))
          ? 'html'
          : 'text';

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
                content:
                  data.fields && data.fields.length > 0
                    ? formatFieldsToHtml(data.fields)
                    : data.content || '',
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
const ALLOWED_ENDPOINTS = [
  'template-universal-content',
  'universal-content', // Keep for backward compatibility
  'images',
  'profiles',
  'metrics',
  'lists',
  'campaigns',
  'accounts',
  // Add other valid endpoints your app needs
];

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
            console.log(`Processing sync entry action for entry ${data.entryId}`);
            try {
              // Log the entire data object to see what we're receiving
              console.log('Received syncEntry data:', JSON.stringify(data, null, 2));

              // Instead of fetching from Contentful, use the entry data passed from the frontend
              if (!data.entryData || Object.keys(data.entryData).length === 0) {
                console.error('Missing or empty entry data in request');
                return formatResponse(400, {
                  success: false,
                  message:
                    'Missing or empty entry data in request. Please check that your entry has content and the frontend is properly collecting the data.',
                  data: null,
                });
              }

              const entry = data.entryData;
              console.log(`Using provided entry data:`, JSON.stringify(entry, null, 2));

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
              const baseTitle = extractTitleFromEntry(entry, contentType);

              // Array to store all upload results
              const uploadResults = [];

              // If no field mappings, create a generic placeholder entry
              if (!fieldMappings || fieldMappings.length === 0) {
                console.warn('No field mappings provided, creating a placeholder entry');

                // Create a generic payload with placeholder content
                const fallbackContent =
                  entry._note || entry._error || 'No content available for this entry';
                const externalId = `${data.entryId}-default`;

                // Check if this content already exists
                console.log(
                  `Checking if fallback content already exists with external ID ${externalId}`
                );
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
                    `Processing field mapping as separate entry: ${contentfulFieldId} -> ${klaviyoBlockName} (${fieldType})`
                  );

                  // Skip if field doesn't exist in entry
                  if (!entry[contentfulFieldId]) {
                    console.log(`Field ${contentfulFieldId} not found in entry, skipping`);
                    continue;
                  }

                  const value = entry[contentfulFieldId];
                  let processedValue = value;
                  let processedFieldType = fieldType;

                  // Process value based on field type
                  if (value !== null && value !== undefined) {
                    // Determine field type if not specified
                    if (!processedFieldType) {
                      if (value && typeof value === 'object' && value.nodeType === 'document') {
                        processedFieldType = 'richText';
                      } else if (
                        value &&
                        typeof value === 'object' &&
                        value.sys &&
                        value.sys.type === 'Link' &&
                        value.sys.linkType === 'Asset'
                      ) {
                        processedFieldType = 'image';
                      } else {
                        processedFieldType = 'text';
                      }
                    }

                    // Format object values
                    if (
                      typeof value === 'object' &&
                      processedFieldType !== 'richText' &&
                      processedFieldType !== 'image'
                    ) {
                      processedValue = JSON.stringify(value);
                    }

                    // Create a separate klaviyoPayload for this field
                    const fieldTitle = `${baseTitle} - ${klaviyoBlockName}`;
                    const externalId = `${data.entryId}-${contentfulFieldId}`; // Unique external_id for each field

                    // First check if this content already exists in Klaviyo
                    console.log(
                      `Checking if content already exists for field ${contentfulFieldId} with external ID ${externalId}`
                    );
                    const existingContent = await findContentByExternalId(externalId, privateKey);

                    let fieldPayload;

                    if (existingContent) {
                      console.log(
                        `Found existing content for field ${contentfulFieldId}, id: ${existingContent.id}, name: "${existingContent.attributes?.name}"`
                      );

                      // Create an update payload with the existing ID
                      fieldPayload = {
                        id: existingContent.id,
                        name: fieldTitle,
                        contentType: 'html',
                        objectType: 'template-universal-content',
                        external_id: externalId,
                        fields: [
                          {
                            fieldId: klaviyoBlockName,
                            fieldType: processedFieldType,
                            value: processedValue,
                          },
                        ],
                      };
                      console.log(
                        `Created update payload with ID: ${fieldPayload.id} for field ${contentfulFieldId}`
                      );

                      // Add note that this is an update operation for this field
                      console.log(
                        `Will update existing Klaviyo content for field ${contentfulFieldId} instead of creating new content`
                      );
                    } else {
                      // Create a new content payload
                      fieldPayload = {
                        name: fieldTitle,
                        contentType: 'html',
                        objectType: 'template-universal-content',
                        external_id: externalId,
                        fields: [
                          {
                            fieldId: klaviyoBlockName,
                            fieldType: processedFieldType,
                            value: processedValue,
                          },
                        ],
                      };
                    }

                    console.log(
                      `Prepared Klaviyo payload for field ${contentfulFieldId}:`,
                      JSON.stringify(fieldPayload, null, 2)
                    );

                    try {
                      // Upload this field to Klaviyo
                      const fieldUploadResult = await uploadContent(fieldPayload, privateKey);
                      console.log(
                        `Field ${contentfulFieldId} uploaded to Klaviyo:`,
                        JSON.stringify(fieldUploadResult, null, 2)
                      );
                      uploadResults.push({
                        field: contentfulFieldId,
                        klaviyoField: klaviyoBlockName,
                        result: fieldUploadResult,
                      });
                    } catch (fieldError) {
                      console.error(
                        `Error uploading field ${contentfulFieldId} to Klaviyo:`,
                        fieldError.response?.status,
                        fieldError.response?.statusText,
                        fieldError.response?.data || fieldError.message
                      );

                      uploadResults.push({
                        field: contentfulFieldId,
                        klaviyoField: klaviyoBlockName,
                        error: fieldError.response?.data || fieldError.message,
                      });
                    }
                  }
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

      let formattedValue;

      // Handle different field types
      if (fieldType === 'richtext' || fieldType === 'html') {
        // For rich text, use value as-is since it should already be HTML
        formattedValue =
          typeof field.value === 'string'
            ? field.value
            : typeof field.value === 'object'
            ? JSON.stringify(field.value)
            : String(field.value);
      } else {
        // For regular text, escape HTML characters
        const rawValue =
          typeof field.value === 'string'
            ? field.value
            : typeof field.value === 'object'
            ? JSON.stringify(field.value)
            : String(field.value);

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
