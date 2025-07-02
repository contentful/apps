import { FieldExtensionSDK } from '@contentful/app-sdk';
import { ModalData } from '../components/AssetConfiguration/MuxAssetConfigurationModal';
import ApiClient from './apiClient';
import { InstallationParams, ResolutionType, AddByURLConfig } from './types';

export interface AssetSettings {
  passthrough?: string;
  playback_policies: string[];
  video_quality: string;
  meta?: {
    title?: string;
    creator_id?: string;
    external_id?: string;
  };
  static_renditions?: Array<{ resolution: string }>;
  inputs: Array<{
    url?: string;
    generated_subtitles?: Array<{
      language_code: string;
      name: string;
    }>;
    type?: string;
    text_type?: string;
    closed_captions?: boolean;
    language_code?: string;
    name?: string;
  }>;
}

interface AssetInput {
  url: string;
  generated_subtitles?: Array<{
    language_code: string;
    name: string;
  }>;
  type?: string;
  text_type?: string;
  closed_captions?: boolean;
  language_code?: string;
  name?: string;
}

function buildAssetSettings(options: ModalData): AssetSettings {
  const settings: AssetSettings = {
    playback_policies: options.playbackPolicies,
    video_quality: options.videoQuality,
    inputs: [],
  };

  // Metadata case
  if (options.metadataConfig.standardMetadata) {
    const { title, creatorId, externalId } = options.metadataConfig.standardMetadata;
    if (title || creatorId || externalId) {
      settings.meta = {};
      if (title) settings.meta.title = title;
      if (creatorId) settings.meta.creator_id = creatorId;
      if (externalId) settings.meta.external_id = externalId;
    }
  }
  // Custom metadata
  if (options.metadataConfig.customMetadata) {
    settings.passthrough = options.metadataConfig.customMetadata;
  }

  // Captions case
  if (options.captionsConfig.captionsType !== 'off') {
    if (options.captionsConfig.captionsType === 'auto') {
      settings.inputs.push({
        generated_subtitles: [
          {
            language_code: options.captionsConfig.languageCode,
            name: options.captionsConfig.languageName,
          },
        ],
      });
    } else {
      settings.inputs.push({
        url: options.captionsConfig.url,
        type: 'text',
        text_type: 'subtitles',
        closed_captions: options.captionsConfig.closedCaptions,
        language_code: options.captionsConfig.languageCode,
        name: options.captionsConfig.languageName,
      });
    }
  }

  // MP4 renditions case
  if (options.mp4Config.highestResolution || options.mp4Config.audioOnly) {
    settings.static_renditions = [];
    if (options.mp4Config.audioOnly) {
      settings.static_renditions.push({
        resolution: 'audio-only',
      });
    }
    if (options.mp4Config.highestResolution) {
      settings.static_renditions.push({
        resolution: 'highest',
      });
    }
  }

  return settings;
}

export async function addByURL({
  apiClient,
  sdk,
  remoteURL,
  options,
  responseCheck,
  setAssetError,
  pollForAssetDetails,
}: AddByURLConfig) {
  const settings = buildAssetSettings(options);

  const requestBody = {
    ...settings,
    inputs: [
      {
        url: remoteURL,
      } as AssetInput,
    ],
  };

  if (settings.inputs.length > 0) {
    if (settings.inputs[0].generated_subtitles) {
      requestBody.inputs[0] = {
        ...requestBody.inputs[0],
        ...settings.inputs[0],
      };
    } else {
      requestBody.inputs.push({
        ...settings.inputs[0],
        url: settings.inputs[0].url || '',
      } as AssetInput);
    }
  }

  const result = await apiClient.post('/video/v1/assets', JSON.stringify(requestBody));

  if (!(await responseCheck(result))) {
    return;
  }

  const muxUpload = await result.json();

  if ('error' in muxUpload) {
    setAssetError(muxUpload.error.messages[0]);
    return;
  }

  if (muxUpload.data.status === 'errored') {
    setAssetError(muxUpload.data.errors.messages[0]);
    return;
  }

  await sdk.field.setValue({
    assetId: muxUpload.data.id,
  });
  await pollForAssetDetails();
}

export async function getUploadUrl(
  apiClient: ApiClient,
  sdk: FieldExtensionSDK,
  options: ModalData,
  responseCheck: (res: Response) => boolean | Promise<boolean>
) {
  const { muxEnableAudioNormalize } = sdk.parameters.installation as InstallationParams;
  const settings = buildAssetSettings(options);

  const requestBody = {
    cors_origin: window.location.origin,
    new_asset_settings: {
      ...settings,
      normalize_audio: muxEnableAudioNormalize || false,
    },
  };

  const res = await apiClient.post('/video/v1/uploads', JSON.stringify(requestBody));

  if (!(await responseCheck(res))) {
    return;
  }

  const { data: muxUpload } = await res.json();

  await sdk.field.setValue({
    uploadId: muxUpload.id,
  });

  return muxUpload.url;
}

export async function deleteStaticRendition(
  apiClient: ApiClient,
  assetId: string,
  staticRenditionId: string
) {
  return await apiClient.del(`/video/v1/assets/${assetId}/static-renditions/${staticRenditionId}`);
}

export async function createStaticRendition(
  apiClient: ApiClient,
  assetId: string,
  type: ResolutionType
) {
  return await apiClient.post(
    `/video/v1/assets/${assetId}/static-renditions`,
    JSON.stringify({ resolution: type })
  );
}

export async function updateAsset(apiClient: ApiClient, assetId: string, settings: AssetSettings) {
  const requestBody: Partial<AssetSettings> = {
    meta: settings.meta || {
      title: '',
      creator_id: '',
      external_id: '',
    },
    passthrough: settings.passthrough || '',
  };

  return await apiClient.patch(`/video/v1/assets/${assetId}`, JSON.stringify(requestBody));
}

export async function uploadTrack(
  apiClient: ApiClient,
  assetId: string,
  options: {
    url: string;
    name: string;
    language_code: string;
    type: 'text' | 'audio';
    text_type?: string;
    closed_captions?: boolean;
  }
) {
  const result = await apiClient.post(
    `/video/v1/assets/${assetId}/tracks`,
    JSON.stringify(options)
  );

  if (!result.ok) {
    const error = await result.json();
    throw new Error(error.error?.messages?.[0] || 'Error uploading track');
  }

  return await result.json();
}

export async function deleteTrack(apiClient: ApiClient, assetId: string, trackId: string) {
  return await apiClient.del(`/video/v1/assets/${assetId}/tracks/${trackId}`);
}

export async function generateAutoCaptions(
  apiClient: ApiClient,
  assetId: string,
  trackId: string,
  options: {
    language_code: string;
    name: string;
  }
) {
  const result = await apiClient.post(
    `/video/v1/assets/${assetId}/tracks/${trackId}/generate-subtitles`,
    JSON.stringify({
      generated_subtitles: [
        {
          language_code: options.language_code,
          name: options.name,
        },
      ],
    })
  );

  if (!result.ok) {
    const error = await result.json();
    throw new Error(error.error?.messages?.[0] || 'Error generating subtitles');
  }

  return await result.json();
}
