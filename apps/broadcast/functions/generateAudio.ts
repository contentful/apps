import type {
  FunctionEventContext,
  FunctionEventHandler,
  FunctionTypeEnum,
  AppActionRequest,
} from '@contentful/node-apps-toolkit';
import { getElevenLabsApiKey, initContentfulManagementClient } from './common';

const ELEVENLABS_TTS_URL = 'https://api.elevenlabs.io/v1/text-to-speech';
const TTS_MODEL_ID = 'eleven_multilingual_v2';

export interface GenerateAudioParameters {
  entryId: string;
  fieldId: string;
  locale: string;
  voiceId: string;
}

interface GenerateAudioResponse {
  assetId: string;
  success: boolean;
  message?: string;
}

/**
 * Extract plain text from a field value.
 * Handles Symbol, Text, and RichText field types.
 */
function extractTextFromField(fieldValue: unknown): string {
  if (typeof fieldValue === 'string') {
    return fieldValue;
  }

  // Handle RichText - extract plain text from document
  if (
    fieldValue &&
    typeof fieldValue === 'object' &&
    'nodeType' in fieldValue &&
    (fieldValue as { nodeType: string }).nodeType === 'document'
  ) {
    return extractTextFromRichText(fieldValue as RichTextDocument);
  }

  throw new Error('Unsupported field type. Only Symbol, Text, and RichText fields are supported.');
}

interface RichTextDocument {
  nodeType: string;
  content: RichTextNode[];
}

interface RichTextNode {
  nodeType: string;
  value?: string;
  content?: RichTextNode[];
}

/**
 * Recursively extract plain text from a RichText document.
 */
function extractTextFromRichText(doc: RichTextDocument): string {
  const extractFromNode = (node: RichTextNode): string => {
    if (node.nodeType === 'text' && node.value) {
      return node.value;
    }
    if (node.content && Array.isArray(node.content)) {
      return node.content.map(extractFromNode).join('');
    }
    return '';
  };

  if (doc.content && Array.isArray(doc.content)) {
    return doc.content.map(extractFromNode).join('\n\n');
  }
  return '';
}

export const handler: FunctionEventHandler<
  FunctionTypeEnum.AppActionCall,
  GenerateAudioParameters
> = async (
  event: AppActionRequest<'Custom', GenerateAudioParameters>,
  context: FunctionEventContext
): Promise<GenerateAudioResponse> => {
  const { entryId, fieldId, locale, voiceId } = event.body;
  const apiKey = getElevenLabsApiKey(context);
  const cma = initContentfulManagementClient(context);

  try {
    // 1. Fetch the entry and extract text
    const entry = await cma.entry.get({ entryId });

    if (!entry.fields[fieldId]) {
      throw new Error(`Field "${fieldId}" not found in entry.`);
    }

    const fieldValue = entry.fields[fieldId][locale];
    if (!fieldValue) {
      throw new Error(`Field "${fieldId}" has no value for locale "${locale}".`);
    }

    const text = extractTextFromField(fieldValue);
    if (!text.trim()) {
      throw new Error('Field is empty. Cannot generate audio from empty text.');
    }

    // 2. Call ElevenLabs TTS API
    const ttsResponse = await fetch(`${ELEVENLABS_TTS_URL}/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg',
      },
      body: JSON.stringify({
        text,
        model_id: TTS_MODEL_ID,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    });

    if (!ttsResponse.ok) {
      if (ttsResponse.status === 401) {
        throw new Error('Invalid ElevenLabs API key. Please check your configuration.');
      }
      if (ttsResponse.status === 429) {
        throw new Error('ElevenLabs API quota exceeded. Please try again later.');
      }
      const errorText = await ttsResponse.text();
      throw new Error(`ElevenLabs TTS failed: ${errorText}`);
    }

    // 3. Get the audio data as ArrayBuffer and upload to Contentful
    const audioBuffer = await ttsResponse.arrayBuffer();

    // 4. Create upload in Contentful
    const upload = await cma.upload.create({ spaceId: context.spaceId }, { file: audioBuffer });

    // 5. Generate a title for the asset
    const entryTitle = entry.fields[Object.keys(entry.fields)[0]]?.[locale] || `Entry ${entryId}`;
    const assetTitle =
      typeof entryTitle === 'string' ? `Audio - ${entryTitle}` : `Audio - ${entryId}`;

    // 6. Create the asset
    const asset = await cma.asset.create(
      {},
      {
        fields: {
          title: {
            [locale]: assetTitle,
          },
          description: {
            [locale]: `Generated audio from field "${fieldId}" using ElevenLabs TTS.`,
          },
          file: {
            [locale]: {
              contentType: 'audio/mpeg',
              fileName: `${entryId}-${fieldId}-audio.mp3`,
              uploadFrom: {
                sys: {
                  type: 'Link',
                  linkType: 'Upload',
                  id: upload.sys.id,
                },
              },
            },
          },
        },
      }
    );

    // 7. Process the asset for the locale
    await cma.asset.processForLocale({}, asset, locale);

    return {
      assetId: asset.sys.id,
      success: true,
      message: 'Audio generated successfully. Asset may still be processing.',
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return {
      assetId: '',
      success: false,
      message: errorMessage,
    };
  }
};
