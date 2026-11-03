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

/** `muxProxy`'s answer for a path, when a test needs other than success. */
const proxyAnswers = new Map<string, Record<string, unknown>>();

/** What Mux answers each call with — only the shape the method under test reads back. */
const muxResponseFor = (call: ProxyCall): unknown => {
  if (call.path === '/video/v1/assets') return { data: { id: 'asset-1', status: 'preparing' } };
  if (call.path === '/video/v1/uploads') {
    return { data: { id: 'upload-1', url: 'https://storage.example/upload-1' } };
  }
  if (call.method === 'GET' && call.path.includes('/runs?')) return { data: [] };
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
        const answer = proxyAnswers.get(parameters.path) ?? {
          ok: true,
          data: muxResponseFor(parameters),
        };
        return { response: { body: JSON.stringify(answer) } };
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
    proxyAnswers.clear();
    muxApi = await MuxApiService.getInstance(cmaClient, sdk);
  });

  it('stamps a Robots job at the top level, beside its parameters', async () => {
    await muxApi.createRobotsJob('summarize', { asset_id: 'asset-1' });

    expect(proxyCalls).toHaveLength(1);
    expect(proxyCalls[0]).toMatchObject({ method: 'POST', path: '/robots/v1/jobs/summarize' });
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
      path: '/robots/v1/directives/drv_1/runs',
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

describe('which Robots version each call goes to', () => {
  let muxApi: MuxApiService;

  beforeEach(async () => {
    proxyCalls.length = 0;
    proxyAnswers.clear();
    muxApi = await MuxApiService.getInstance(cmaClient, sdk);
  });

  const v0Links = (path: string) => ({ self: { href: `/robots/v0/${path}` } });
  const v1Links = (path: string) => ({ self: { href: `/robots/v1/${path}` } });
  const notFound = { ok: false, status: 404, error: 'Directive not found', errorType: 'not_found' };

  it('creates a job on v1, and hands it back with the route it was created on', async () => {
    proxyAnswers.set('/robots/v1/jobs/summarize', {
      ok: true,
      data: { data: { id: 'rjob_new', workflow: 'summarize', status: 'pending' } },
    });

    const response = await muxApi.createRobotsJob('summarize', { asset_id: 'asset-1' });

    // Without it the job would read as v0, and its detail read would be a 404.
    expect(response.data._links).toEqual(v1Links('jobs/summarize/rjob_new'));
  });

  it('lists jobs through v1, which returns both versions', async () => {
    await muxApi.listRobotsJobs({ asset_id: 'asset-1', limit: 100 });

    expect(proxyCalls.map((call) => call.path)).toEqual([
      '/robots/v1/jobs?asset_id=asset-1&limit=100',
    ]);
  });

  it('reads and cancels a job on the version its links name', async () => {
    await muxApi.getRobotsJob({
      id: 'rjob_0',
      workflow: 'find-scenes',
      _links: v0Links('jobs/find-scenes/rjob_0'),
    });
    await muxApi.getRobotsJob({
      id: 'rjob_1',
      workflow: 'analyze-structure',
      _links: v1Links('jobs/analyze-structure/rjob_1'),
    });
    // Nothing without links was created on v1: only v1 creates are stamped.
    await muxApi.getRobotsJob({ id: 'rjob_2', workflow: 'summarize' });
    await muxApi.cancelRobotsJob({ id: 'rjob_0', _links: v0Links('jobs/find-scenes/rjob_0') });
    await muxApi.cancelRobotsJob({ id: 'rjob_1', _links: v1Links('jobs/summarize/rjob_1') });

    expect(proxyCalls.map((call) => `${call.method} ${call.path}`)).toEqual([
      'GET /robots/v0/jobs/find-scenes/rjob_0',
      'GET /robots/v1/jobs/analyze-structure/rjob_1',
      'GET /robots/v0/jobs/summarize/rjob_2',
      'POST /robots/v0/jobs/rjob_0/cancel',
      'POST /robots/v1/jobs/rjob_1/cancel',
    ]);
  });

  it('runs a listed directive on the version the listing names', async () => {
    proxyAnswers.set('/robots/v1/directives?limit=100', {
      ok: true,
      data: {
        data: [
          { id: 'drv_listed_v0', _links: v0Links('directives/drv_listed_v0') },
          { id: 'drv_listed_v1', _links: v1Links('directives/drv_listed_v1') },
        ],
      },
    });

    await muxApi.listRobotsDirectives({ limit: 100 });
    await muxApi.createRobotsDirectiveRun('drv_listed_v0', 'asset-1');
    await muxApi.listRobotsDirectiveRuns('drv_listed_v1', { limit: 25 });

    expect(proxyCalls.map((call) => `${call.method} ${call.path}`)).toEqual([
      'GET /robots/v1/directives?limit=100',
      'POST /robots/v0/directives/drv_listed_v0/runs',
      'GET /robots/v1/directives/drv_listed_v1/runs?limit=25',
    ]);
  });

  it('tries an id no listing named on v1, then on v0 after a 404, and remembers the answer', async () => {
    proxyAnswers.set('/robots/v1/directives/drv_configured/runs?limit=25', notFound);

    await muxApi.listRobotsDirectiveRuns('drv_configured', { limit: 25 });
    await muxApi.getRobotsDirectiveRun('drv_configured', 'drvrun_1');

    expect(proxyCalls.map((call) => call.path)).toEqual([
      '/robots/v1/directives/drv_configured/runs?limit=25',
      '/robots/v0/directives/drv_configured/runs?limit=25',
      '/robots/v0/directives/drv_configured/runs/drvrun_1',
    ]);
  });

  it('falls back to v0 on a 404 only, never on a refusal that says something else', async () => {
    proxyAnswers.set('/robots/v1/directives/drv_refused/runs', {
      ok: false,
      status: 401,
      error: 'Unauthorized',
    });

    await expect(muxApi.createRobotsDirectiveRun('drv_refused', 'asset-1')).rejects.toMatchObject({
      status: 401,
    });
    expect(proxyCalls.map((call) => call.path)).toEqual(['/robots/v1/directives/drv_refused/runs']);
  });

  it('reads a v1 run, which names itself `id`, as the `run_id` the app keys runs by', async () => {
    const v1Run = {
      id: 'drvrun_v1',
      directive_id: 'drv_new',
      subject_id: 'asset-1',
      status: 'running',
      node_states: [{ workflow: 'summarize', status: 'dispatched', job_id: 'rjob_1' }],
    };
    proxyAnswers.set('/robots/v1/directives/drv_new/runs', { ok: true, data: { data: v1Run } });
    proxyAnswers.set('/robots/v1/directives/drv_new/runs?limit=25', {
      ok: true,
      data: { data: [v1Run] },
    });

    const created = await muxApi.createRobotsDirectiveRun('drv_new', 'asset-1');
    const listed = await muxApi.listRobotsDirectiveRuns('drv_new', { limit: 25 });

    const { id, ...rest } = v1Run;
    expect(created.data).toEqual({ ...rest, run_id: id });
    expect(listed.data).toEqual([{ ...rest, run_id: id }]);
  });
});
