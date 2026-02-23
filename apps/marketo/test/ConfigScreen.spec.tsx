import { act, render, waitFor, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { mockCma, mockSdk } from './mocks';
import ConfigScreen from '../src/locations/ConfigScreen';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => ({ ...mockSdk, cma: mockCma }),
  useCMA: () => mockCma,
}));

async function runOnConfigure(): Promise<unknown> {
  const onConfigureCallback = mockSdk.app.onConfigure.mock.calls.at(-1)?.[0];
  return await act(async () => {
    return onConfigureCallback ? await onConfigureCallback() : undefined;
  });
}

describe('ConfigScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSdk.app.getParameters.mockResolvedValue(null);
    mockSdk.app.getCurrentState.mockResolvedValue(null);
    mockSdk.notifier.error.mockClear();
  });

  it('renders heading and credential fields', async () => {
    const { getByText, getByLabelText, getByRole } = render(<ConfigScreen />);

    await waitFor(() => {
      expect(mockSdk.app.setReady).toHaveBeenCalled();
    });

    expect(getByText('Set up the Marketo App')).toBeInTheDocument();
    expect(getByLabelText(/Marketo Client ID/)).toBeInTheDocument();
    expect(getByLabelText(/Marketo Client Secret/)).toBeInTheDocument();
    expect(getByLabelText(/Marketo Munchkin Id/)).toBeInTheDocument();
    expect(getByRole('button', { name: /test marketo connection/i })).toBeInTheDocument();
  });

  it('onConfigure returns parameters and targetState when all required fields are valid', async () => {
    const params = {
      clientId: 'client-id',
      clientSecret: 'client-secret',
      munchkinId: 'munchkin-id',
    };
    mockSdk.app.getParameters.mockResolvedValue(params);
    mockSdk.app.getCurrentState.mockResolvedValue({ EditorInterface: {} });

    render(<ConfigScreen />);
    await waitFor(() => {
      expect(mockSdk.app.setReady).toHaveBeenCalled();
    });

    const result = await runOnConfigure();

    expect(result).toEqual({
      parameters: params,
      targetState: { EditorInterface: {} },
    });
    expect(mockSdk.notifier.error).not.toHaveBeenCalled();
  });

  it('onConfigure shows validation errors and returns false when required fields are empty', async () => {
    render(<ConfigScreen />);
    await waitFor(() => {
      expect(mockSdk.app.setReady).toHaveBeenCalled();
    });

    const result = await runOnConfigure();

    expect(result).toBe(false);
    expect(mockSdk.notifier.error).toHaveBeenCalledWith(
      'Please fill in all required fields with valid values before saving.'
    );
    expect(screen.getAllByText('Input is required').length).toBe(3);
  });
});
