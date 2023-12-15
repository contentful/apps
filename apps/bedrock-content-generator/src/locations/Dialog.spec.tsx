import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { mockCma, MockSdk } from '../../test/mocks';
import Dialog from './Dialog';

const mockSdk = new MockSdk();
const sdk = mockSdk.sdk;

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => sdk,
  useCMA: () => mockCma,
  useAutoResizer: () => {},
}));

describe('Dialog component', () => {
  it('renders', () => {
    const { getByText } = render(<Dialog />);
    expect(getByText('Select a source field and output field to generate a title')).toBeTruthy();
  });
});
