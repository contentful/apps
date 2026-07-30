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
  it('renders brand profile missing warning when hasBrandProfile is false', () => {
    const { getByText, unmount } = render(<DisplaySidebarWarning hasBrandProfile={false} />);

    expect(getByText('Missing brand profile.')).toBeTruthy();
    unmount();
  });

  it('renders nothing when hasBrandProfile is true', () => {
    const { container, unmount } = render(<DisplaySidebarWarning hasBrandProfile={true} />);

    expect(container.firstChild).toBeNull();
    unmount();
  });
});
