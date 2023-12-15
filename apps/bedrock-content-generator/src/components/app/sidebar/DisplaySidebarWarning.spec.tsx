import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { mockCma, MockSdk } from '../../../../test/mocks';
import DisplaySidebarWarning from './DisplaySidebarWarning';

const mockSdk = new MockSdk();
const sdk = mockSdk.sdk;

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => sdk,
  useCMA: () => mockCma,
}));

describe('Display Sidebar Warning', () => {
  it('renders', () => {
    const { getByText, unmount } = render(
      <DisplaySidebarWarning hasBrandProfile={false} apiError={undefined} />
    );

    expect(getByText('Missing brand profile.')).toBeTruthy();
    unmount();
  });

  it('Renders 401 and 404 error', () => {
    const { getByText, rerender, unmount } = render(
      <DisplaySidebarWarning hasBrandProfile={false} apiError={{ status: 401 }} />
    );

    expect(getByText('Invalid or missing API Key.')).toBeTruthy();

    rerender(<DisplaySidebarWarning hasBrandProfile={false} apiError={{ status: 404 }} />);

    expect(getByText('Invalid or missing API Key.')).toBeTruthy();
    unmount();
  });

  it('Renders 500 and 503 error', () => {
    const { getByText, rerender, unmount } = render(
      <DisplaySidebarWarning hasBrandProfile={false} apiError={{ status: 500 }} />
    );

    expect(getByText('Chat GPT is currently unavailable.')).toBeTruthy();

    rerender(<DisplaySidebarWarning hasBrandProfile={false} apiError={{ status: 503 }} />);

    expect(getByText('Chat GPT is currently unavailable.')).toBeTruthy();
    unmount();
  });

  it('Renders catch all error', () => {
    const { getByText, unmount } = render(
      <DisplaySidebarWarning hasBrandProfile={false} apiError={{ status: 999, message: 'Dog' }} />
    );

    expect(getByText('OpenAI API Error: Dog')).toBeTruthy();
    unmount();
  });
});
