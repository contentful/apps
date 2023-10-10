import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { mockCma, MockSdk } from '@test/mocks';
import FeatureButton from './FeatureButton';
import featureConfig, { AIFeature } from '@configs/features/featureConfig';

const mockSdk = new MockSdk();
const sdk = mockSdk.sdk;

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => sdk,
  useCMA: () => mockCma,
  useAutoResizer: () => {},
}));

describe('Feature Button', () => {
  it('renders', () => {
    const { getByText, unmount } = render(
      <FeatureButton
        feature={AIFeature.CONTENT}
        isSaving={false}
        onSaving={() => {}}
        shouldDisableButtons={false}
      />
    );
    expect(getByText(featureConfig.content.buttonTitle)).toBeTruthy();
    unmount();
  });
});
