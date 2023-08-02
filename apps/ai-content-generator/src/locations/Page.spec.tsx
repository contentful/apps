import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MockSdk } from '../../test/mocks';
import Page from './Page';

const mockSdk = new MockSdk();
const sdk = mockSdk.sdk;
const cma = sdk.cma;

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => sdk,
  useCMA: () => cma,
}));

describe('Page component', () => {
  it('Component text exists', () => {
    const { getByText } = render(<Page />);

    expect(getByText('Hello Page Component (AppId: test-app)')).toBeTruthy();
  });
});
