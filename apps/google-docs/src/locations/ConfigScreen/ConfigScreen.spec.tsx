import ConfigScreen from './ConfigScreen';
import { render } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { mockSdk, mockCma } from '../../../test/mocks';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useCMA: () => mockCma,
}));

describe('Config Screen component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('UI Content', () => {
    it('renders the heading', () => {
      const { getByText } = render(<ConfigScreen />);
      expect(getByText('Drive Integration')).toBeTruthy();
    });

    it('renders the description paragraph', () => {
      const { getByText } = render(<ConfigScreen />);
      expect(
        getByText(
          'Connect Drive Integration to Contentful to seamlessly sync content, eliminate copy-paste, reduce errors, and speed up your publishing workflow.'
        )
      ).toBeTruthy();
    });
  });

  describe('SDK Initialization', () => {
    it('registers onConfigure handler', () => {
      render(<ConfigScreen />);
      expect(mockSdk.app.onConfigure).toHaveBeenCalled();
    });

    it('calls setReady on mount', () => {
      render(<ConfigScreen />);
      expect(mockSdk.app.setReady).toHaveBeenCalled();
    });
  });

  describe('Configuration', () => {
    it('returns configuration with parameters and targetState', async () => {
      const mockState = { EditorInterface: {} };
      mockSdk.app.getCurrentState.mockResolvedValue(mockState);

      render(<ConfigScreen />);

      // Get the onConfigure callback that was registered
      const onConfigureCallback = mockSdk.app.onConfigure.mock.calls[0][0];
      const result = await onConfigureCallback();

      expect(result).toEqual({
        parameters: {},
        targetState: mockState,
      });
    });
  });
});
