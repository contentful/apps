export interface BrandInsights {
  brandVoice: string;
  toneDescription: string;
  writingStyle: string;
  keyThemes: string[];
  messagingPillars: string[];
  doAndDonts: {
    dos: string[];
    donts: string[];
  };
  contentPatterns: string;
  visualStyleNotes: string;
}

export interface ContentData {
  contentTypes: any[];
  entries: any[];
  assets: any[];
}

/**
 * Analyzes content from a Contentful space using GitHub Models to generate brand insights
 */
export async function analyzeBrandContent(
  contentData: ContentData,
  githubToken: string
): Promise<BrandInsights> {
  // Prepare a comprehensive content summary for analysis
  const contentSummary = prepareContentSummary(contentData);

  const prompt = `You are a brand strategist analyzing content from a content management system. Based on the following content, generate comprehensive brand guidelines.

${contentSummary}

Please analyze this content and provide:

1. **Brand Voice**: Describe the overall brand voice (e.g., professional, friendly, authoritative, playful)
2. **Tone Description**: Explain the tone used across content (formal, casual, empathetic, etc.)
3. **Writing Style**: Describe the writing style, sentence structure, and language patterns
4. **Key Themes**: List 3-5 main themes or topics that appear frequently
5. **Messaging Pillars**: Identify 3-5 core messaging pillars or value propositions
6. **Do's and Don'ts**: Create practical do's and don'ts for content creation
7. **Content Patterns**: Describe any patterns in how content is structured or presented
8. **Visual Style Notes**: Based on asset naming and structure, infer visual style preferences

Provide your response in a structured format that can be used to create brand guidelines.`;

  try {
    const response = await fetch('https://models.github.ai/inference/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${githubToken}`,
        'Accept': 'application/vnd.github+json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'You are an expert brand strategist who creates comprehensive brand guidelines based on existing content analysis.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('GitHub Models API error:', errorText);
      throw new Error(`GitHub Models API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const analysis = data.choices[0].message.content || '';

    // Parse the AI response into structured insights
    return parseAIResponse(analysis);
  } catch (error) {
    console.error('Error calling GitHub Models API:', error);
    throw new Error('Failed to analyze content with AI. Please check your GitHub token and try again.');
  }
}

/**
 * Prepares a comprehensive summary of content for AI analysis
 */
function prepareContentSummary(data: ContentData): string {
  let summary = `Content Analysis:\n\n`;

  // Content Types Summary
  summary += `CONTENT TYPES (${data.contentTypes.length} total):\n`;
  data.contentTypes.forEach((ct) => {
    summary += `- ${ct.name} (${ct.sys.id})\n`;
    if (ct.description) {
      summary += `  Description: ${ct.description}\n`;
    }
  });
  summary += '\n';

  // Sample Entry Content
  summary += `SAMPLE CONTENT (from ${data.entries.length} total entries):\n\n`;
  
  // Get a diverse sample of entries (up to 30)
  const sampleEntries = data.entries.slice(0, 30);
  const contentSamples: string[] = [];

  sampleEntries.forEach((entry, idx) => {
    const fields = entry.fields || {};
    const contentType = entry.sys.contentType?.sys.id || 'Unknown';
    
    let entryText = `Entry ${idx + 1} (${contentType}):\n`;
    
    // Extract text content from various field types
    for (const [fieldName, fieldValue] of Object.entries(fields)) {
      const localeValue = (fieldValue as any)?.['en-US'];
      
      if (typeof localeValue === 'string') {
        // Plain text or short text
        entryText += `  ${fieldName}: ${localeValue.substring(0, 200)}${localeValue.length > 200 ? '...' : ''}\n`;
      } else if (localeValue && typeof localeValue === 'object' && 'content' in localeValue) {
        // Rich text field
        const textContent = extractTextFromRichText(localeValue);
        if (textContent) {
          entryText += `  ${fieldName}: ${textContent.substring(0, 200)}${textContent.length > 200 ? '...' : ''}\n`;
        }
      }
    }
    
    contentSamples.push(entryText);
  });

  summary += contentSamples.join('\n');
  summary += '\n';

  // Asset Information
  summary += `ASSETS (${data.assets.length} total):\n`;
  const sampleAssets = data.assets.slice(0, 20);
  sampleAssets.forEach((asset) => {
    const title = asset.fields?.title?.['en-US'] || 'Untitled';
    const description = asset.fields?.description?.['en-US'] || '';
    const contentType = asset.fields?.file?.['en-US']?.contentType || '';
    summary += `- ${title} (${contentType})${description ? `: ${description}` : ''}\n`;
  });

  return summary;
}

/**
 * Extracts plain text from Contentful rich text structure
 */
function extractTextFromRichText(richText: any): string {
  if (!richText || !richText.content) return '';
  
  let text = '';
  
  function traverse(node: any) {
    if (node.nodeType === 'text') {
      text += node.value + ' ';
    }
    if (node.content && Array.isArray(node.content)) {
      node.content.forEach(traverse);
    }
  }
  
  traverse(richText);
  return text.trim();
}

/**
 * Parses the AI response into structured brand insights
 */
function parseAIResponse(response: string): BrandInsights {
  // This is a simplified parser - in production, you might use more sophisticated parsing
  const insights: BrandInsights = {
    brandVoice: '',
    toneDescription: '',
    writingStyle: '',
    keyThemes: [],
    messagingPillars: [],
    doAndDonts: { dos: [], donts: [] },
    contentPatterns: '',
    visualStyleNotes: '',
  };

  // Extract sections using regex patterns
  const sections = {
    brandVoice: /brand voice[:\s]*([^\n]+(?:\n(?![*#\d]).*)*)/i,
    tone: /tone description[:\s]*([^\n]+(?:\n(?![*#\d]).*)*)/i,
    writingStyle: /writing style[:\s]*([^\n]+(?:\n(?![*#\d]).*)*)/i,
    keyThemes: /key themes[:\s]*([\s\S]*?)(?=\n\n|\n[*#\d]|messaging pillars|$)/i,
    messagingPillars: /messaging pillars[:\s]*([\s\S]*?)(?=\n\n|\n[*#\d]|do'?s and don'?ts|$)/i,
    dosDonts: /do'?s and don'?ts[:\s]*([\s\S]*?)(?=\n\n[A-Z]|content patterns|$)/i,
    contentPatterns: /content patterns[:\s]*([^\n]+(?:\n(?![*#\d]).*)*)/i,
    visualStyle: /visual style notes[:\s]*([^\n]+(?:\n(?![*#\d]).*)*)/i,
  };

  // Extract brand voice
  const voiceMatch = response.match(sections.brandVoice);
  if (voiceMatch) insights.brandVoice = voiceMatch[1].trim();

  // Extract tone
  const toneMatch = response.match(sections.tone);
  if (toneMatch) insights.toneDescription = toneMatch[1].trim();

  // Extract writing style
  const styleMatch = response.match(sections.writingStyle);
  if (styleMatch) insights.writingStyle = styleMatch[1].trim();

  // Extract key themes (list items)
  const themesMatch = response.match(sections.keyThemes);
  if (themesMatch) {
    insights.keyThemes = extractListItems(themesMatch[1]);
  }

  // Extract messaging pillars (list items)
  const pillarsMatch = response.match(sections.messagingPillars);
  if (pillarsMatch) {
    insights.messagingPillars = extractListItems(pillarsMatch[1]);
  }

  // Extract do's and don'ts
  const dosDontsMatch = response.match(sections.dosDonts);
  if (dosDontsMatch) {
    const dosDontsText = dosDontsMatch[1];
    const dosMatch = dosDontsText.match(/do'?s?[:\s]*([\s\S]*?)(?=don'?ts?|$)/i);
    const dontsMatch = dosDontsText.match(/don'?ts?[:\s]*([\s\S]*?)$/i);
    
    if (dosMatch) insights.doAndDonts.dos = extractListItems(dosMatch[1]);
    if (dontsMatch) insights.doAndDonts.donts = extractListItems(dontsMatch[1]);
  }

  // Extract content patterns
  const patternsMatch = response.match(sections.contentPatterns);
  if (patternsMatch) insights.contentPatterns = patternsMatch[1].trim();

  // Extract visual style notes
  const visualMatch = response.match(sections.visualStyle);
  if (visualMatch) insights.visualStyleNotes = visualMatch[1].trim();

  // If parsing failed, put the entire response in brandVoice as fallback
  if (!insights.brandVoice && !insights.toneDescription) {
    insights.brandVoice = response;
  }

  return insights;
}

/**
 * Extracts list items from text (handles bullets, numbers, etc.)
 */
function extractListItems(text: string): string[] {
  const items: string[] = [];
  const lines = text.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    // Match lines starting with bullets, numbers, or dashes
    const match = trimmed.match(/^[-*•\d.]+\s+(.+)/);
    if (match) {
      items.push(match[1].trim());
    } else if (trimmed && !trimmed.match(/^[A-Z][a-z]+:/)) {
      // Include non-empty lines that aren't section headers
      items.push(trimmed);
    }
  }
  
  return items.filter(item => item.length > 0);
}

