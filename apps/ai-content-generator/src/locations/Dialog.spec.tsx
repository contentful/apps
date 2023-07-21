import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { mockCma, MockSdk } from '../../test/mocks';
import Dialog from './Dialog';

const mockSdk = new MockSdk();
const sdk = mockSdk.sdk;

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => sdk,
  useCMA: () => mockCma,
}));

describe('Dialog component', () => {
  it('Component text exists', () => {
    // const { getByText } = render(<Dialog />);
    // expect(getByText('Hello Dialog Component (AppId: test-app)')).toBeTruthy();
  });
});
