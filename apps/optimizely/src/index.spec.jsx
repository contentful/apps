/* global global */
import React from 'react';
import { act, cleanup, render, configure } from '@testing-library/react';

import App from '../src';
import { expect, vi } from 'vitest';
global.window.close = () => {};
global.window.encodeURIComponent = (x) => x;

const LOCATION_ENTRY_SIDEBAR = 'entry-sidebar';
const LOCATION_ENTRY_EDITOR = 'entry-editor';

let LOCATION = '';
let PROJECT_ID = '';
let VALID_FIELDS = false;

function mockSdk() {
  return {
    navigator: {
      openEntry: () => {},
      openNewEntry: () => {},
      onSlideInNavigation: () => {},
    },
    dialogs: {
      selectSingleEntry: () => {},
    },
    parameters: {
      installation: {
        optimizelyProjectId: PROJECT_ID,
      },
    },
    location: {
      is: vi.fn((l) => {
        return l === LOCATION;
      }),
    },
    window: {
      startAutoResizer: () => {},
      stopAutoResizer: () => {},
    },
    ids: {},
    space: {},
    locales: {},
    entry: {
      fields: {
        experimentId: {
          getValue: vi.fn(() => 'exp123'),
          onValueChanged: vi.fn(() => vi.fn()),
        },
        experimentKey: {
          getValue: vi.fn(() => 'exp123'),
          onValueChanged: vi.fn(() => vi.fn()),
        },
        experimentTitle: {
          getValue: vi.fn(() => 'exp123'),
          onValueChanged: vi.fn(() => vi.fn()),
        },
        meta: {
          getValue: vi.fn(),
          onValueChanged: vi.fn(() => vi.fn()),
        },
        variations: {
          getValue: vi.fn(),
          onValueChanged: vi.fn(() => vi.fn()),
        },
      },
      getSys: () => {
        id: '123';
      },
    },
    contentType: {
      sys: {
        space: {
          sys: {
            type: 'Link',
            linkType: 'Space',
            id: 'cyu19ucaypb9',
          },
        },
        id: 'variationContainer',
        type: 'ContentType',
        createdAt: '2019-05-24T07:45:48.863Z',
        updatedAt: '2019-05-30T04:28:43.488Z',
        environment: {
          sys: {
            id: 'master',
            type: 'Link',
            linkType: 'Environment',
          },
        },
        revision: 3,
      },
      name: 'Variation Container',
      description: null,
      displayField: 'experimentTitle',
      fields: [
        {
          id: 'experimentTitle',
          name: 'Experiment title',
          type: 'Symbol',
          localized: false,
          required: false,
          validations: [],
          disabled: false,
          omitted: false,
        },
        {
          id: 'experimentId',
          name: 'Experiment ID',
          type: 'Symbol',
          localized: false,
          required: false,
          validations: [],
          disabled: false,
          omitted: false,
        },
        {
          id: 'meta',
          name: 'Meta',
          type: 'Object',
          localized: false,
          required: false,
          validations: [],
          disabled: false,
          omitted: false,
        },
        {
          id: 'variations',
          name: 'Variations',
          type: 'Array',
          localized: false,
          required: false,
          validations: [],
          disabled: false,
          omitted: false,
          items: {
            type: 'Link',
            validations: [],
            linkType: 'Entry',
          },
        },
      ].concat(
        VALID_FIELDS
          ? {
              id: 'experimentKey',
              name: 'Experiment key',
              type: 'Symbol',
              localized: false,
              required: false,
              validations: [],
              disabled: false,
              omitted: false,
            }
          : []
      ),
    },
  };
}

configure({ testIdAttribute: 'data-test-id' });

const expectedOrigin = new URL(
  import.meta.env.VITE_APP_OPTIMIZELY_OAUTH_REDIRECT_URL || window.location.href
).origin;

function dispatchOAuthMessage(source, data = { token: 'token-1', expires: 123 }) {
  act(() => {
    window.dispatchEvent(new MessageEvent('message', { source, origin: expectedOrigin, data }));
  });
}

function messageHandlers(spy) {
  return spy.mock.calls.filter(([type]) => type === 'message').map(([, handler]) => handler);
}

function renderAuthApp() {
  LOCATION = LOCATION_ENTRY_SIDEBAR;
  const ref = React.createRef();
  const view = render(<App ref={ref} sdk={mockSdk()} />);
  return { ...view, app: ref.current };
}

describe('Optimizely App', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();

    LOCATION = '';
    PROJECT_ID = '';
    VALID_FIELDS = false;
  });

  it('should render the missing project on the sidebar', () => {
    LOCATION = LOCATION_ENTRY_SIDEBAR;
    const sdk = mockSdk();
    const { getByTestId } = render(<App sdk={sdk} />);

    expect(getByTestId('missing-project')).toBeDefined();
  });

  it('should render the sidebar', () => {
    LOCATION = LOCATION_ENTRY_SIDEBAR;
    PROJECT_ID = '123';
    const sdk = mockSdk();
    const { getByTestId } = render(<App sdk={sdk} />);

    expect(getByTestId('sidebar'));
  });

  it('should render the incorrect type message', () => {
    LOCATION = LOCATION_ENTRY_EDITOR;
    PROJECT_ID = '123';
    const sdk = mockSdk();

    const { getByTestId } = render(<App sdk={sdk} />);
    expect(getByTestId('incorrect-type')).toBeDefined();
  });

  it('should render the editor page', () => {
    LOCATION = LOCATION_ENTRY_EDITOR;
    PROJECT_ID = '123';
    VALID_FIELDS = true;
    const sdk = mockSdk();
    vi.spyOn(window.localStorage, 'getItem').mockImplementation(() => {
      return JSON.stringify({
        optToken: 'token',
        optExpire: Date.now() + 24 * 3600 * 1000,
      });
    });

    const { getByTestId } = render(<App sdk={sdk} />);
    expect(getByTestId('editor-page')).toBeDefined();
  });

  it('does not accept OAuth messages without an open popup, including a blocked attempt', () => {
    const addListener = vi.spyOn(window, 'addEventListener');
    const setItem = vi.spyOn(window.localStorage, 'setItem');
    const popup = {};
    const open = vi.spyOn(window, 'open').mockReturnValue(null);
    const { app } = renderAuthApp();

    expect(messageHandlers(addListener)).toHaveLength(0);
    dispatchOAuthMessage(popup);
    act(() => app.openAuth());
    expect(open).toHaveBeenCalledOnce();
    expect(messageHandlers(addListener)).toHaveLength(0);
    dispatchOAuthMessage(popup);

    expect(setItem).not.toHaveBeenCalled();
    expect(app.state.accessToken).toBeNull();
    expect(app.state.client).toBeNull();
  });

  it('accepts only the active popup and expected origin, then consumes its token once', () => {
    const addListener = vi.spyOn(window, 'addEventListener');
    const removeListener = vi.spyOn(window, 'removeEventListener');
    const setItem = vi.spyOn(window.localStorage, 'setItem');
    const popup = {};
    vi.spyOn(window, 'open').mockReturnValue(popup);
    const { app } = renderAuthApp();

    act(() => app.openAuth());
    const [handler] = messageHandlers(addListener);
    expect(handler).toEqual(expect.any(Function));

    dispatchOAuthMessage({});
    act(() => {
      window.dispatchEvent(
        new MessageEvent('message', {
          source: popup,
          origin: 'https://wrong.example',
          data: { token: 'wrong-origin', expires: 123 },
        })
      );
    });
    expect(setItem).not.toHaveBeenCalled();
    expect(app.state.client).toBeNull();
    expect(messageHandlers(removeListener)).toHaveLength(0);

    dispatchOAuthMessage(popup);
    const client = app.state.client;
    dispatchOAuthMessage(popup, { token: 'duplicate', expires: 456 });

    expect(setItem).toHaveBeenCalledOnce();
    expect(setItem).toHaveBeenCalledWith(
      'optCred',
      JSON.stringify({ optToken: 'token-1', optExpire: 123 })
    );
    expect(app.state.accessToken).toBe('token-1');
    expect(app.state.expires).toBe(123);
    expect(client.accessToken).toBe('token-1');
    expect(app.state.client).toBe(client);
    expect(messageHandlers(removeListener)).toEqual([handler]);
  });

  it('replaces the old popup attempt and lets a later attempt complete independently', () => {
    const addListener = vi.spyOn(window, 'addEventListener');
    const removeListener = vi.spyOn(window, 'removeEventListener');
    const setItem = vi.spyOn(window.localStorage, 'setItem');
    const oldPopup = {};
    const currentPopup = {};
    const laterPopup = {};
    vi.spyOn(window, 'open')
      .mockReturnValueOnce(oldPopup)
      .mockReturnValueOnce(currentPopup)
      .mockReturnValueOnce(laterPopup);
    const { app } = renderAuthApp();
    act(() => app.openAuth());
    const [oldHandler] = messageHandlers(addListener);
    act(() => app.openAuth());
    expect(messageHandlers(addListener)).toHaveLength(2);
    expect(messageHandlers(removeListener)).toEqual([oldHandler]);
    dispatchOAuthMessage(oldPopup);
    expect(setItem).not.toHaveBeenCalled();

    dispatchOAuthMessage(currentPopup);
    expect(setItem).toHaveBeenCalledTimes(1);
    expect(app.state.accessToken).toBe('token-1');

    act(() => app.openAuth());
    dispatchOAuthMessage(currentPopup, { token: 'stale', expires: 456 });
    expect(setItem).toHaveBeenCalledTimes(1);
    dispatchOAuthMessage(laterPopup, { token: 'token-2', expires: 789 });
    expect(setItem).toHaveBeenCalledTimes(2);
    expect(app.state.accessToken).toBe('token-2');
    expect(app.state.client.accessToken).toBe('token-2');
  });

  it('removes the active OAuth listener on unmount', () => {
    const addListener = vi.spyOn(window, 'addEventListener');
    const removeListener = vi.spyOn(window, 'removeEventListener');
    const setItem = vi.spyOn(window.localStorage, 'setItem');
    const popup = {};
    vi.spyOn(window, 'open').mockReturnValue(popup);
    const { app, unmount } = renderAuthApp();

    act(() => app.openAuth());
    const [handler] = messageHandlers(addListener);
    unmount();
    dispatchOAuthMessage(popup);

    expect(messageHandlers(removeListener)).toEqual([handler]);
    expect(setItem).not.toHaveBeenCalled();
  });
});
