import type { HubSpotRequestContext, HubSpotResponse, ContentBlock } from '../types';

export async function getEmails(context: HubSpotRequestContext): Promise<HubSpotResponse> {
  console.log('GETTING FUNCTION HUBSPOT EMAIL');

  const { apiKey } = context;

  const response = await fetch('https://api.hubapi.com/marketing/v3/emails/', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`HubSpot API error: ${response.status} ${response.statusText}`);
  }

  const json = await response.json();
  console.log('HubSpot emails response:', json);

  // Process each email to extract content blocks
  if (json.results && Array.isArray(json.results)) {
    json.results = json.results.map((email: any) => {
      // Extract content blocks from widgets
      const contentBlocks: ContentBlock[] = [];

      if (email.content?.widgets) {
        Object.entries(email.content.widgets).forEach(([widgetId, widget]: [string, any]) => {
          if (widget.body?.html && widget.body.html.trim()) {
            // Extract text content for preview
            const textContent = widget.body.html
              .replace(/<[^>]*>/g, '') // Remove HTML tags
              .replace(/\s+/g, ' ') // Normalize whitespace
              .trim();

            contentBlocks.push({
              widgetId,
              type: widget.type || 'unknown',
              order: widget.order || 0,
              name: widget.name || widget.id || widgetId,
              html: widget.body.html,
              textContent,
              textPreview: textContent.substring(0, 100) + (textContent.length > 100 ? '...' : ''),
              characterCount: textContent.length,
            });
          }
        });
      }

      // Sort content blocks by order
      contentBlocks.sort((a, b) => (a.order || 0) - (b.order || 0));

      // Add content blocks to email object
      return {
        ...email,
        contentBlocks,
        contentBlocksCount: contentBlocks.length,
      };
    });
  }

  return json;
}
