import type { HubSpotRequestContext, HubSpotResponse } from '../types';
import { replaceTextNodesInHtml } from '../utils';

export async function patchEmail(context: HubSpotRequestContext): Promise<HubSpotResponse> {
  const { apiKey, event } = context;
  const { emailId, name, subject, fromName, replyTo, contentBlocks } = event.body;

  console.log('PATCHING FUNCTION HUBSPOT EMAIL', emailId, {
    name,
    subject,
    fromName,
    replyTo,
    contentBlocks: contentBlocks ? 'provided' : 'not provided',
  });

  if (!emailId) {
    return { response: { error: 'Missing emailId for PATCH request' } };
  }

  // First, get the current email to preserve its structure
  const getResponse = await fetch(`https://api.hubapi.com/marketing/v3/emails/${emailId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
  });

  if (!getResponse.ok) {
    const errorText = await getResponse.text();
    console.error('HubSpot GET error:', getResponse.status, errorText);
    throw new Error(`HubSpot API error: ${getResponse.status} ${getResponse.statusText}`);
  }

  const currentEmail = await getResponse.json();

  const patchData: any = {
    name,
    subject,
    fromName,
    replyTo,
  };

  // Handle content block updates
  if (contentBlocks) {
    try {
      const contentBlockUpdates = JSON.parse(String(contentBlocks));

      // Clone the current email content to preserve structure
      const updatedContent = JSON.parse(JSON.stringify(currentEmail.content));

      // Update widgets by replacing individual text nodes
      if (updatedContent.widgets) {
        Object.keys(contentBlockUpdates).forEach((widgetId) => {
          if (updatedContent.widgets[widgetId] && updatedContent.widgets[widgetId].body) {
            const blockUpdate = contentBlockUpdates[widgetId];

            if (blockUpdate.textNodes && blockUpdate.originalHtml) {
              // Replace individual text nodes in the original HTML
              const updatedHtml = replaceTextNodesInHtml(
                blockUpdate.originalHtml,
                blockUpdate.textNodes
              );
              updatedContent.widgets[widgetId].body.html = updatedHtml;
            } else {
              console.warn(`Invalid content block update for widget ${widgetId}`);
            }
          } else {
            console.warn(`Widget ${widgetId} not found in email content`);
          }
        });
      }

      // Add the updated content to the patch data
      patchData.content = updatedContent;
    } catch (error) {
      console.error('Error parsing content blocks:', error);
      return { response: { error: 'Invalid content blocks format' } };
    }
  }

  const response = await fetch(`https://api.hubapi.com/marketing/v3/emails/${emailId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(patchData),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('HubSpot PATCH error:', response.status, errorText);
    throw new Error(`HubSpot API error: ${response.status} ${response.statusText}`);
  }

  const json = await response.json();

  return {
    response: {
      body: JSON.stringify(json),
    },
  };
}
