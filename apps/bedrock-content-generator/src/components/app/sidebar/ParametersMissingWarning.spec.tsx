import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { mockCma, MockSdk } from '../../../../test/mocks';
import ParametersMissingWarning from './ParametersMissingWarning';

const mockSdk = new MockSdk();
const sdk = mockSdk.sdk;

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => sdk,
  useCMA: () => mockCma,
}));

describe('Parameters Missing Warning', () => {
  it('renders', () => {
    const { getByText, unmount } = render(
      <ParametersMissingWarning message="Dog with a blog" linkSubstring="Dog" />
    );

    expect(getByText('Dog')).toBeTruthy();
    expect(getByText('with a blog')).toBeTruthy();
    unmount();
  });
});
