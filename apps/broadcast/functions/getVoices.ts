import type {
  FunctionEventContext,
  FunctionEventHandler,
  FunctionTypeEnum,
  AppActionRequest,
} from '@contentful/node-apps-toolkit';
import { getElevenLabsApiKey, ElevenLabsVoice, Voice } from './common';

const ELEVENLABS_VOICES_URL = 'https://api.elevenlabs.io/v1/voices';

interface GetVoicesResponse {
  voices: Voice[];
}

interface ElevenLabsVoicesResponse {
  voices: ElevenLabsVoice[];
}

export const handler: FunctionEventHandler<FunctionTypeEnum.AppActionCall, object> = async (
  _event: AppActionRequest<'Custom', object>,
  context: FunctionEventContext
): Promise<GetVoicesResponse> => {
  const apiKey = getElevenLabsApiKey(context);

  try {
    const response = await fetch(ELEVENLABS_VOICES_URL, {
      method: 'GET',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Invalid ElevenLabs API key. Please check your configuration.');
      }
      if (response.status === 429) {
        throw new Error('ElevenLabs API quota exceeded. Please try again later.');
      }
      throw new Error(`Failed to fetch voices: ${response.statusText}`);
    }

    const data: ElevenLabsVoicesResponse = await response.json();

    // Transform to simplified Voice objects for frontend
    const voices: Voice[] = data.voices.map((voice) => ({
      voiceId: voice.voice_id,
      name: voice.name,
      category: voice.category,
      previewUrl: voice.preview_url,
    }));

    return { voices };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Unknown error occurred while fetching voices');
  }
};
