import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { mockCma, MockSdk } from '../../../../test/mocks';
import BrandProfileMissingWarning from './BrandProfileMissingWarning';

const mockSdk = new MockSdk();
const sdk = mockSdk.sdk;

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => sdk,
  useCMA: () => mockCma,
}));

describe('Brand Profile Missing Warning', () => {
  it('renders and checks local storage', () => {
    const spy = vi.spyOn(localStorage, 'getItem');

    const { getByText } = render(
      <BrandProfileMissingWarning message="Test message" linkSubstring="" />
    );

    expect(getByText('Test message')).toBeTruthy();
    expect(spy).toBeCalledWith('cf_dismiss_brand_profile_warning');
  });
});
