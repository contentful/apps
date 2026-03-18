import { AppExtensionSDK, FieldExtensionSDK } from '@contentful/app-sdk';
import { PlainClientAPI } from 'contentful-management';
import { ModalData } from '../components/AssetConfiguration/MuxAssetConfigurationModal';
import { InstallationParams, ResolutionType } from './types';

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

export class MuxApiService {
  private static instance: MuxApiService | null = null;
  private cmaClient: PlainClientAPI;
  private sdk: FieldExtensionSDK | AppExtensionSDK;
  private actionIds: Record<string, string> = {};

  private constructor(
    cmaClient: PlainClientAPI,
    sdk: FieldExtensionSDK | AppExtensionSDK
  ) {
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

  private async callAction<T>(
    actionName: string,
    parameters: Record<string, any>
  ): Promise<T> {
    const actionId = this.actionIds[actionName];
    if (!actionId) {
      throw new MuxApiError(`App Action '${actionName}' not found.`);
    }

    const {
      response: { body },
    } = await this.cmaClient.appActionCall.createWithResponse(
      {
        organizationId: this.sdk.ids.organization,
        appDefinitionId: this.sdk.ids.app!,
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

  // --- Asset operations ---

  async getAsset(assetId: string): Promise<any> {
    return this.callAction('getAsset', { assetId });
  }

  async createAsset(requestBody: any): Promise<any> {
    return this.callAction('createAsset', { requestBody });
  }

  // --- Upload operations ---

  async createUpload(requestBody: any): Promise<{ id: string; url: string }> {
    return this.callAction('createUpload', { requestBody });
  }

  async getUpload(uploadId: string): Promise<any> {
    return this.callAction('getUpload', { uploadId });
  }

  // --- Static rendition operations ---

  async deleteStaticRendition(assetId: string, staticRenditionId: string): Promise<void> {
    await this.callAction('deleteStaticRendition', { assetId, staticRenditionId });
  }

  async createStaticRendition(assetId: string, resolution: ResolutionType): Promise<void> {
    await this.callAction('createStaticRendition', { assetId, resolution });
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
  ): Promise<any> {
    return this.callAction('createTrack', { assetId, trackOptions: options });
  }

  async deleteTrack(assetId: string, trackId: string): Promise<void> {
    await this.callAction('deleteTrack', { assetId, trackId });
  }

  async generateSubtitles(
    assetId: string,
    trackId: string,
    options: { language_code: string; name: string }
  ): Promise<any> {
    return this.callAction('generateSubtitles', { assetId, trackId, options });
  }

  // --- Signing key operations (credentials passed as params for config page) ---

  async getSigningKey(params: {
    muxAccessTokenId: string;
    muxAccessTokenSecret: string;
    signingKeyId: string;
  }): Promise<boolean> {
    const result = await this.callAction<{ exists: boolean }>('getSigningKey', params);
    return result.exists;
  }

  async createSigningKey(params: {
    muxAccessTokenId: string;
    muxAccessTokenSecret: string;
  }): Promise<{ id: string; private_key: string }> {
    return this.callAction('createSigningKey', params);
  }

  // --- Signed URL tokens ---

  async getSignedUrlTokens(playbackId: string, isDRM = false): Promise<SignedTokens> {
    return this.callAction<SignedTokens>('getSignedUrlTokens', { playbackId, isDRM });
  }
}

// --- Helper functions (pure data transformation, stays in frontend) ---

export function buildAssetSettings(
  options: ModalData,
  drmConfigurationId?: string
): AssetSettings {
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
