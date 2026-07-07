import { AppExtensionSDK, FieldExtensionSDK } from '@contentful/app-sdk';
import { PlainClientAPI } from 'contentful-management';
import { ModalData } from '../components/AssetConfiguration/MuxAssetConfigurationModal';
import { InstallationParams, ResolutionType, Track } from './types';

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

export interface SignedTokens {
  licenseToken?: string;
  playbackToken: string;
  posterToken: string;
  storyboardToken: string;
}

export class MuxApiError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'MuxApiError';
    this.status = status;
  }
}

interface MuxErrorBody {
  messages: string[];
}

interface MuxAssetData {
  id: string;
  status: string;
  playback_ids?: Array<{ id: string; policy: string }>;
  tracks?: Track[];
  max_stored_resolution?: string;
  errors?: MuxErrorBody;
  [key: string]: unknown;
}

interface MuxUploadData {
  id: string;
  status: string;
  asset_id?: string;
  errors?: MuxErrorBody;
}

export interface MuxDataResponse<T> {
  data: T;
  error?: MuxErrorBody;
}

export type MuxAssetResponse = MuxDataResponse<MuxAssetData>;
export type MuxUploadResponse = MuxDataResponse<MuxUploadData>;

export class MuxApiService {
  private static instance: MuxApiService | null = null;
  private cmaClient: PlainClientAPI;
  private sdk: FieldExtensionSDK | AppExtensionSDK;
  private actionIds: Record<string, string> = {};

  private constructor(cmaClient: PlainClientAPI, sdk: FieldExtensionSDK | AppExtensionSDK) {
    this.cmaClient = cmaClient;
    this.sdk = sdk;
  }

  static async getInstance(
    cmaClient: PlainClientAPI,
    sdk: FieldExtensionSDK | AppExtensionSDK
  ): Promise<MuxApiService> {
    if (!MuxApiService.instance) {
      MuxApiService.instance = new MuxApiService(cmaClient, sdk);
      await MuxApiService.instance.init();
    }
    return MuxApiService.instance;
  }

  private async init() {
    const response = await this.cmaClient.appAction.getManyForEnvironment({
      environmentId: this.sdk.ids.environment,
      spaceId: this.sdk.ids.space,
    });
    for (const item of response.items) {
      this.actionIds[item.name] = item.sys.id;
    }
  }

  private async callAction<T>(actionName: string, parameters: Record<string, unknown>): Promise<T> {
    const actionId = this.actionIds[actionName];
    if (!actionId) {
      throw new MuxApiError(`App Action '${actionName}' not found.`);
    }

    const appDefinitionId = this.sdk.ids.app;
    if (!appDefinitionId) {
      throw new MuxApiError('App definition ID is not available.');
    }

    const {
      response: { body },
    } = await this.cmaClient.appActionCall.createWithResponse(
      {
        organizationId: this.sdk.ids.organization,
        appDefinitionId,
        appActionId: actionId,
      },
      { parameters }
    );

    const parsed = JSON.parse(body);
    if (!parsed.ok) {
      throw new MuxApiError(parsed.error || 'Unknown error', parsed.status);
    }
    return parsed.data as T;
  }

  private async callProxy<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    path: string,
    body?: string
  ): Promise<T> {
    return this.callAction<T>('muxProxy', { method, path, body });
  }

  // --- Asset operations ---

  async getAsset(assetId: string): Promise<MuxAssetResponse> {
    return this.callProxy('GET', `/video/v1/assets/${assetId}`);
  }

  async createAsset(requestBody: Record<string, unknown>): Promise<MuxAssetResponse> {
    return this.callProxy('POST', '/video/v1/assets', JSON.stringify(requestBody));
  }

  // --- Upload operations ---

  async createUpload(requestBody: Record<string, unknown>): Promise<{ id: string; url: string }> {
    const result = await this.callProxy<{ data: { id: string; url: string } }>(
      'POST',
      '/video/v1/uploads',
      JSON.stringify(requestBody)
    );
    return result.data;
  }

  async getUpload(uploadId: string): Promise<MuxUploadResponse> {
    return this.callProxy('GET', `/video/v1/uploads/${uploadId}`);
  }

  // --- Static rendition operations ---

  async deleteStaticRendition(assetId: string, staticRenditionId: string): Promise<void> {
    await this.callProxy(
      'DELETE',
      `/video/v1/assets/${assetId}/static-renditions/${staticRenditionId}`
    );
  }

  async createStaticRendition(assetId: string, resolution: ResolutionType): Promise<void> {
    await this.callProxy(
      'POST',
      `/video/v1/assets/${assetId}/static-renditions`,
      JSON.stringify({ resolution })
    );
  }

  // --- Track operations ---

  async createTrack(
    assetId: string,
    options: {
      url: string;
      name: string;
      language_code: string;
      type: 'text' | 'audio';
      text_type?: string;
      closed_captions?: boolean;
    }
  ): Promise<void> {
    await this.callProxy('POST', `/video/v1/assets/${assetId}/tracks`, JSON.stringify(options));
  }

  async deleteTrack(assetId: string, trackId: string): Promise<void> {
    await this.callProxy('DELETE', `/video/v1/assets/${assetId}/tracks/${trackId}`);
  }

  async generateSubtitles(
    assetId: string,
    trackId: string,
    options: { language_code: string; name: string }
  ): Promise<void> {
    const body = JSON.stringify({
      generated_subtitles: [
        {
          language_code: options.language_code,
          name: options.name,
        },
      ],
    });
    await this.callProxy(
      'POST',
      `/video/v1/assets/${assetId}/tracks/${trackId}/generate-subtitles`,
      body
    );
  }

  // --- Signed URL tokens ---

  async getSignedUrlTokens(playbackId: string, isDRM = false): Promise<SignedTokens> {
    return this.callAction<SignedTokens>('getSignedUrlTokens', { playbackId, isDRM });
  }
}

// --- Helper functions (pure data transformation, stays in frontend) ---

export function buildAssetSettings(options: ModalData, drmConfigurationId?: string): AssetSettings {
  const selectedPolicy = options.playbackPolicies[0];
  const hasDRM = selectedPolicy === 'drm';
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
    settings.playback_policies = [selectedPolicy];
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

// --- Orchestration functions (frontend logic + action calls) ---

export async function addByURL({
  muxApi,
  sdk,
  remoteURL,
  options,
  setAssetError,
  pollForAssetDetails,
}: {
  muxApi: MuxApiService;
  sdk: FieldExtensionSDK;
  remoteURL: string;
  options: ModalData;
  setAssetError: (msg: string) => void;
  pollForAssetDetails: () => Promise<void>;
}) {
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

  const muxUpload = await muxApi.createAsset(requestBody);

  if (muxUpload.error) {
    setAssetError(muxUpload.error.messages[0]);
    return;
  }

  if (muxUpload.data.status === 'errored') {
    setAssetError(muxUpload.data.errors?.messages[0] ?? 'Unknown error');
    return;
  }

  await sdk.field.setValue({
    assetId: muxUpload.data.id,
  });
  await pollForAssetDetails();
}

export async function getUploadUrl(
  muxApi: MuxApiService,
  sdk: FieldExtensionSDK,
  options: ModalData
) {
  const { muxEnableAudioNormalize, muxDRMConfigurationId } = sdk.parameters
    .installation as InstallationParams;

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

  const muxUpload = await muxApi.createUpload(requestBody);

  await sdk.field.setValue({
    uploadId: muxUpload.id,
  });

  return muxUpload.url;
}
