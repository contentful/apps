import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { mockCma, MockSdk } from '../../test/mocks';
import Sidebar from './Sidebar';

const mockSdk = new MockSdk();
const sdk = mockSdk.sdk;

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => sdk,
  useCMA: () => mockCma,
  useAutoResizer: () => {},
}));

describe('Sidebar component', () => {
  it('renders', () => {
    const { getByText } = render(<Sidebar />);
    expect(getByText('Rewrite')).toBeTruthy();
  });
});
