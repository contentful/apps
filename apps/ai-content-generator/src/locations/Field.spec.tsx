import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MockSdk } from '../../test/mocks';
import Field from './Field';

const mockSdk = new MockSdk();
const sdk = mockSdk.sdk;
const cma = sdk.cma;

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => sdk,
  useCMA: () => cma,
}));

describe('Field component', () => {
  it('Component text exists', () => {
    const { getByText } = render(<Field />);

    expect(getByText('Hello Entry Field Component (AppId: test-app)')).toBeTruthy();
  });
});
