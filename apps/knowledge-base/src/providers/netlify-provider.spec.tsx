import * as React from 'react';
import { render, act } from '@testing-library/react';
import fetchMock from 'jest-fetch-mock';
import { useNetlify, NetlifyProvider } from './netlify-provider';

jest.useFakeTimers();

function TestComponent() {
  const netlify = useNetlify();

  return (
    <div>
      <button onClick={() => netlify.authorize()}>Authorize</button>
      {netlify.accessToken && <p data-testid="token">{netlify.accessToken}</p>}
      <p data-testid="email">{netlify.userInfo?.email}</p>
      <ul data-testid="sites">
        {netlify.sites?.map((site, index) => (
          <li key={index}>{site.name}</li>
        ))}
      </ul>
    </div>
  );
}

let windowOpenSpy;

beforeEach(() => {
  window.open = jest.fn();
  windowOpenSpy = jest.spyOn(window, 'open');
  windowOpenSpy.mockImplementation(() => ({
    location: {
      href: 'http://test.com/auth#access_token=hello&token_type=Bearer',
    },
  }));

  fetchMock
    .mockIf(/^https:\/\/api.netlify.com\/api\/v1.*$/)
    .mockResponse(async (req) => {
      if (req.url.endsWith('/build_hooks')) {
        return JSON.stringify([
          {
            title: 'Contentful',
            url: 'https://api.netlify.com/build_hooks/contentful',
          },
          {
            title: 'Facebook',
            url: 'https://api.netlify.com/build_hooks/facebook',
          },
        ]);
      }

      if (req.url.includes('/sites')) {
        return JSON.stringify([
          {
            site_id: 1,
            name: 'Site 1',
            build_settings: { contentful: { url: 'http://contentful.com' } },
          },
          {
            site_id: 2,
            name: 'Site 2',
            build_settings: {},
          },
        ]);
      }

      if (req.url.includes('/user')) {
        return JSON.stringify({ email: 'test@test.com' });
      }

      return JSON.stringify({});
    });
});

afterEach(() => {
  windowOpenSpy.mockRestore();
});

describe('<NetlifyProvider />', () => {
  it('should authorize and return the token', async () => {
    const { queryByText, findByTestId } = render(
      <NetlifyProvider>
        <TestComponent />
      </NetlifyProvider>
    );

    act(() => {
      queryByText('Authorize').click();
      jest.runOnlyPendingTimers();
    });

    const token = await findByTestId('token');

    expect(windowOpenSpy).toHaveBeenCalled();
    expect(token).toHaveTextContent('hello');
  });

  it('should list only sites with build settings', async () => {
    const { queryByText, findByTestId } = render(
      <NetlifyProvider>
        <TestComponent />
      </NetlifyProvider>
    );

    act(() => {
      queryByText('Authorize').click();
      jest.runOnlyPendingTimers();
    });

    const sites = await findByTestId('sites');

    expect(sites).toHaveTextContent('Site 1');
    expect(sites).not.toHaveTextContent('Site 2');
  });

  it('should load user info after authorization', async () => {
    const { queryByText, findByTestId } = render(
      <NetlifyProvider>
        <TestComponent />
      </NetlifyProvider>
    );

    act(() => {
      queryByText('Authorize').click();
      jest.runOnlyPendingTimers();
    });

    const email = await findByTestId('email');

    expect(email).toHaveTextContent('test@test.com');
  });
});
