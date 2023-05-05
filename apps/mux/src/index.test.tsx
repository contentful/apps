/* eslint-disable  @typescript-eslint/no-explicit-any */

import * as React from 'react';
import { render, queryByAttribute } from '@testing-library/react';
import '@testing-library/jest-dom';
import { App } from './';

/*
 * This was a valid private key, but it has since been revoked
 */

const SDK_MOCK = {
  state: {
    isDeleting: false,
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
    onValueChanged: () => ({}),
    setValue: () => ({}),
  },
  window: {
    startAutoResizer: () => null,
  },
};

const getById = queryByAttribute.bind(null, 'id');
const getByName = queryByAttribute.bind(null, 'name');

test('throws an error if required installation parameters are not configured', () => {
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

test('displays an error when we have a signed playbackId but no signing keys', async () => {
  const mockedSdk = {
    ...SDK_MOCK,
    state: {
      playbackToken: undefined,
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
  const error = dom.getByTestId('nosigningtoken');
  expect(error).toBeVisible();
  expect(error.innerText || error.textContent).toContain('No signing key');
});

test('Displays Mux Uploader before user does anything.', () => {
  const mockedSdk = { ...SDK_MOCK };

  const dom = render(<App sdk={mockedSdk as any} />);
  expect(getById(dom.container, 'muxuploader')).toBeVisible(); // Add prop to Note
  expect(getByName(dom.container, 'muxvideoinput')).toBeVisible(); // Add prop to Note
});

test('displays a loading state between the asset getting created and waiting for it to be ready', () => {
  const mockedSdk = {
    ...SDK_MOCK,
    field: {
      ...SDK_MOCK.field,
      getValue: () => ({
        assetId: 'abcd1234',
        ready: false,
      }),
    },
  };

  const dom = render(<App sdk={mockedSdk as any} />);
  expect(dom.getByTestId('waitingtoplay')).toBeVisible();
});

test('displays an error if the asset is errored', () => {
  const mockedSdk = {
    ...SDK_MOCK,
    field: {
      ...SDK_MOCK.field,
      getValue: () => ({
        error: 'Input file does not contain a duration',
      }),
    },
  };

  const dom = render(<App sdk={mockedSdk as any} />);
  const error = dom.getByTestId('terminalerror');
  expect(error.innerText || error.textContent).toContain('Input file does not contain a duration');
});

test('Show Remove and Delete buttons when there is a valid player', async () => {
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

test('Show captions in a table.', async () => {
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

test('Show a pending caption in a table.', async () => {
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

test('Caption Error, will show in table, but be removed after delete.', async () => {
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
