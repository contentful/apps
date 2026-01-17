import {
  AppActionRequest,
  AppActionResponse,
  FunctionEventContext,
  FunctionEventHandler,
  FunctionTypeEnum,
} from '@contentful/node-apps-toolkit';
import { createClient, PlainClientAPI } from 'contentful-management';
import { getMockAudioBuffer } from '../lib/mock-audio';

type GenerateAudioRequest = {
  text: string;
  entryId: string;
  spaceId: string;
  envId: string;
  voiceId: string;
};

type AppInstallationParameters = {
  elevenLabsApiKey?: string;
  useMockAi?: boolean | string;
};

const DEFAULT_LOCALE = 'en-US';

const fetchElevenLabsAudio = async (
  voiceId: string,
  text: string,
  apiKey: string
): Promise<ArrayBuffer> => {
  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      Accept: 'audio/mpeg',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `ElevenLabs request failed: ${response.status} ${response.statusText} - ${errorText}`
    );
  }

  return response.arrayBuffer();
};

function initContentfulManagementClient(
  context: FunctionEventContext<AppInstallationParameters>
): PlainClientAPI {
  if (context.cma) {
    return context.cma;
  }

  if (!context.cmaClientOptions) {
    throw new Error(
      'Contentful Management API client options are only provided for certain function types. To learn more about using the CMA within functions, see https://www.contentful.com/developers/docs/extensibility/app-framework/functions/#using-the-cma.'
    );
  }

  return createClient(context.cmaClientOptions, {
    type: 'plain',
    defaults: {
      spaceId: context.spaceId,
      environmentId: context.environmentId,
    },
  });
}

export const handler: FunctionEventHandler<
  FunctionTypeEnum.AppActionCall,
  AppInstallationParameters
> = async (
  event: AppActionRequest<'Custom', GenerateAudioRequest>,
  context: FunctionEventContext<AppInstallationParameters>
): Promise<AppActionResponse> => {
  try {
    const { text, entryId, spaceId, envId, voiceId } = event.body;

    const effectiveSpaceId = spaceId || context.spaceId;
    const effectiveEnvironmentId = envId || context.environmentId;

    if (!text || !entryId || !effectiveSpaceId || !effectiveEnvironmentId || !voiceId) {
      return {
        ok: false,
        errors: [
          {
            message: 'Missing required parameters for audio generation',
            type: 'ValidationError',
          },
        ],
      };
    }

    const appInstallationParameters = context.appInstallationParameters ?? {};

    // Handle both boolean and string values for useMockAi
    const useMockAi =
      appInstallationParameters.useMockAi === true ||
      String(appInstallationParameters.useMockAi ?? '').toLowerCase() === 'true';
    const elevenLabsApiKey = appInstallationParameters.elevenLabsApiKey;

    if (!useMockAi && !elevenLabsApiKey) {
      return {
        ok: false,
        errors: [
          {
            message: 'Missing ElevenLabs API key in app installation parameters',
            type: 'ConfigurationError',
          },
        ],
      };
    }

    console.log('generate-audio:start', {
      spaceId: effectiveSpaceId,
      environmentId: effectiveEnvironmentId,
      hasCma: Boolean(context.cma),
      hasCmaClientOptions: Boolean(context.cmaClientOptions),
      useMockAi,
    });

    const audioBuffer = useMockAi
      ? await getMockAudioBuffer()
      : await fetchElevenLabsAudio(voiceId, text, elevenLabsApiKey as string);

    console.log('generate-audio:buffer-size', { size: audioBuffer.byteLength });

    const cma = initContentfulManagementClient(context);

    // Contentful upload.create accepts ArrayBuffer, Buffer, or Stream
    // Pass ArrayBuffer directly - it's explicitly supported and may work better in Functions environment
    const upload = await cma.upload.create(
      {
        spaceId: effectiveSpaceId,
        environmentId: effectiveEnvironmentId,
      },
      { file: audioBuffer }
    );

    console.log('generate-audio:upload', {
      uploadId: upload.sys.id,
      uploadSize: (upload as any).file?.size || (upload as any).size || 'unknown',
      uploadKeys: Object.keys(upload),
    });

    const asset = await cma.asset.create(
      {
        spaceId: effectiveSpaceId,
        environmentId: effectiveEnvironmentId,
      },
      {
        fields: {
          title: {
            [DEFAULT_LOCALE]: `Voice for entry ${entryId}`,
          },
          file: {
            [DEFAULT_LOCALE]: {
              contentType: 'audio/mpeg',
              fileName: `voice-${entryId}.mp3`,
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

    const processedAsset = await cma.asset.processForAllLocales(
      {
        spaceId: effectiveSpaceId,
        environmentId: effectiveEnvironmentId,
      },
      asset
    );

    console.log('generate-audio:processed', { assetId: processedAsset.sys.id });

    const publishedAsset = await cma.asset.publish(
      {
        spaceId: effectiveSpaceId,
        environmentId: effectiveEnvironmentId,
        assetId: processedAsset.sys.id,
      },
      processedAsset
    );

    console.log('generate-audio:published', { assetId: publishedAsset.sys.id });

    const assetUrl = publishedAsset.fields.file?.[DEFAULT_LOCALE]?.url;
    if (!assetUrl) {
      return {
        ok: false,
        errors: [
          {
            message: 'Missing asset URL after publishing',
            type: 'AssetError',
          },
        ],
      };
    }

    return {
      ok: true,
      data: {
        status: 'success',
        assetId: publishedAsset.sys.id,
        url: assetUrl.startsWith('//') ? `https:${assetUrl}` : assetUrl,
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    const errorDetails = error instanceof Error ? { message, stack: error.stack } : { message };
    console.error('generate-audio:error', errorDetails);
    return {
      ok: false,
      errors: [
        {
          message,
          type: 'UnhandledError',
        },
      ],
    };
  }
};
