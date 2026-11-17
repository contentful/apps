import { AppExtensionSDK, FieldExtensionSDK } from '@contentful/app-sdk';
import { PlainClientAPI } from 'contentful-management';
import { ModalData } from '../components/AssetConfiguration/MuxAssetConfigurationModal';
import { InstallationParams, ResolutionType, StaticRendition, Track } from './types';
import {
  ROBOTS_API_VERSION,
  RobotsApiVersion,
  RobotsDirective,
  RobotsDirectiveRun,
  RobotsDirectiveRunResponse,
  RobotsJob,
  RobotsJobStatus,
  RobotsRunnableWorkflow,
  RobotsWorkflow,
  readDirectiveRun,
  robotsApiVersionOf,
} from './robotsTypes';

export interface AssetSettings {
  passthrough?: string;
  /** Robots directives to run once the asset is ingested. */
  directives?: Array<{ id: string }>;
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
  /**
   * Mux's machine-readable error discriminator, forwarded by `muxProxy`. The Robots tab needs it
   * to tell Mux refusing one run (`robots_*`) from Robots being off for the account (`forbidden`)
   * — both are 403s.
   */
  errorType?: string;

  constructor(message: string, status?: number, errorType?: string) {
    super(message);
    this.name = 'MuxApiError';
    this.status = status;
    this.errorType = errorType;
  }

  /**
   * True when Mux itself answered — even with an error. `muxProxy` returns those over HTTP 200 as
   * `{ ok: false, status }`, so a status means the request definitely reached Mux and definitely
   * did not do anything. Anything else (an app-action timeout, a killed function) leaves the
   * outcome unknown, which for a billable Robots job is a different problem entirely.
   */
  get muxAnswered(): boolean {
    return typeof this.status === 'number';
  }
}

/**
 * A Mux error response read in the browser, as the same `MuxApiError` `muxProxy` hands the rest of
 * the app — so the config screen, which calls `api.mux.com` directly, classifies with
 * `capabilityFromError` rather than a copy of it. The two body shapes are the ones
 * `readMuxErrorMessage` in `functions/src/muxProxy.ts` reads first: Mux sends `messages`, and its
 * reference documents `message`.
 */
export async function muxApiErrorFromResponse(response: Response): Promise<MuxApiError> {
  const body: unknown = await response.json().catch(() => undefined);
  const error = isRecord(body) && isRecord(body.error) ? body.error : undefined;
  const messages: unknown[] =
    error && Array.isArray(error.messages) ? error.messages : [error?.message];
  const text = messages
    .filter((message): message is string => typeof message === 'string' && message.trim() !== '')
    .join(' ');

  return new MuxApiError(
    text || `Mux rejected this request (HTTP ${response.status})`,
    response.status,
    typeof error?.type === 'string' ? error.type : undefined
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object';
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
  // The rest of the asset fields the app actually mirrors onto the entry. They used to fall
  // through to the index signature as `unknown`, which typechecked only because the field value
  // was built as an untyped object literal.
  upload_id?: string;
  aspect_ratio?: string;
  max_stored_frame_rate?: number;
  duration?: number;
  created_at?: string | number;
  is_live?: boolean;
  live_stream_id?: string;
  meta?: {
    title?: string;
    creator_id?: string;
    external_id?: string;
  };
  passthrough?: string;
  static_renditions?: { files?: StaticRendition[] };
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
  /** The version each directive was created on, as a listing or an earlier call showed it. */
  private directiveVersions = new Map<string, RobotsApiVersion>();

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
        appDefinitionId,
        appActionId: actionId,
      },
      { parameters }
    );

    const parsed = JSON.parse(body);
    if (!parsed.ok) {
      throw new MuxApiError(parsed.error || 'Unknown error', parsed.status, parsed.errorType);
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

  // --- Robots operations ---
  //
  // All of these return the `MuxDataResponse<T>` envelope, matching `getAsset` / `createAsset`
  // rather than unwrapping the way `createUpload` does. `muxProxy` hands back Mux's whole
  // response body, so the envelope is what actually arrives; unwrapping some methods and not
  // others is how the existing inconsistency got there.
  //
  // Jobs and directive runs are created on `ROBOTS_API_VERSION`. Everything else goes to the
  // version that created the resource — a job by its `_links`, a directive by
  // `onDirectiveVersion` — because the other version answers 404 (ADR-0017).

  /**
   * Starts a job. Nothing in the app reads a job's `passthrough`, which is the customer's field:
   * Mux attributes the call by the `x-source-platform` header `muxProxy` sends. The one line
   * below is an interim marker until Mux confirms it counts by that header (ADR-0003).
   */
  async createRobotsJob(
    workflow: RobotsRunnableWorkflow,
    parameters: Record<string, unknown>
  ): Promise<MuxDataResponse<RobotsJob>> {
    const response = await this.callProxy<MuxDataResponse<RobotsJob>>(
      'POST',
      `/robots/${ROBOTS_API_VERSION}/jobs/${workflow}`,
      JSON.stringify({
        parameters,
        passthrough: 'mux:cms:contentful:', // interim marker, see ADR-0003; nothing reads it
      })
    );
    // The create response has no `_links`, and without them the job would read as v0.
    if (!response?.data?.id) return response;
    const href = `/robots/${ROBOTS_API_VERSION}/jobs/${workflow}/${response.data.id}`;
    return { ...response, data: { ...response.data, _links: { self: { href } } } };
  }

  async getRobotsJob(
    job: Pick<RobotsJob, 'id' | 'workflow' | '_links'>
  ): Promise<MuxDataResponse<RobotsJob>> {
    return this.callProxy('GET', `/robots/${jobVersion(job)}/jobs/${job.workflow}/${job.id}`);
  }

  /** Lists the jobs of both versions, each with the `_links` of the version that owns it. */
  async listRobotsJobs(query: {
    asset_id?: string;
    workflow?: RobotsWorkflow;
    status?: RobotsJobStatus;
    limit?: number;
    page?: number;
  }): Promise<MuxDataResponse<RobotsJob[]>> {
    return this.callProxy('GET', `/robots/v1/jobs${buildQueryString(query)}`);
  }

  /** Note the path asymmetry with `getRobotsJob`: cancel takes no workflow segment. */
  async cancelRobotsJob(
    job: Pick<RobotsJob, 'id' | '_links'>
  ): Promise<MuxDataResponse<RobotsJob>> {
    return this.callProxy('POST', `/robots/${jobVersion(job)}/jobs/${job.id}/cancel`);
  }

  /** Lists the directives of both versions, as summaries. */
  async listRobotsDirectives(
    query: { limit?: number; page?: number } = {}
  ): Promise<MuxDataResponse<RobotsDirective[]>> {
    const response = await this.callProxy<MuxDataResponse<RobotsDirective[]>>(
      'GET',
      `/robots/v1/directives${buildQueryString(query)}`
    );
    for (const directive of response?.data ?? []) {
      const version = robotsApiVersionOf(directive);
      if (version) this.directiveVersions.set(directive.id, version);
    }
    return response;
  }

  /** 409 when a run for this directive/asset pair is already in progress. */
  async createRobotsDirectiveRun(
    directiveId: string,
    assetId: string
  ): Promise<Partial<MuxDataResponse<RobotsDirectiveRun>>> {
    const response = await this.onDirectiveVersion(directiveId, (version) =>
      this.callProxy<Partial<MuxDataResponse<RobotsDirectiveRunResponse>>>(
        'POST',
        `/robots/${version}/directives/${directiveId}/runs`,
        JSON.stringify({ asset_id: assetId })
      )
    );
    return readRunResponse(response);
  }

  async listRobotsDirectiveRuns(
    directiveId: string,
    query: { limit?: number; page?: number } = {}
  ): Promise<MuxDataResponse<RobotsDirectiveRun[]>> {
    const response = await this.onDirectiveVersion(directiveId, (version) =>
      this.callProxy<MuxDataResponse<RobotsDirectiveRunResponse[]>>(
        'GET',
        `/robots/${version}/directives/${directiveId}/runs${buildQueryString(query)}`
      )
    );
    return { ...response, data: (response?.data ?? []).map(readDirectiveRun) };
  }

  async getRobotsDirectiveRun(
    directiveId: string,
    runId: string
  ): Promise<Partial<MuxDataResponse<RobotsDirectiveRun>>> {
    const response = await this.onDirectiveVersion(directiveId, (version) =>
      this.callProxy<Partial<MuxDataResponse<RobotsDirectiveRunResponse>>>(
        'GET',
        `/robots/${version}/directives/${directiveId}/runs/${runId}`
      )
    );
    return readRunResponse(response);
  }

  /**
   * Calls a directive's routes on the version that created it. An id no listing has shown yet —
   * one from the configuration, or from a run recorded on the entry — is tried on v1, and on v0
   * only after a 404, which is how Mux says to resolve an id stored without its version.
   */
  private async onDirectiveVersion<T>(
    directiveId: string,
    call: (version: RobotsApiVersion) => Promise<T>
  ): Promise<T> {
    const known = this.directiveVersions.get(directiveId);
    if (known) return call(known);
    try {
      const result = await call('v1');
      this.directiveVersions.set(directiveId, 'v1');
      return result;
    } catch (error) {
      if (!(error instanceof MuxApiError && error.status === 404)) throw error;
      const result = await call('v0');
      this.directiveVersions.set(directiveId, 'v0');
      return result;
    }
  }

  // --- Signed URL tokens ---

  async getSignedUrlTokens(playbackId: string, isDRM = false): Promise<SignedTokens> {
    return this.callAction<SignedTokens>('getSignedUrlTokens', { playbackId, isDRM });
  }
}

/** Jobs created here are stamped with their links, so one without any was created on v0. */
function jobVersion(job: Pick<RobotsJob, '_links'>): RobotsApiVersion {
  return robotsApiVersionOf(job) ?? 'v0';
}

function readRunResponse(
  response: Partial<MuxDataResponse<RobotsDirectiveRunResponse>> | undefined
): Partial<MuxDataResponse<RobotsDirectiveRun>> {
  return { ...response, data: response?.data && readDirectiveRun(response.data) };
}

function buildQueryString(query: Record<string, string | number | undefined>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') continue;
    params.set(key, String(value));
  }
  const serialized = params.toString();
  return serialized ? `?${serialized}` : '';
}

// --- Helper functions (pure data transformation, stays in frontend) ---

export function buildAssetSettings(options: ModalData, drmConfigurationId?: string): AssetSettings {
  const selectedPolicy = options.playbackPolicies[0];
  const hasDRM = selectedPolicy === 'drm';
  const settings: AssetSettings = {
    video_quality: options.videoQuality,
    inputs: [],
  };

  // Reaches both *creating* ingest paths for free, because both build their request from here.
  // The third path — pasting an existing Mux asset ID into the field — creates no asset, so
  // there are no `new_asset_settings` to carry a directive on.
  if (options.directiveIds?.length) {
    settings.directives = options.directiveIds.map((id) => ({ id }));
  }

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
