import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mockSdk } from '../mocks';
import ConfigScreen from '../../src/locations/ConfigScreen';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
}));

describe('Config Screen component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSdk.app.getCurrentState.mockResolvedValue({});
  });
  afterEach(() => {
    cleanup();
  });

  it('renders the app name and marks itself ready', () => {
    const { getByText } = render(<ConfigScreen />);

    expect(getByText('Translation Companion')).toBeInTheDocument();
    expect(mockSdk.app.setReady).toHaveBeenCalled();
  });

  it('warns against uninstalling', () => {
    const { getByText } = render(<ConfigScreen />);

    expect(getByText(/Uninstalling this app revokes/)).toBeInTheDocument();
  });

  it('registers onConfigure and resolves with empty parameters', async () => {
    render(<ConfigScreen />);

    const result = await mockSdk.app.onConfigure.mock.calls[0][0]();

    expect(result).toEqual({ parameters: {}, targetState: {} });
  });
});
