import { FieldExtensionSDK } from '@contentful/app-sdk';
import { ModalData } from '../components/AssetConfiguration/MuxAssetConfigurationModal';
import ApiClient from './apiClient';
import { InstallationParams, ResolutionType, AddByURLConfig } from './types';

export interface AssetSettings {
  passthrough?: string;
  playback_policies?: string[];
  advanced_playback_policies?: Array<{
    policy: string;
    drm_configuration_id?: string;
  }>;
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

function buildAssetSettings(
  options: ModalData,
  drmConfigurationId?: string
): AssetSettings {
  const hasDRM = options.playbackPolicies.includes('drm');
  const settings: AssetSettings = {
    video_quality: options.videoQuality,
    inputs: [],
  };

  if (hasDRM && drmConfigurationId) {
    settings.advanced_playback_policies = [
      {
        policy: 'drm',
        drm_configuration_id: drmConfigurationId,
      },
    ];
  } else if (!hasDRM) {
    settings.playback_policies = options.playbackPolicies;
  }

  // Metadata case
  if (options.metadataConfig.standardMetadata) {
    const { title, externalId } = options.metadataConfig.standardMetadata;
    if (title || externalId) {
      settings.meta = {};
      if (title) settings.meta.title = title;
      if (externalId) settings.meta.external_id = externalId;
    }
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
  const { muxDRMConfigurationId } = sdk.parameters.installation as InstallationParams;
  
  // Validate DRM configuration if DRM is selected
  if (options.playbackPolicies.includes('drm') && !muxDRMConfigurationId) {
    setAssetError('DRM is selected but DRM Configuration ID is not set in app configuration.');
    return;
  }
  
  const settings = buildAssetSettings(options, muxDRMConfigurationId);

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
  const { muxEnableAudioNormalize, muxDRMConfigurationId } =
    sdk.parameters.installation as InstallationParams;
  
  // Validate DRM configuration if DRM is selected
  if (options.playbackPolicies.includes('drm') && !muxDRMConfigurationId) {
    const errorMsg = 'DRM is selected but DRM Configuration ID is not set in app configuration.';
    sdk.notifier.error(errorMsg);
    return;
  }
  
  const settings = buildAssetSettings(options, muxDRMConfigurationId);

  const newAssetSettings = {
    ...settings,
    normalize_audio: muxEnableAudioNormalize || false,
  };

  const requestBody = {
    cors_origin: window.location.origin,
    new_asset_settings: newAssetSettings,
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
