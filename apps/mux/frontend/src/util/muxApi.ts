import { InstallationParams, ResolutionType } from './types';

export interface ModalData {
  videoQuality: string;
  playbackPolicies: string[];
  captionsConfig: any;
  mp4Config: any;
}

export async function addByURL(
  apiClient: any,
  sdk: any,
  remoteURL: string,
  options: ModalData,
  responseCheck: (res: any) => boolean | Promise<boolean>,
  setAssetError: (msg: string) => void,
  pollForAssetDetails: () => Promise<void>
) {
  const passthroughId = (sdk.entry.getSys() as { id: string }).id;

  const requestBody: any = {
    inputs: [
      {
        url: remoteURL,
      },
    ],
    passthrough: passthroughId,
    playback_policies: options.playbackPolicies,
    video_quality: options.videoQuality,
  };

  // Captions case
  if (options.captionsConfig.captionsType !== 'off') {
    if (options.captionsConfig.captionsType === 'auto') {
      requestBody.inputs[0].generated_subtitles = [
        {
          language_code: options.captionsConfig.languageCode,
          name: options.captionsConfig.languageName,
        },
      ];
    } else {
      requestBody.inputs.push({
        url: options.captionsConfig.url,
        type: 'text',
        text_type: 'subtitles',
        closed_captions: options.captionsConfig.closedCaptions,
        language_code: options.captionsConfig.languageCode,
        name: options.captionsConfig.languageName,
      });
    }
  }

  if (options.mp4Config.enabled) {
    requestBody.static_renditions = [];
    if (options.mp4Config.audioOnly) {
      requestBody.static_renditions.push({
        resolution: 'audio-only',
      });
    }
    if (options.mp4Config.highestResolution) {
      requestBody.static_renditions.push({
        resolution: 'highest',
      });
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
  apiClient: any,
  sdk: any,
  options: ModalData,
  responseCheck: (res: any) => boolean | Promise<boolean>
) {
  const passthroughId = (sdk.entry.getSys() as { id: string }).id;

  const { muxEnableAudioNormalize } = sdk.parameters.installation as InstallationParams;

  const data: {
    cors_origin: string;
    new_asset_settings: {
      passthrough: string;
      normalize_audio: boolean;
      playback_policies: string[];
      static_renditions?: object[];
      video_quality: string;
      inputs: Array<{
        generated_subtitles?: Array<{
          language_code: string;
          name: string;
        }>;
        url?: string;
        type?: string;
        text_type?: string;
        closed_captions?: boolean;
        language_code?: string;
        name?: string;
      }>;
    };
  } = {
    cors_origin: window.location.origin,
    new_asset_settings: {
      passthrough: passthroughId,
      normalize_audio: muxEnableAudioNormalize || false,
      playback_policies: options.playbackPolicies,
      video_quality: options.videoQuality,
      inputs: [],
    },
  };

  // Captions case
  if (options.captionsConfig.captionsType !== 'off') {
    if (options.captionsConfig.captionsType === 'auto') {
      data.new_asset_settings.inputs.push({
        generated_subtitles: [
          {
            language_code: options.captionsConfig.languageCode,
            name: options.captionsConfig.languageName,
          },
        ],
      });
    } else {
      data.new_asset_settings.inputs.push({
        url: options.captionsConfig.url,
        type: 'text',
        text_type: 'subtitles',
        closed_captions: options.captionsConfig.closedCaptions,
        language_code: options.captionsConfig.languageCode,
        name: options.captionsConfig.languageName,
      });
    }
  }

  if (options.mp4Config.enabled) {
    data.new_asset_settings.static_renditions = [];
    if (options.mp4Config.audioOnly) {
      data.new_asset_settings.static_renditions.push({
        resolution: 'audio-only',
      });
    }
    if (options.mp4Config.highestResolution) {
      data.new_asset_settings.static_renditions.push({
        resolution: 'highest',
      });
    }
  }
  const res = await apiClient.post('/video/v1/uploads', JSON.stringify(data));

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
  apiClient: any,
  assetId: string,
  staticRenditionId: string
) {
  return await apiClient.del(`/video/v1/assets/${assetId}/static-renditions/${staticRenditionId}`);
}

export async function createStaticRendition(apiClient: any, assetId: string, type: ResolutionType) {
  return await apiClient.post(
    `/video/v1/assets/${assetId}/static-renditions`,
    JSON.stringify({ resolution: type })
  );
}
