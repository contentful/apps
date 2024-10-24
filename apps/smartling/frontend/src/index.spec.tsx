/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { render, fireEvent, cleanup, configure, wait } from '@testing-library/react';
import { locations, AppExtensionSDK } from '@contentful/app-sdk';
import 'whatwg-fetch';
import fetchMock from 'fetch-mock';
import App from './App';
import contentTypeResponse from './mockData/contentTypeResponse.json';
import entryMockResponse from './mockData/entryMockResponse.json';
import { vi } from 'vitest';

configure({
  testIdAttribute: 'data-test-id',
});

let mockSdk: any;
const originalStorage = window.localStorage;

describe('App', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'localStorage', { writable: true, value: originalStorage });
    mockSdk = {
      location: {
        is() {
          return false;
        },
      },
      parameters: {
        installation: {
          projectId: 'project-id-123',
        },
      },
      window: {
        startAutoResizer() {},
      },
      locales: {
        names: {
          'en-US': 'English (United State)',
          'de-DE': 'German (Germany)',
        },
      },
      ids: {
        app: 'smartling-app-id',
        entry: 'entry-123',
        space: 'space-123',
      },
      app: {
        async setReady() {},
        async onConfigure() {},
        async isInstalled() {
          return false;
        },
        async getParameters() {
          return null;
        },
        async onConfigurationCompleted() {},
      },
      hostnames: {
        webapp: 'app.contentful.com',
      },
      space: {
        async getEditorInterfaces() {
          return {
            items: [],
          };
        },
        async getContentTypes() {
          return contentTypeResponse;
        },
      },
      notifier: {
        error() {},
      },
    };
  });

  afterEach(() => {
    cleanup();
    fetchMock.restore();
  });

  it('should load the AppConfig page and allow for installation', async () => {
    mockSdk.app.onConfigure = vi.fn();
    mockSdk.location.is = (location: string) => location === locations.LOCATION_APP_CONFIG;
    const wrapper = render(<App sdk={mockSdk as any} />);

    const projectInput = await wrapper.findByTestId('projectId');

    fireEvent.change(projectInput, { target: { value: 'project-id-123' } });

    const inputs = await wrapper.findAllByTestId('projectId');

    const authorCT = inputs[0];

    fireEvent.click(authorCT, {});

    await wait();

    expect(await mockSdk.app.onConfigure.mock.calls[0][0]()).toMatchSnapshot();
  });

  it('should fail installation if no projectId is provided', async () => {
    mockSdk.app.onConfigure = vi.fn();
    mockSdk.location.is = (location: string) => location === locations.LOCATION_APP_CONFIG;

    render(<App sdk={mockSdk as any} />);
    await wait();

    expect(await mockSdk.app.onConfigure.mock.calls[0][0]()).toBe(false);
  });

  it('should render the sidebar app with signing and request button', async () => {
    mockSdk.location.is = (location: string) => location === locations.LOCATION_ENTRY_SIDEBAR;
    fetchMock.get('/entry?spaceId=space-123&projectId=project-id-123&entryId=entry-123', {});
    fetchMock.get('/refresh?refresh_token=', 401);
    const wrapper = render(<App sdk={mockSdk as AppExtensionSDK} />);
    await wait();
    expect(wrapper).toMatchSnapshot();
  });

  it('should try to refresh then open the oauth modal', async () => {
    mockSdk.location.is = (location: string) => location === locations.LOCATION_ENTRY_SIDEBAR;
    window.open = vi.fn();

    fetchMock.get('/entry?spaceId=space-123&projectId=project-id-123&entryId=entry-123', {});
    fetchMock.get('/refresh?refresh_token=', 401);

    const wrapper = render(<App sdk={mockSdk as AppExtensionSDK} />);
    const oauthButton = await wrapper.findByTestId('open-dialog');

    oauthButton.click();
    await wait();

    expect(window.open).toHaveBeenCalledWith(
      '/openauth',
      '',
      'height=600,width=600,top=50,left=50'
    );
  });

  it('should get a new refresh token then get the entry', async () => {
    mockSdk.location.is = (location: string) => location === locations.LOCATION_ENTRY_SIDEBAR;
    window.open = vi.fn();

    Object.defineProperty(window, 'localStorage', {
      writable: true,
      value: {
        getItem: vi.fn((item: string) => {
          switch (item) {
            case 'token':
              return 'access-123';
            case 'refreshToken':
              return 'refresh-123';
            default:
              return null;
          }
        }),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      },
    });

    fetchMock.get(
      '/refresh?refresh_token=',
      { access_token: 'access-123' },
      { overwriteRoutes: true }
    );
    fetchMock.get(
      '/entry?spaceId=space-123&projectId=project-id-123&entryId=entry-123',
      entryMockResponse,
      { overwriteRoutes: true }
    );

    const { findByText } = render(<App sdk={mockSdk as AppExtensionSDK} />);
    await wait();

    expect(findByText('refresh-123')).toBeDefined();
  });

  it('should show an error message when getting a general error from Smartling', async () => {
    mockSdk.location.is = (location: string) => location === locations.LOCATION_ENTRY_SIDEBAR;

    Object.defineProperty(window, 'localStorage', {
      writable: true,
      value: {
        getItem: vi.fn((item: string) => {
          switch (item) {
            case 'token':
              return 'access-123';
            case 'refreshToken':
              return 'refresh-123';
            default:
              return null;
          }
        }),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      },
    });

    fetchMock.get('/refresh?refresh_token=', 401, { overwriteRoutes: true });
    fetchMock.get(
      '/entry?spaceId=space-123&projectId=project-id-123&entryId=entry-123',
      {},
      { overwriteRoutes: true }
    );

    const wrapper = render(<App sdk={mockSdk as AppExtensionSDK} />);
    await wait();

    expect(wrapper).toMatchSnapshot();
  });
});
