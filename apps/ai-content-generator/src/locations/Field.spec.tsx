import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { mockCma, MockSdk } from '../../test/mocks';
import Field from './Field';

const mockSdk = new MockSdk();
const sdk = mockSdk.sdk;

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => sdk,
  useCMA: () => mockCma,
}));

describe('Field component', () => {
  it('Component text exists', () => {
    const { getByText } = render(<Field />);

    expect(getByText('Hello Entry Field Component (AppId: test-app)')).toBeTruthy();
  });
});
