import { FieldExtensionSDK } from '@contentful/app-sdk';
import { PlainClientAPI } from 'contentful-management';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ModalData } from '../components/AssetConfiguration/MuxAssetConfigurationModal';
import { MuxApiService, addByURL, getUploadUrl } from './muxApi';

/**
 * Where this plugin puts a `passthrough` in what it sends Mux, read off the proxy call itself.
 *
 * One place only: the interim marker on a Robots job create (ADR-0003). Every other passthrough is
 * the customer's — an asset's, a track's and a static rendition's are mirrored onto the entry and
 * reach the Delivery API.
 */

interface ProxyCall {
  method: string;
  path: string;
  body?: string;
}

const proxyCalls: ProxyCall[] = [];

/** What Mux answers each call with — only the shape the method under test reads back. */
const muxResponseFor = (call: ProxyCall): unknown => {
  if (call.path === '/video/v1/assets') return { data: { id: 'asset-1', status: 'preparing' } };
  if (call.path === '/video/v1/uploads') {
    return { data: { id: 'upload-1', url: 'https://storage.example/upload-1' } };
  }
  return { data: {} };
};

const cmaClient = {
  appAction: {
    getManyForEnvironment: vi.fn(async () => ({
      items: [{ name: 'muxProxy', sys: { id: 'action-mux-proxy' } }],
    })),
  },
  appActionCall: {
    createWithResponse: vi.fn(
      async (_target: unknown, { parameters }: { parameters: ProxyCall }) => {
        proxyCalls.push(parameters);
        return {
          response: { body: JSON.stringify({ ok: true, data: muxResponseFor(parameters) }) },
        };
      }
    ),
  },
} as unknown as PlainClientAPI;

const sdk = {
  ids: { organization: 'org-1', space: 'space-1', environment: 'master', app: 'app-1' },
  parameters: { installation: { muxEnableAudioNormalize: true } },
  field: { setValue: vi.fn(async () => undefined) },
  notifier: { error: vi.fn() },
} as unknown as FieldExtensionSDK;

const bodyOf = (call: ProxyCall | undefined): unknown => JSON.parse(call?.body ?? 'null');

/** Every place a `passthrough` key appears in a request body, however deeply nested. */
function passthroughPaths(value: unknown, path = 'body'): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => passthroughPaths(item, `${path}[${index}]`));
  }
  if (!value || typeof value !== 'object') return [];
  return Object.entries(value).flatMap(([key, child]) => [
    ...(key === 'passthrough' ? [`${path}.${key}`] : []),
    ...passthroughPaths(child, `${path}.${key}`),
  ]);
}

/**
 * An upload with every option that adds to the request switched on, so a passthrough added at any
 * level — the asset, an input, a generated subtitle, a static rendition — would be sent.
 */
const everyOption = (captionsConfig: ModalData['captionsConfig']): ModalData => ({
  videoQuality: 'plus',
  playbackPolicies: ['signed'],
  captionsConfig,
  mp4Config: { highestResolution: true, audioOnly: true },
  metadataConfig: { standardMetadata: { title: 'A title', externalId: 'ext-1' } },
  directiveIds: ['drv_1'],
});

const customCaptions: ModalData['captionsConfig'] = {
  captionsType: 'custom',
  languageCode: 'en',
  languageName: 'English',
  closedCaptions: true,
  url: 'https://example.com/en.vtt',
};

const generatedCaptions: ModalData['captionsConfig'] = {
  captionsType: 'auto',
  languageCode: 'en',
  languageName: 'English',
};

describe('what the plugin sends Mux', () => {
  let muxApi: MuxApiService;

  beforeEach(async () => {
    proxyCalls.length = 0;
    muxApi = await MuxApiService.getInstance(cmaClient, sdk);
  });

  it('stamps a Robots job at the top level, beside its parameters', async () => {
    await muxApi.createRobotsJob('summarize', { asset_id: 'asset-1' });

    expect(proxyCalls).toHaveLength(1);
    expect(proxyCalls[0]).toMatchObject({ method: 'POST', path: '/robots/v0/jobs/summarize' });
    // Mux reads it from the top level; inside `parameters` it is an unknown workflow parameter.
    expect(bodyOf(proxyCalls[0])).toEqual({
      parameters: { asset_id: 'asset-1' },
      passthrough: 'mux:cms:contentful:',
    });
  });

  it('sends a directive run the asset alone, which is all that endpoint takes', async () => {
    await muxApi.createRobotsDirectiveRun('drv_1', 'asset-1');

    expect(proxyCalls[0]).toMatchObject({
      method: 'POST',
      path: '/robots/v0/directives/drv_1/runs',
    });
    expect(bodyOf(proxyCalls[0])).toEqual({ asset_id: 'asset-1' });
  });

  it('marks no asset it creates, by URL or by direct upload', async () => {
    // The asset's passthrough is mirrored onto the entry and delivered, and customers correlate
    // assets with it through the API and webhooks. Stamping it would change every new asset's
    // delivered data for a count that is about Robots jobs.
    for (const captions of [customCaptions, generatedCaptions]) {
      await addByURL({
        muxApi,
        sdk,
        remoteURL: 'https://example.com/video.mp4',
        options: everyOption(captions),
        setAssetError: vi.fn(),
        pollForAssetDetails: vi.fn(async () => undefined),
      });
      await getUploadUrl(muxApi, sdk, everyOption(captions));
    }

    const creates = proxyCalls.filter(
      (call) => call.path === '/video/v1/assets' || call.path === '/video/v1/uploads'
    );
    expect(creates).toHaveLength(4);
    for (const call of creates) {
      expect(passthroughPaths(bodyOf(call))).toEqual([]);
    }
    // Not vacuous: the bodies really do carry the inputs, renditions and directives a passthrough
    // could have ridden on.
    expect(bodyOf(creates[0])).toMatchObject({
      inputs: [{ url: 'https://example.com/video.mp4' }, { url: 'https://example.com/en.vtt' }],
      static_renditions: [{ resolution: 'audio-only' }, { resolution: 'highest' }],
      directives: [{ id: 'drv_1' }],
    });
    expect(bodyOf(creates[3])).toMatchObject({
      new_asset_settings: { inputs: [{ generated_subtitles: [{ language_code: 'en' }] }] },
    });
  });

  it('marks no track, generated subtitles or static rendition it adds to an asset', async () => {
    // Each of these is mirrored onto the entry as Mux returns it, passthrough included.
    await muxApi.createTrack('asset-1', {
      url: 'https://example.com/fr.vtt',
      name: 'Français',
      language_code: 'fr',
      type: 'text',
      text_type: 'subtitles',
      closed_captions: false,
    });
    await muxApi.generateSubtitles('asset-1', 'track-audio-1', {
      language_code: 'en',
      name: 'English',
    });
    await muxApi.createStaticRendition('asset-1', 'highest');

    expect(proxyCalls.map((call) => call.path)).toEqual([
      '/video/v1/assets/asset-1/tracks',
      '/video/v1/assets/asset-1/tracks/track-audio-1/generate-subtitles',
      '/video/v1/assets/asset-1/static-renditions',
    ]);
    for (const call of proxyCalls) {
      expect(passthroughPaths(bodyOf(call))).toEqual([]);
    }
  });
});
