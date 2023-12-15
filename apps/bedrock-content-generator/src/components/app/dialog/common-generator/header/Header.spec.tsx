import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { mockCma, MockSdk } from '@test/mocks';
import Header from './Header';

const mockSdk = new MockSdk();
const sdk = mockSdk.sdk;

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => sdk,
  useCMA: () => mockCma,
  useAutoResizer: () => {},
}));

describe('Header component', () => {
  it('renders', () => {
    const { getByAltText, unmount } = render(<Header />);
    expect(getByAltText('Sparkle Icon')).toBeTruthy();
    unmount();
  });
});
