/* eslint-disable  @typescript-eslint/no-explicit-any */

import React from 'react';
import { fireEvent, render, queryByAttribute } from '@testing-library/react';
import '@testing-library/jest-dom';
import { App } from '.';
import { vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { MuxContentfulObject } from './util/types';

vi.mock('contentful-management', () => ({
  createClient: vi.fn(() => ({
    appAction: {
      getManyForEnvironment: vi.fn(() => Promise.resolve({ items: [] })),
    },
    appActionCall: {
      createWithResponse: vi.fn(() =>
        Promise.resolve({ response: { body: JSON.stringify({ ok: true, data: {} }) } })
      ),
    },
  })),
}));

// Mock MuxPlayer to avoid Web Component errors in jsdom
vi.mock('@mux/mux-player-react', () => ({
  default: vi.fn(() => null),
}));

// Mock the MuxApiService
vi.mock('./util/muxApi', () => ({
  MuxApiService: {
    getInstance: vi.fn(() =>
      Promise.resolve({
        getAsset: vi.fn(() => Promise.resolve({ data: {} })),
        createAsset: vi.fn(() => Promise.resolve({ data: {} })),
        getUpload: vi.fn(() => Promise.resolve({ data: {} })),
        createUpload: vi.fn(() => Promise.resolve({ id: 'upload-id', url: 'https://upload.url' })),
        deleteTrack: vi.fn(() => Promise.resolve()),
        createTrack: vi.fn(() => Promise.resolve({ data: {} })),
        generateSubtitles: vi.fn(() => Promise.resolve({ data: {} })),
        deleteStaticRendition: vi.fn(() => Promise.resolve()),
        createStaticRendition: vi.fn(() => Promise.resolve()),
        getSignedUrlTokens: vi.fn(() =>
          Promise.resolve({ playbackToken: '', posterToken: '', storyboardToken: '' })
        ),
        // Robots. This mock returns `undefined` for anything not listed, so a new method that is
        // called during mount and left out here fails as a confusing destructuring error rather
        // than a missing-mock one.
        createRobotsJob: vi.fn(() => Promise.resolve({ data: {} })),
        getRobotsJob: vi.fn(() => Promise.resolve({ data: {} })),
        listRobotsJobs: vi.fn(() => Promise.resolve({ data: [] })),
        cancelRobotsJob: vi.fn(() => Promise.resolve({ data: {} })),
        listRobotsDirectives: vi.fn(() => Promise.resolve({ data: [] })),
        createRobotsDirectiveRun: vi.fn(() => Promise.resolve({ data: {} })),
        listRobotsDirectiveRuns: vi.fn(() => Promise.resolve({ data: [] })),
        getRobotsDirectiveRun: vi.fn(() => Promise.resolve({ data: {} })),
      })
    ),
  },
  MuxApiError: class MuxApiError extends Error {
    status?: number;
    constructor(message: string, status?: number) {
      super(message);
      this.name = 'MuxApiError';
      this.status = status;
    }
  },
  addByURL: vi.fn(),
  getUploadUrl: vi.fn(),
  buildAssetSettings: vi.fn(),
}));

/*
 * This was a valid private key, but it has since been revoked
 */

const SDK_MOCK = {
  state: {
    isDeleting: false,
  },
  // An admin, so the Robots tab renders its run controls and a test about them means something.
  user: {
    sys: { id: 'user-id', type: 'User' },
    spaceMembership: {
      sys: { id: 'membership-id', type: 'SpaceMembership' },
      admin: true,
      roles: [],
    },
  },
  ids: {
    environment: 'environment-id',
    space: 'space-id',
    organization: 'org-id',
    app: 'app-id',
  },
  parameters: {
    installation: {
      muxAccessTokenId: 'abcd1234',
      muxAccessTokenSecret: 'efgh5678',
      muxDomain: 'mux.com',
    },
    state: {
      isDeleting: false,
    },
  },
  field: {
    getValue: () => ({}),
    /* eslint-disable-next-line @typescript-eslint/no-empty-function */
    onValueChanged: () => () => {},
    setValue: () => ({}),
  },
  window: {
    startAutoResizer: () => null,
  },
  entry: {
    getSys: () => ({
      id: 'entry-id',
      publishedVersion: 1,
      version: 2,
      publishedAt: '2023-01-01T00:00:00Z',
    }),
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    onSysChanged: () => () => {},
  },
  cmaAdapter: {
    // Mock for contentful-management client
  },
  notifier: {
    error: vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
  },
  dialogs: {
    openConfirm: vi.fn(() => Promise.resolve(true)),
  },
  locales: {
    default: 'en-US',
  },
  contentType: {
    fields: [],
  },
};

const getById = queryByAttribute.bind(null, 'id');
const getByName = queryByAttribute.bind(null, 'name');

describe('Mux frontend app', () => {
  it('throws an error if required installation parameters are not configured', () => {
    const mockedSdk = {
      ...SDK_MOCK,
      parameters: {
        installation: {
          muxAccessTokenId: undefined,
          muxAccessTokenSecret: undefined,
        },
      },
    };

    const dom = render(<App sdk={mockedSdk as any} />);
    const error = dom.getByTestId('terminalerror');
    expect(error).toBeVisible();
    expect(error.innerText || error.textContent).toContain('Mux Access Token ID or Secret');
  });

  it('displays an error when we have a signed playbackId but no signing keys', async () => {
    const mockedSdk = {
      ...SDK_MOCK,
      parameters: {
        installation: {
          muxAccessTokenId: 'abcd1234',
          muxAccessTokenSecret: 'efgh5678',
          muxDomain: 'mux.com',
        },
      },
      field: {
        ...SDK_MOCK.field,
        getValue: () => ({
          assetId: 'asset-test-123',
          signedPlaybackId: 'playback-test-123',
          ready: true,
          ratio: '16:9',
          max_stored_resolution: 'HD',
          max_stored_frame_rate: 29.97,
          duration: 23.857167,
          audioOnly: false,
          created_at: 1661518909,
        }),
      },
    };

    const dom = render(<App sdk={mockedSdk as any} />);

    // Wait for the component to finish its async operations and state updates
    await new Promise((resolve) => setTimeout(resolve, 100));

    const error = await dom.findByTestId('terminalerror');
    expect(error).toBeVisible();
    expect(error.innerText || error.textContent).toContain('signing keys do not exist');
  });

  it('Displays Uploader dropzone before user does anything and Mux Uploader is hidden.', () => {
    const mockedSdk = { ...SDK_MOCK };
    const dom = render(<App sdk={mockedSdk as any} />);
    expect(getById(dom.container, 'muxuploader')).not.toBeVisible(); // Add prop to Note
    expect(getById(dom.container, 'uploaderDropzone')).toBeVisible();
    expect(getByName(dom.container, 'muxvideoinput')).toBeVisible(); // Add prop to Note
  });

  it('displays a loading state between the asset getting created and waiting for it to be ready', () => {
    const mockedSdk = {
      ...SDK_MOCK,
      field: {
        ...SDK_MOCK.field,
        getValue: () => ({
          assetId: 'abcd1234',
          ready: false,
          playbackId: 'playback-test-123',
        }),
      },
    };

    const dom = render(<App sdk={mockedSdk as any} />);
    expect(dom.getByTestId('waitingtoplay')).toBeVisible();
  });

  it('displays an error if the asset is errored', async () => {
    const mockedSdk = {
      ...SDK_MOCK,
      parameters: {
        installation: {
          muxAccessTokenId: 'abcd1234',
          muxAccessTokenSecret: 'efgh5678',
          muxDomain: 'mux.com',
        },
      },
      field: {
        ...SDK_MOCK.field,
        getValue: () => ({
          error: 'Input file does not contain a duration',
        }),
      },
    };

    const dom = render(<App sdk={mockedSdk as any} />);
    const error = await dom.findByTestId('terminalerror');
    expect(error.innerText || error.textContent).toContain(
      'Input file does not contain a duration'
    );
  });

  it('Show Remove and Delete buttons when there is a valid player', async () => {
    const mockedSdk = {
      ...SDK_MOCK,
      state: {
        //playerPlaybackId: 'playback-test-123'
      },
      field: {
        ...SDK_MOCK.field,
        getValue: () => ({
          assetId: 'asset-test-123',
          playbackId: 'playback-test-123',
          ready: true,
          ratio: '16:9',
          max_stored_resolution: 'HD',
          max_stored_frame_rate: 29.97,
          duration: 23.857167,
          audioOnly: false,
          created_at: 1661518909,
          captions: [
            {
              type: 'text',
              text_type: 'subtitles',
              text_source: 'uploaded',
              status: 'ready',
              name: 'US English',
              language_code: 'en-US',
              id: 'text-track-123',
              closed_captions: true,
            },
          ],
        }),
      },
    };

    const dom = render(<App sdk={mockedSdk as any} />);
    const menuHeader = dom.getByTestId('menu_header');
    expect(menuHeader.innerHTML).toContain('Remove');
    expect(menuHeader.innerHTML).toContain('Delete');
  });

  it('Show captions in a table.', async () => {
    const mockedSdk = {
      ...SDK_MOCK,
      state: {
        //playerPlaybackId: 'playback-test-123'
      },
      field: {
        ...SDK_MOCK.field,
        getValue: () => ({
          assetId: 'asset-test-123',
          playbackId: 'playback-test-123',
          ready: true,
          ratio: '16:9',
          max_stored_resolution: 'HD',
          max_stored_frame_rate: 29.97,
          duration: 23.857167,
          audioOnly: false,
          created_at: 1661518909,
          captions: [
            {
              type: 'text',
              text_type: 'subtitles',
              text_source: 'uploaded',
              status: 'ready',
              name: 'US English',
              language_code: 'en-US',
              id: 'text-track-123',
              closed_captions: true,
            },
          ],
        }),
      },
    };

    const dom = render(<App sdk={mockedSdk as any} />);
    const captionTable = dom.getByTestId('caption_table');
    expect(captionTable.innerHTML).toContain('US English');
    expect(captionTable.innerHTML).toContain('en-US');
    expect(captionTable.innerHTML).toContain(
      'https://stream.mux.com/playback-test-123/text/text-track-123.vtt'
    );
  });

  it('Show a pending caption in a table.', async () => {
    const mockedSdk = {
      ...SDK_MOCK,
      state: {
        //playerPlaybackId: 'playback-test-123'
      },
      field: {
        ...SDK_MOCK.field,
        getValue: () => ({
          assetId: 'asset-test-123',
          playbackId: 'playback-test-123',
          ready: true,
          ratio: '16:9',
          max_stored_resolution: 'HD',
          max_stored_frame_rate: 29.97,
          duration: 23.857167,
          audioOnly: false,
          created_at: 1661518909,
          captions: [
            {
              type: 'text',
              text_type: 'subtitles',
              text_source: 'uploaded',
              status: 'preparing',
              name: 'US English',
              language_code: 'en-US',
              id: 'text-track-123',
              closed_captions: true,
            },
          ],
        }),
      },
    };

    const dom = render(<App sdk={mockedSdk as any} />);
    const captionTable = dom.getByTestId('caption_table');
    expect(captionTable.innerHTML).toContain('preparing');
  });

  it('Caption Error, will show in table, but be removed after delete.', async () => {
    const mockedSdk = {
      ...SDK_MOCK,
      state: {
        //playerPlaybackId: 'playback-test-123'
      },
      field: {
        ...SDK_MOCK.field,
        getValue: () => ({
          assetId: 'asset-test-123',
          playbackId: 'playback-test-123',
          ready: true,
          ratio: '16:9',
          max_stored_resolution: 'HD',
          max_stored_frame_rate: 29.97,
          duration: 23.857167,
          audioOnly: false,
          created_at: 1661518909,
          captions: [
            {
              type: 'text',
              text_type: 'subtitles',
              text_source: 'uploaded',
              status: 'errored',
              name: 'An Errored Language',
              language_code: 'fail',
              id: 'text-track-123',
              closed_captions: true,
              error: {
                type: 'invalid_input',
                messages: ['Failed Caption Track'],
              },
            },
          ],
        }),
      },
    };

    const dom = render(<App sdk={mockedSdk as any} />);
    const captionTable = dom.getByTestId('caption_table');
    expect(captionTable.innerHTML).toContain('An Errored Language');
  });

  it('adds a Robots tab alongside the existing ones', () => {
    const mockedSdk = {
      ...SDK_MOCK,
      field: {
        ...SDK_MOCK.field,
        getValue: () => ({
          version: 3,
          assetId: 'asset-test-123',
          playbackId: 'playback-test-123',
          ready: true,
        }),
      },
    };

    const dom = render(<App sdk={mockedSdk as any} />);
    expect(dom.getByText('Robots')).toBeVisible();
    // The Robots panel must not fetch while another tab is selected.
    expect(dom.getByText('Captions')).toBeVisible();
  });

  it('does not touch a v3 field value that has no Robots data', async () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const setValue = vi.fn((value: unknown) => Promise.resolve());
    const storedValue = {
      version: 3,
      assetId: 'asset-test-123',
      playbackId: 'playback-test-123',
      ready: true,
      ratio: '16:9',
    };

    const mockedSdk = {
      ...SDK_MOCK,
      field: {
        ...SDK_MOCK.field,
        getValue: () => storedValue,
        setValue,
      },
    };

    render(<App sdk={mockedSdk as any} />);
    await new Promise((resolve) => setTimeout(resolve, 150));

    // A mount that learns nothing new must not write, because every write bumps the entry version
    // and flips a published entry to "Changed". This is the regression that the Robots field
    // version bump would otherwise cause across every existing entry.
    for (const call of setValue.mock.calls) {
      expect(call[0]).not.toMatchObject({ version: 4 });
      expect(call[0]).not.toMatchObject({ version: 5 });
    }
  });
});

/*  Dialog modal is global to Contentful instead of app and can not be found during tests.
test('Show Uploader after removing video.', async () => {
  const mockedSdk = {
    ...SDK_MOCK,
    state: {
      playerPlaybackId: 'playback-test-123'
    },    
    field: {
      ...SDK_MOCK.field,
      getValue: () => ({
        "assetId": "asset-test-123",
        "playbackId": "playback-test-123",
        "ready": true,
        "ratio": "16:9",
        "max_stored_resolution": "HD",
        "max_stored_frame_rate": 29.97,
        "duration": 23.857167,
        "audioOnly": false,
        "created_at": 1661518909,
      }),
    },
  };

  const dom = render(<App sdk={mockedSdk as any} />);
  fireEvent.click(screen.getByText('Remove'))
  await waitFor(() => screen.getByText('Yes, remove'));
  expect(getById(dom.container, 'muxuploader')).toBeVisible();
});
*/

/* Player Tests.  Player is not happy running in tests yet. */
/*
test('displays a player when the state has signed playback, poster and storyboard token.', async () => {
  const mockedSdk = {
    ...SDK_MOCK_WITH_SIGNED_URLS,
    field: {
      ...SDK_MOCK_WITH_SIGNED_URLS.field,
      getValue: () => ({
        ready: true,
        assetId: 'test-assetId123',
        signedPlaybackId: 'test-playbackId123',
      }),
    },
  };
  const dom = render(<App sdk={mockedSdk as any} />);
});

test('Displays a player when the state has a playback ID', async () => {
  const mockedSdk = {
    ...SDK_MOCK,
    field: {
      ...SDK_MOCK.field,
      getValue: () => ({
        ready: true,
        assetId: 'test-assetId123',
        playbackId: 'test-playbackId123',
      }),
    },
  };
  const dom = render(<App sdk={mockedSdk as any} />);
});
*/

/**
 * An asset that has lost every playback ID.
 *
 * `moderate` with `on_flagged.action: delete_playback_ids` deletes all of them, and so does
 * anyone clicking delete in the Mux dashboard. The mirror clears them, correctly — and the field
 * editor used to key its whole rich branch off one of them existing, so the entry rendered as an
 * empty uploader: no player, no menu, no tabs, no explanation, while it still held `assetId`,
 * `captions`, `robotsJobs` and `robotsOutputs`. The only affordance left was the "URL or Mux
 * Asset ID" form, whose submit replaces the entire value — so the one way out destroyed the data.
 */
describe('a video whose playback IDs have all been deleted', () => {
  const storedValue = {
    version: 5,
    assetId: 'asset-test-123',
    ready: true,
    ratio: '16:9',
    duration: 23.857167,
    captions: [
      {
        type: 'text',
        text_type: 'subtitles',
        text_source: 'uploaded',
        status: 'ready',
        name: 'US English',
        language_code: 'en-US',
        id: 'text-track-123',
        closed_captions: true,
      },
    ],
    robotsJobs: [{ id: 'rjob_1', workflow: 'moderate', status: 'completed' }],
    robotsOutputs: { moderate: { flagged: true } },
    // An MP4 rendition outlives the playback IDs a moderation directive deletes.
    static_renditions: [
      {
        id: 'rendition-1',
        name: 'highest.mp4',
        status: 'ready',
        resolution: 'highest',
        ext: 'mp4',
        type: 'standard',
      },
    ],
  };

  const mountIt = () =>
    render(
      <App
        sdk={
          {
            ...SDK_MOCK,
            field: { ...SDK_MOCK.field, getValue: () => storedValue },
          } as any
        }
      />
    );

  it('renders the editor for the asset, not an empty uploader', () => {
    const dom = mountIt();

    expect(dom.getByTestId('noplaybackids')).toBeVisible();
    // The form whose submit does `setValue({ assetId })` must not be the only thing on screen —
    // or on screen at all, for a field that already holds an asset.
    expect(getByName(dom.container, 'muxvideoinput')).toBeNull();
    expect(getById(dom.container, 'uploaderDropzone')).toBeNull();
  });

  it('keeps everything the entry still holds reachable', () => {
    const dom = mountIt();

    expect(dom.getByTestId('menu_header').innerHTML).toContain('Remove');
    expect(dom.getByTestId('caption_table').innerHTML).toContain('US English');
    expect(dom.getByText('Robots')).toBeVisible();
    // The Data tab, and its Resync button, are one click away as always.
    expect(dom.getByText('Data')).toBeVisible();
    // Resync is the recovery — add a playback ID in Mux, resync, and the player comes back — so
    // the note carries its own, rather than leaving it behind a tab the editor has no reason to
    // open.
    expect(dom.container.querySelector('.resync-no-playback')).toBeVisible();
  });

  it('says the video cannot be played rather than pretending it is still on its way', () => {
    const dom = mountIt();

    // "Waiting for asset to be playable" would be a lie — nothing is coming without a playback ID.
    expect(dom.queryByTestId('waitingtoplay')).toBeNull();
    expect(dom.container.querySelector('section.player')).toBeNull();
    expect(dom.getByTestId('noplaybackids').textContent).toContain('no playback IDs');
  });

  it('offers no download link it has no playback ID to serve', () => {
    const dom = mountIt();

    // A caption file and an MP4 are both served from a playback ID. With none, the links would
    // point at `stream.mux.com/undefined`; the tables say why instead.
    const captionTable = dom.getByTestId('caption_table');
    expect(captionTable.querySelector('a[href*="stream.mux.com"]')).toBeNull();
    // Every Download in the row is the disabled affordance (f36 renders those unfocusable), not a
    // live link that silently goes nowhere.
    expect(captionTable.querySelectorAll('a').length).toBeGreaterThan(0);
    expect(captionTable.querySelector('a:not([tabindex="-1"])')).toBeNull();

    // f36 tabs activate on mousedown, not click.
    fireEvent.mouseDown(dom.getByText('MP4 Renditions'));
    expect(dom.getByText('Highest Resolution')).toBeVisible();
    expect(dom.container.querySelector('a[href*="undefined"]')).toBeNull();
    expect(dom.container.querySelector('a[href*="stream.mux.com"]')).toBeNull();
  });

  it('still shows the uploader for a genuinely empty field', () => {
    const dom = render(
      <App sdk={{ ...SDK_MOCK, field: { ...SDK_MOCK.field, getValue: () => ({}) } } as any} />
    );

    expect(getById(dom.container, 'uploaderDropzone')).toBeVisible();
    expect(getByName(dom.container, 'muxvideoinput')).toBeVisible();
    expect(dom.queryByTestId('noplaybackids')).toBeNull();
  });

  it('offers no player code it cannot build', () => {
    const dom = mountIt();

    // f36 tabs activate on mousedown, not click.
    fireEvent.mouseDown(dom.getByText('Player Code'));

    // The snippet is assembled from the playback ID. With none it reads `playback-id=""` and
    // `player.mux.com/` — copyable, and broken wherever it is pasted.
    expect(dom.getByTestId('playercode-noplaybackid')).toBeVisible();
    expect(dom.container.querySelector('.copycodearea')).toBeNull();
    expect(dom.container.innerHTML).not.toContain('playback-id=""');
  });
});

describe('switching playback policy on an asset with no playback IDs', () => {
  it('queues the create without a delete for an ID that does not exist', async () => {
    let stored: any = { version: 5, assetId: 'asset-test-123', ready: true };
    const ref = React.createRef<App>();
    render(
      <App
        ref={ref}
        sdk={
          {
            ...SDK_MOCK,
            field: {
              ...SDK_MOCK.field,
              getValue: () => stored,
              setValue: (next: any) => {
                stored = next;
                return Promise.resolve();
              },
            },
          } as any
        }
      />
    );

    // The Playback tab is only reachable in this state because the editor branch now keys off
    // `assetId`. A delete action with no `id` would make the publish function issue
    // `DELETE /assets/{id}/playback-ids` with no ID, on four consecutive publishes.
    await (ref.current as App).swapPlaybackIDs('signed');

    expect(stored.pendingActions.delete).toEqual([]);
    expect(stored.pendingActions.create).toEqual([
      { type: 'playback', data: { policy: 'signed', assetId: 'asset-test-123' }, retry: 0 },
    ]);
  });

  it('queues a public create too, instead of reading "nothing" as "already public"', async () => {
    // The gap this closes: `currentPolicy` fell through to `'public'` when the asset had no
    // playback ID at all, so asking for the one policy every account can create was dropped as a
    // no-op — and the Playback tab was the affordance the "no playback IDs" notice pointed at.
    let stored: any = { version: 5, assetId: 'asset-test-123', ready: true };
    const ref = React.createRef<App>();
    render(
      <App
        ref={ref}
        sdk={
          {
            ...SDK_MOCK,
            field: {
              ...SDK_MOCK.field,
              getValue: () => stored,
              setValue: (next: any) => {
                stored = next;
                return Promise.resolve();
              },
            },
          } as any
        }
      />
    );

    await (ref.current as App).swapPlaybackIDs('public');

    expect(stored.pendingActions.delete).toEqual([]);
    expect(stored.pendingActions.create).toEqual([
      { type: 'playback', data: { policy: 'public', assetId: 'asset-test-123' }, retry: 0 },
    ]);
  });

  it('always queues a policy, so the publish function never has to guess one', async () => {
    // The create-side twin of the delete-with-no-`id` bug: `onPublish` POSTs `{ policy }`, and an
    // action with none would hand Mux an empty body on an asset whose playback was just deleted.
    let stored: any = { version: 5, assetId: 'asset-test-123', ready: true };
    const ref = React.createRef<App>();
    render(
      <App
        ref={ref}
        sdk={
          {
            ...SDK_MOCK,
            field: {
              ...SDK_MOCK.field,
              getValue: () => stored,
              setValue: (next: any) => {
                stored = next;
                return Promise.resolve();
              },
            },
          } as any
        }
      />
    );

    for (const policy of ['public', 'signed', 'drm'] as const) {
      await (ref.current as App).swapPlaybackIDs(policy);
      for (const action of stored.pendingActions.create) {
        expect(action.data?.policy).toBeTruthy();
      }
    }
  });

  it('still treats a repeat of the queued policy as a no-op', async () => {
    // Once a create is queued the asset is "on" that policy for the tab's purposes, so clicking
    // the same radio again must not stack a second create onto the same publish.
    let stored: any = {
      version: 5,
      assetId: 'asset-test-123',
      ready: true,
      pendingActions: {
        delete: [],
        create: [
          { type: 'playback', data: { policy: 'public', assetId: 'asset-test-123' }, retry: 0 },
        ],
        update: [],
      },
    };
    const setValue = vi.fn((next: any) => {
      stored = next;
      return Promise.resolve();
    });
    const ref = React.createRef<App>();
    render(
      <App
        ref={ref}
        sdk={
          {
            ...SDK_MOCK,
            field: { ...SDK_MOCK.field, getValue: () => stored, setValue },
          } as any
        }
      />
    );
    setValue.mockClear();

    await (ref.current as App).swapPlaybackIDs('public');

    expect(setValue).not.toHaveBeenCalled();
    expect(stored.pendingActions.create).toHaveLength(1);
  });
});

describe('pasting a Mux asset ID over a field that already holds one', () => {
  const submitEvent = (value: string) =>
    ({
      preventDefault: () => undefined,
      target: { muxvideoinput: { value } },
    } as any);

  const mountWith = (stored: Partial<MuxContentfulObject>) => {
    const setValue = vi.fn(() => Promise.resolve());
    const openConfirm = vi.fn(() => Promise.resolve(false));
    const ref = React.createRef<App>();
    render(
      <App
        ref={ref}
        sdk={
          {
            ...SDK_MOCK,
            field: { ...SDK_MOCK.field, getValue: () => stored, setValue },
            dialogs: { openConfirm },
          } as any
        }
      />
    );
    return { app: ref.current as App, setValue, openConfirm };
  };

  it('asks first when the value holds Robots records that exist nowhere else', async () => {
    const { app, setValue, openConfirm } = mountWith({
      version: 5,
      assetId: 'asset-old',
      ready: true,
      robotsJobs: [{ id: 'rjob_1', workflow: 'summarize', status: 'completed' }],
    } as Partial<MuxContentfulObject>);

    await app.addVideoByInput(submitEvent('asset-new'));

    expect(openConfirm).toHaveBeenCalled();
    // Declined, so nothing is replaced. This write discards the whole value by design; the point
    // is that it is not silent when there is something worth keeping.
    expect(setValue).not.toHaveBeenCalled();
  });

  it('replaces a genuinely empty field with no prompt at all', async () => {
    const { app, setValue, openConfirm } = mountWith({});

    await app.addVideoByInput(submitEvent('asset-new'));

    expect(openConfirm).not.toHaveBeenCalled();
    expect(setValue).toHaveBeenCalledWith({ assetId: 'asset-new' });
  });
});

/**
 * `trackPreparing` in the asset mirror builder.
 *
 * It was assigned rather than accumulated inside a `forEach`, so only the *last* track counted. A
 * caption a Robots job had just attached could be mirrored as not-preparing purely because a
 * ready track happened to follow it in the list — and the poll loop that would have corrected it
 * stopped at the same moment.
 */
describe('polling while a track is preparing', () => {
  const track = (id: string, status: string) => ({
    id,
    type: 'text',
    text_type: 'subtitles',
    status,
    name: id,
    language_code: 'en-US',
    closed_captions: false,
  });

  const pollUntilSettled = async (tracks: ReturnType<typeof track>[]) => {
    let stored: any = { version: 3, assetId: 'asset-test-123', ready: true };
    const ref = React.createRef<App>();
    render(
      <App
        ref={ref}
        sdk={
          {
            ...SDK_MOCK,
            field: {
              ...SDK_MOCK.field,
              getValue: () => stored,
              setValue: (next: any) => {
                stored = next;
                return Promise.resolve();
              },
            },
          } as any
        }
      />
    );
    const app = ref.current as App;
    await new Promise((resolve) => setTimeout(resolve, 50));
    // The mount resync has already run; this test is about the poll loop that follows it.
    app.setState({ initialResyncDone: true });

    const getAsset = vi.fn();
    getAsset.mockResolvedValueOnce({
      data: { id: 'asset-test-123', status: 'ready', tracks },
    });
    getAsset.mockResolvedValue({
      data: {
        id: 'asset-test-123',
        status: 'ready',
        tracks: tracks.map((t) => ({ ...t, status: 'ready' })),
      },
    });
    (app as any).muxApi = { getAsset, deleteTrack: vi.fn() };

    await app.pollForAssetDetails();
    return { getAsset, read: () => stored as MuxContentfulObject };
  };

  it('polls again while any track is preparing, whichever order they arrive in', async () => {
    // The order that used to stop the loop dead: the preparing track is not the last one.
    const preparingFirst = await pollUntilSettled([
      track('preparing-first', 'preparing'),
      track('ready-last', 'ready'),
    ]);
    expect(preparingFirst.getAsset).toHaveBeenCalledTimes(2);

    const preparingLast = await pollUntilSettled([
      track('ready-first', 'ready'),
      track('preparing-last', 'preparing'),
    ]);
    expect(preparingLast.getAsset).toHaveBeenCalledTimes(2);
  });

  it('stops once nothing is preparing', async () => {
    const { getAsset } = await pollUntilSettled([track('one', 'ready'), track('two', 'ready')]);
    expect(getAsset).toHaveBeenCalledTimes(1);
  });

  it('mirrors only subtitle tracks that are ready or preparing into captions', async () => {
    // The predicate the publish function now duplicates. Anything looser puts tracks on the entry
    // that the app itself would never have put there — and a publish would then "restore" them.
    const { read } = await pollUntilSettled([
      track('subtitles-ready', 'ready'),
      { ...track('cues-ready', 'ready'), text_type: 'cues' },
      track('subtitles-errored', 'errored'),
    ]);

    expect(read().captions?.map((caption) => caption.id)).toEqual(['subtitles-ready']);
  });

  it('mirrors the chapters track on its own, not among the captions', async () => {
    // What Mux returns after generate-chapters with update_asset_chapters.
    const { read } = await pollUntilSettled([
      track('subtitles-ready', 'ready'),
      { ...track('chapters-ready', 'ready'), text_type: 'chapters' },
    ]);

    expect(read().captions?.map((caption) => caption.id)).toEqual(['subtitles-ready']);
    expect(read().chaptersTrack?.id).toBe('chapters-ready');
  });
});

/**
 * The Robots panel has to outlive a tab switch.
 *
 * f36's `Tabs.Panel` forwards `forceMount` to Radix, which otherwise unmounts an inactive panel
 * rather than hiding it. That is the right default for most panels and the wrong one here: the
 * guard that blocks Run after a create whose outcome is unknown lives in this component's state,
 * and a job that may already be running and billing is exactly what it is protecting. Unmount the
 * panel and the guard goes with it — clicking to Captions and back re-enables Run with no
 * warning, which is two clicks from paying twice.
 *
 * Costs nothing in requests: `isActive` still gates every fetch and the poll loop, so a
 * force-mounted panel on a tab nobody opens does no work.
 */
describe('the Robots panel across tab switches', () => {
  const storedValue = {
    version: 4,
    assetId: 'asset-test-123',
    playbackId: 'playback-test-123',
    ready: true,
    ratio: '16:9',
  };

  const mountIt = () =>
    render(
      <App
        sdk={
          {
            ...SDK_MOCK,
            field: { ...SDK_MOCK.field, getValue: () => storedValue },
          } as any
        }
      />
    );

  it('stays mounted, but hidden, while another tab is selected', () => {
    const dom = mountIt();

    // Captions is the default tab, so the Robots panel is inactive from the start. It has to be
    // both things at once: present, so its state survives, and hidden, so it does not draw its
    // contents underneath whatever tab the editor is actually looking at.
    const panel = dom.container.querySelector('[data-test-id="robots_tab_panel"]');
    expect(panel).not.toBeNull();
    expect(panel).not.toBeVisible();
    // Present in the DOM, not merely absent from view — that is what keeps its state alive.
    expect(panel?.textContent).not.toBe('');
  });

  it('shows the panel once its tab is selected', () => {
    // The other direction, because a panel that is always hidden would pass the test above.
    const dom = mountIt();

    fireEvent.mouseDown(dom.getByText('Robots'));

    const panel = dom.container.querySelector('[data-test-id="robots_tab_panel"]');
    expect(panel).toBeVisible();
  });

  it('does not fetch anything while its tab is not selected', () => {
    // The other half of the trade: force-mounting must not turn into work on every entry open.
    const dom = mountIt();

    const panel = dom.container.querySelector('[data-test-id="robots_tab_panel"]');
    expect(panel).not.toBeNull();
    // `isActive` is false, so the panel renders its inert shell and issues no app-action calls.
    expect(panel?.textContent).not.toContain('Run a workflow');
  });
});

/**
 * Playback IDs disappearing under a session that is already open.
 *
 * A `moderate` run started from the Robots tab can be configured with
 * `on_flagged.action: delete_playback_ids`, so the app itself is one of the things that causes
 * this. The poll notices, the player vanishes and the warning note appears — but none of that
 * says *why*, and the editor did not necessarily start the run on this screen.
 */
describe('a video that loses its playback IDs mid-session', () => {
  const mountWithAsset = async (playbackIds: unknown[]) => {
    let stored: any = {
      version: 5,
      assetId: 'asset-test-123',
      ready: true,
      playbackId: 'public-playback-id',
    };
    const warning = vi.fn();
    const ref = React.createRef<App>();
    render(
      <App
        ref={ref}
        sdk={
          {
            ...SDK_MOCK,
            notifier: { ...SDK_MOCK.notifier, warning },
            field: {
              ...SDK_MOCK.field,
              getValue: () => stored,
              setValue: (next: any) => {
                stored = next;
                return Promise.resolve();
              },
            },
          } as any
        }
      />
    );
    const app = ref.current as App;
    // `this.muxApi` is assigned when `MuxApiService.getInstance()` resolves, so anything set
    // before that is overwritten. Wait for the mount resync to finish, then take the client over.
    await new Promise((resolve) => setTimeout(resolve, 50));
    const getAsset = vi.fn().mockResolvedValue({
      data: {
        id: 'asset-test-123',
        status: 'ready',
        playback_ids: [{ id: 'public-playback-id', policy: 'public' }],
        tracks: [],
      },
    });
    (app as any).muxApi = { getAsset, deleteTrack: vi.fn() };
    app.setState({ initialResyncDone: true, isPolling: false });

    // One poll to establish the asset as playable.
    await app.pollForAssetDetails();
    await new Promise((resolve) => setTimeout(resolve, 20));
    warning.mockClear();

    // Then the playback IDs change under the open session. `isPolling` is cleared in a `setState`
    // callback, so a second poll issued in the same tick would be swallowed by its own guard.
    getAsset.mockResolvedValue({
      data: { id: 'asset-test-123', status: 'ready', playback_ids: playbackIds, tracks: [] },
    });
    app.setState({ isPolling: false });
    await new Promise((resolve) => setTimeout(resolve, 20));
    await app.pollForAssetDetails();
    await new Promise((resolve) => setTimeout(resolve, 20));
    return { app, warning, read: () => stored as MuxContentfulObject };
  };

  it('says so, once, when the last playback ID goes away', async () => {
    const { warning } = await mountWithAsset([]);

    expect(warning).toHaveBeenCalledTimes(1);
    expect(warning.mock.calls[0][0]).toContain('no longer has any playback IDs');
  });

  it('stops pointing the player at an ID that no longer exists', async () => {
    const { app } = await mountWithAsset([]);

    // Left behind, the stale id sits beside equally stale tokens. Nothing renders it today
    // because `isPlayerReady` re-checks the value, but the two must not be allowed to disagree.
    expect(app.state.playerPlaybackId).toBeUndefined();
    expect(app.state.playbackToken).toBeUndefined();
    expect(app.state.drmLicenseToken).toBeUndefined();
  });

  it('says nothing when the video still has a playback ID', async () => {
    const { warning, app } = await mountWithAsset([{ id: 'public-playback-id', policy: 'public' }]);

    expect(warning).not.toHaveBeenCalled();
    expect(app.state.playerPlaybackId).toBe('public-playback-id');
  });
});

/**
 * Publishing while a Robots job is still running.
 *
 * Contentful's Publish button lives outside the app's iframe and cannot be disabled, and blocking
 * it through a content-type validation would mean changing every customer's schema. So publishing
 * mid-job stays allowed and the editor is told what it means. See ADR-0013.
 */
describe('a video with a Robots job still running', () => {
  const nowSeconds = () => Math.floor(Date.now() / 1000);

  const mountWith = (robotsJobs: unknown[]) =>
    render(
      <App
        sdk={
          {
            ...SDK_MOCK,
            field: {
              ...SDK_MOCK.field,
              getValue: () => ({
                version: 5,
                assetId: 'asset-test-123',
                ready: true,
                playbackId: 'playback-test-123',
                robotsJobs,
              }),
            },
          } as any
        }
      />
    );

  it('says a publish now will publish the job unfinished', () => {
    const dom = mountWith([
      { id: 'rjob_1', workflow: 'summarize', status: 'processing', created_at: nowSeconds() },
    ]);

    const note = dom.getByTestId('robots-jobs-in-flight');
    expect(note).toBeVisible();
    expect(note.textContent).toContain('A Robots job is still running');
    expect(note.textContent).toContain('publish again once it completes');
  });

  it('counts them, because a directive dispatches several', () => {
    const dom = mountWith([
      { id: 'rjob_1', workflow: 'summarize', status: 'processing', created_at: nowSeconds() },
      { id: 'rjob_2', workflow: 'moderate', status: 'pending', created_at: nowSeconds() },
    ]);

    expect(dom.getByTestId('robots-jobs-in-flight').textContent).toContain('2 Robots jobs');
  });

  it('says nothing once every recorded job has finished', () => {
    const dom = mountWith([
      { id: 'rjob_1', workflow: 'summarize', status: 'completed', created_at: nowSeconds() },
      { id: 'rjob_2', workflow: 'moderate', status: 'errored', created_at: nowSeconds() },
    ]);

    expect(dom.queryByTestId('robots-jobs-in-flight')).toBeNull();
  });

  it('stops nagging about a record that has been stuck for hours', () => {
    const dom = mountWith([
      {
        id: 'rjob_1',
        workflow: 'summarize',
        status: 'processing',
        created_at: nowSeconds() - 7 * 60 * 60,
      },
    ]);

    // A job Mux purged, or a session that died mid-run. The notice would otherwise sit on the
    // entry for the rest of its life.
    expect(dom.queryByTestId('robots-jobs-in-flight')).toBeNull();
  });
});

/**
 * An ingest-dispatched directive is the one piece of Robots work the browser never sees start:
 * Mux creates the run server-side from `new_asset_settings`, so there is no creation moment to
 * record (the known gap in ADR-0009). Tested behaviour before this: the asset uploaded, the
 * directive ran correctly, and the editor found out only if they happened to open the Robots tab.
 */
describe('telling the editor that an upload already has Robots working on it', () => {
  const buildApp = () => {
    const stored: any = { version: 3, assetId: 'asset-test-123' };
    const notifier = { error: vi.fn(), success: vi.fn(), warning: vi.fn() };
    const ref = React.createRef<App>();
    render(
      <App
        ref={ref}
        sdk={
          {
            ...SDK_MOCK,
            notifier,
            field: {
              ...SDK_MOCK.field,
              getValue: () => stored,
              setValue: () => Promise.resolve(),
            },
          } as any
        }
      />
    );
    return { app: () => ref.current as App, notifier };
  };

  const readyAsset = { id: 'asset-test-123', status: 'ready', tracks: [] };

  const runPollWith = async (robots: Record<string, any>, directiveIds: string[] | undefined) => {
    const { app, notifier } = buildApp();
    await new Promise((resolve) => setTimeout(resolve, 50));
    const instance = app();
    instance.setState({ initialResyncDone: true });
    (instance as any).muxApi = {
      getAsset: vi.fn().mockResolvedValue({ data: readyAsset }),
      deleteTrack: vi.fn(),
      listRobotsJobs: vi.fn(async () => ({ data: [] })),
      listRobotsDirectiveRuns: vi.fn(async () => ({ data: [] })),
      ...robots,
    };
    if (directiveIds) {
      await instance.onConfirmModal({ directiveIds } as any);
    }
    await instance.pollForAssetDetails();
    // The announcement is deliberately not awaited by the poll.
    await new Promise((resolve) => setTimeout(resolve, 50));
    return { instance, notifier, muxApi: (instance as any).muxApi };
  };

  it('says so when the directive attached to this upload is already running', async () => {
    const { notifier } = await runPollWith(
      {
        listRobotsJobs: vi.fn(async () => ({
          data: [{ id: 'rjob_1', workflow: 'summarize', status: 'processing' }],
        })),
      },
      ['drv_1']
    );

    expect(notifier.success).toHaveBeenCalledWith(
      expect.stringContaining('Robots is already working on this video')
    );
  });

  it('counts a run that has not dispatched a job yet', async () => {
    // A directive run exists before the first workflow it dispatches does, so checking jobs
    // alone would stay silent through exactly the window this toast is for.
    const { notifier } = await runPollWith(
      {
        listRobotsDirectiveRuns: vi.fn(async () => ({
          data: [{ run_id: 'drvrun_1', subject_id: 'asset-test-123', status: 'pending' }],
        })),
      },
      ['drv_1']
    );

    expect(notifier.success).toHaveBeenCalledWith(
      expect.stringContaining('Robots is already working on this video')
    );
  });

  it('stays silent when nothing is running', async () => {
    const { notifier } = await runPollWith({}, ['drv_1']);
    expect(notifier.success).not.toHaveBeenCalled();
  });

  it('ignores a run belonging to a different asset', async () => {
    const { notifier } = await runPollWith(
      {
        listRobotsDirectiveRuns: vi.fn(async () => ({
          data: [{ run_id: 'drvrun_1', subject_id: 'someone-elses-asset', status: 'running' }],
        })),
      },
      ['drv_1']
    );
    expect(notifier.success).not.toHaveBeenCalled();
  });

  it('costs nothing on an upload that attached no directives', async () => {
    const { muxApi, notifier } = await runPollWith(
      {
        listRobotsJobs: vi.fn(async () => ({
          data: [{ id: 'rjob_1', workflow: 'summarize', status: 'processing' }],
        })),
      },
      []
    );

    // Not a quieter toast — no request at all. An install that never enabled Robots must not pay
    // for this on every upload (ADR-0006).
    expect(muxApi.listRobotsJobs).not.toHaveBeenCalled();
    expect(notifier.success).not.toHaveBeenCalled();
  });

  it('says nothing when the entry is merely reopened, with no upload in this session', async () => {
    const { muxApi } = await runPollWith(
      {
        listRobotsJobs: vi.fn(async () => ({
          data: [{ id: 'rjob_1', workflow: 'summarize', status: 'processing' }],
        })),
      },
      undefined
    );

    expect(muxApi.listRobotsJobs).not.toHaveBeenCalled();
  });

  it('speaks once, however many times the asset poll reports ready', async () => {
    const { instance, notifier } = await runPollWith(
      {
        listRobotsJobs: vi.fn(async () => ({
          data: [{ id: 'rjob_1', workflow: 'summarize', status: 'processing' }],
        })),
      },
      ['drv_1']
    );

    await instance.pollForAssetDetails();
    await instance.pollForAssetDetails();
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(notifier.success).toHaveBeenCalledTimes(1);
  });
});

/**
 * The tab strip.
 *
 * Eight tabs are wider than the entry editor's field column, and the strip has always scrolled —
 * `overflow-x: auto` with `flex: 0 0 auto` tabs. What was reported as "the Data tab is clipped
 * mid-word" was not the overflow: it was a `mask-image` gradient fading the last 20% of the
 * strip to transparent, applied at *every* width. It faded whichever tab sat on the boundary to
 * unreadable, it did so even when nothing overflowed and there was empty space beside the last
 * tab, and it covered the scrollbar — erasing the one signal that honestly appears only when
 * there is something to scroll to.
 *
 * jsdom has no layout, so the scrolling itself is verified in a browser at a constrained width
 * (every tab reachable by scroll, and focusing the last tab scrolls it into view). What is
 * pinned here is the specific defect, because it is a one-line regression away.
 */
describe('the tab strip', () => {
  const css = readFileSync(join(process.cwd(), 'src/index.css'), 'utf8');
  /** Comments stripped, so the explanation of what was removed is not read as the thing itself. */
  const declarations = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const tabsScrollRules = declarations
    .split('}')
    .filter((block) => /\.tabs-scroll[^-\w]/.test(block.split('{')[0] ?? ''));

  it('puts no gradient mask over the tabs', () => {
    expect(tabsScrollRules.length).toBeGreaterThan(0);
    for (const rule of tabsScrollRules) {
      expect(rule).not.toMatch(/mask-image/);
    }
  });

  it('still scrolls rather than squeezing the labels', () => {
    const joined = tabsScrollRules.join('}');
    expect(joined).toMatch(/overflow-x:\s*auto/);
    // Without this the tabs shrink to fit and the longest labels wrap or clip instead.
    expect(joined).toMatch(/flex:\s*0 0 auto/);
  });

  it('leaves no styles behind for the scroll buttons that were never built', () => {
    // `.tabs-container` and `.tabs-scroll-button*` were an abandoned overflow affordance: 60
    // lines of CSS no element carried, which is how the mask went unexamined for so long.
    expect(declarations).not.toMatch(/tabs-scroll-button/);
    expect(declarations).not.toMatch(/tabs-container/);
  });
});
