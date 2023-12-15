import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { mockCma, MockSdk } from '../../test/mocks';
import ConfigScreen from './ConfigScreen';
import { Sections } from '@components/config/configText';

const mockSdk = new MockSdk();
const sdk = mockSdk.sdk;

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => sdk,
  useCMA: () => mockCma,
}));

describe('Config Screen component', () => {
  it('Config header exists', async () => {
    const { getByText } = render(<ConfigScreen />);
    expect(getByText(Sections.pageHeading)).toBeTruthy();
  });
});
