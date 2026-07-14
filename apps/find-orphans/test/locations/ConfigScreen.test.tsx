import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ConfigScreen from '../../src/locations/ConfigScreen';
import { createMockConfigSdk } from '../mocks';

const mocks = vi.hoisted(() => ({
  sdk: undefined as unknown,
}));

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mocks.sdk,
}));

// The component registers its save handler via sdk.app.onConfigure; pull the
// latest registered callback so tests can invoke it like the web app does.
const getSaveCallback = (sdk: ReturnType<typeof createMockConfigSdk>) => {
  const calls = sdk.app.onConfigure.mock.calls;
  return calls[calls.length - 1][0] as () => Promise<unknown>;
};

const fillAllFields = () => {
  fireEvent.change(screen.getByLabelText(/Maximum entries per scan/), {
    target: { value: '500' },
  });
  fireEvent.change(screen.getByLabelText(/Concurrent API requests/), {
    target: { value: '5' },
  });
};

describe('ConfigScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('signals readiness and pre-fills the defaults on a fresh install', async () => {
    const sdk = createMockConfigSdk(null);
    mocks.sdk = sdk;

    render(<ConfigScreen />);

    await waitFor(() => expect(sdk.app.setReady).toHaveBeenCalled());
    // The defaults are real values, not placeholders, so the app can be
    // installed without touching the form.
    expect(screen.getByLabelText(/Maximum entries per scan/)).toHaveValue(500);
    expect(screen.getByLabelText(/Concurrent API requests/)).toHaveValue(5);
  });

  it('saves the pre-filled defaults without any edits', async () => {
    const sdk = createMockConfigSdk(null);
    mocks.sdk = sdk;

    render(<ConfigScreen />);
    await waitFor(() => expect(sdk.app.setReady).toHaveBeenCalled());

    const result = await getSaveCallback(sdk)();
    expect(result).toMatchObject({
      parameters: { maxCandidates: 500, batchSize: 5 },
    });
  });

  it('loads previously stored parameters', async () => {
    const sdk = createMockConfigSdk({ maxCandidates: 100 });
    mocks.sdk = sdk;

    render(<ConfigScreen />);

    await waitFor(() => expect(screen.getByLabelText(/Maximum entries per scan/)).toHaveValue(100));
    // A parameter missing from storage falls back to its default.
    expect(screen.getByLabelText(/Concurrent API requests/)).toHaveValue(5);
  });

  it('saves the entered parameters on configure', async () => {
    const sdk = createMockConfigSdk(null);
    mocks.sdk = sdk;

    render(<ConfigScreen />);
    await waitFor(() => expect(sdk.app.setReady).toHaveBeenCalled());

    fillAllFields();
    fireEvent.change(screen.getByLabelText(/Maximum entries per scan/), {
      target: { value: '1000' },
    });

    const result = await getSaveCallback(sdk)();
    expect(result).toMatchObject({
      parameters: { maxCandidates: 1000, batchSize: 5 },
    });
  });

  it('rejects the save when a required field is cleared', async () => {
    const sdk = createMockConfigSdk(null);
    mocks.sdk = sdk;

    render(<ConfigScreen />);
    await waitFor(() => expect(sdk.app.setReady).toHaveBeenCalled());

    fireEvent.change(screen.getByLabelText(/Maximum entries per scan/), {
      target: { value: '' },
    });

    await expect(getSaveCallback(sdk)()).resolves.toBe(false);
    expect(sdk.notifier.error).toHaveBeenCalled();
  });

  it('rejects the save when a value is not a positive number', async () => {
    const sdk = createMockConfigSdk(null);
    mocks.sdk = sdk;

    render(<ConfigScreen />);
    await waitFor(() => expect(sdk.app.setReady).toHaveBeenCalled());

    fillAllFields();
    fireEvent.change(screen.getByLabelText(/Maximum entries per scan/), {
      target: { value: '0' },
    });

    await expect(getSaveCallback(sdk)()).resolves.toBe(false);
    expect(sdk.notifier.error).toHaveBeenCalled();
  });

  it('rejects a batch size above the CMA rate limit of 7', async () => {
    const sdk = createMockConfigSdk(null);
    mocks.sdk = sdk;

    render(<ConfigScreen />);
    await waitFor(() => expect(sdk.app.setReady).toHaveBeenCalled());

    fillAllFields();
    fireEvent.change(screen.getByLabelText(/Concurrent API requests/), {
      target: { value: '50' },
    });

    await expect(getSaveCallback(sdk)()).resolves.toBe(false);
    expect(sdk.notifier.error).toHaveBeenCalledWith(
      '"Concurrent API requests" must be between 1 and 7.'
    );
  });
});
