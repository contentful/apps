import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MockSdk } from '../../test/mocks';
import EntryEditor from './EntryEditor';

const mockSdk = new MockSdk();
const sdk = mockSdk.sdk;
const cma = sdk.cma;

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => sdk,
  useCMA: () => cma,
}));

describe('Entry component', () => {
  it('Component text exists', () => {
    const { getByText } = render(<EntryEditor />);

    expect(getByText('Hello Entry Editor Component (AppId: test-app)')).toBeTruthy();
  });
});
