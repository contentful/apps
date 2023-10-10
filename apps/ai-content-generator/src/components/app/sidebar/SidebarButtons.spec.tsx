import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { mockCma, MockSdk } from '@test/mocks';
import SidebarButtons from './SidebarButtons';
import featureConfig from '@configs/features/featureConfig';

const mockSdk = new MockSdk();
const sdk = mockSdk.sdk;

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => sdk,
  useCMA: () => mockCma,
  useAutoResizer: () => {},
}));

describe('Sidebar Buttons', () => {
  it('renders', () => {
    const { getByText, unmount } = render(<SidebarButtons shouldDisableButtons={false} />);
    expect(getByText(featureConfig.rewrite.buttonTitle)).toBeTruthy();
    unmount();
  });
});
