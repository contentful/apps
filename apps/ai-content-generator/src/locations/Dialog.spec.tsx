import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MockSdk } from '../../test/mocks';
import Dialog from './Dialog';

const mockSdk = new MockSdk();
const sdk = mockSdk.sdk;
const cma = sdk.cma;

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => sdk,
  useCMA: () => cma,
}));

describe('Dialog component', () => {
  it('Component text exists', () => {
    // const { getByText } = render(<Dialog />);
    // expect(getByText('Hello Dialog Component (AppId: test-app)')).toBeTruthy();
  });
});
