import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AppExtensionSDK } from '@contentful/app-sdk';
import Config from './config';
import { ROBOTS_ALLOW_EVERYONE_LABEL, canRunRobots } from '../util/robotsAccess';

/**
 * "Let everyone run Robots" on the two ways into this screen: a first install, which has no
 * parameters until Install is clicked, and an install that predates the switch. Both read as off —
 * admins only — until an admin checks it and saves. It is plain parameter state: nothing here
 * calls Mux or an app action, so it works before the app is installed. See ADR-0016.
 */
const renderConfig = (saved: Record<string, unknown> | null) => {
  let onConfigure: () => Promise<unknown> = async () => undefined;
  const sdk = {
    app: {
      onConfigure: vi.fn((callback: () => Promise<unknown>) => {
        onConfigure = callback;
      }),
      getParameters: vi.fn(async () => saved),
      setReady: vi.fn(),
    },
    space: {
      getEditorInterfaces: vi.fn(async () => ({ items: [] })),
      getContentTypes: vi.fn(async () => ({ items: [] })),
    },
    ids: { app: 'app-id' },
    notifier: { error: vi.fn() },
  };
  render(<Config sdk={sdk as unknown as AppExtensionSDK} />);
  return {
    sdk,
    configure: () => onConfigure() as Promise<{ parameters: Record<string, unknown> }>,
  };
};

const allowEveryone = () => screen.getByRole('checkbox', { name: ROBOTS_ALLOW_EVERYONE_LABEL });

describe('the "Let everyone run Robots" switch', () => {
  it('is off on a first install, and is saved with the install once an admin checks it', async () => {
    const { sdk, configure } = renderConfig(null);
    await waitFor(() => expect(sdk.app.setReady).toHaveBeenCalled());
    expect(allowEveryone()).not.toBeChecked();

    fireEvent.change(screen.getByLabelText(/Mux access token/), { target: { value: 'token-id' } });
    fireEvent.change(screen.getByLabelText(/Mux token secret/), { target: { value: 'secret' } });
    fireEvent.click(allowEveryone());

    const { parameters } = await configure();
    expect(parameters.muxRobotsAllowEveryone).toBe(true);
  });

  it('is off on an install that predates it, and a save that leaves it alone keeps it off', async () => {
    const { sdk, configure } = renderConfig({
      muxAccessTokenId: 'token-id',
      muxAccessTokenSecret: 'secret',
    });
    await waitFor(() => expect(sdk.app.setReady).toHaveBeenCalled());
    expect(allowEveryone()).not.toBeChecked();

    const { parameters } = await configure();
    expect(parameters).not.toHaveProperty('muxRobotsAllowEveryone');
    expect(canRunRobots(false, parameters)).toBe(false);
  });
});
