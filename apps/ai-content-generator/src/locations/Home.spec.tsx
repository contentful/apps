import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MockSdk } from '../../test/mocks';
import Home from './Home';

const mockSdk = new MockSdk();
const sdk = mockSdk.sdk;
const cma = sdk.cma;

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => sdk,
  useCMA: () => cma,
}));

describe('Home component', () => {
  it('Component text exists', () => {
    const { getByText } = render(<Home />);

    expect(getByText('Hello Home Component (AppId: test-app)')).toBeTruthy();
  });
});
