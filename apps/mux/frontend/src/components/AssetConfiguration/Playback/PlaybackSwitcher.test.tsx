import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import PlaybackSwitcher from './PlaybackSwitcher';
import { MuxContentfulObject, PolicyType } from '../../../util/types';

const asset = (overrides: Partial<MuxContentfulObject> = {}): MuxContentfulObject =>
  ({ version: 6, assetId: 'asset-1', ready: true, ...overrides } as MuxContentfulObject);

const renderSwitcher = (
  value: MuxContentfulObject,
  overrides: { enableSignedUrls?: boolean; enableDRM?: boolean } = {}
) => {
  const onSwapPlaybackIDs = vi.fn();
  render(
    <PlaybackSwitcher
      value={value}
      onSwapPlaybackIDs={onSwapPlaybackIDs}
      enableSignedUrls={overrides.enableSignedUrls ?? false}
      enableDRM={overrides.enableDRM ?? false}
    />
  );
  return { onSwapPlaybackIDs };
};

const queuedCreate = (policy: PolicyType) => ({
  delete: [],
  create: [{ type: 'playback' as const, data: { policy, assetId: 'asset-1' }, retry: 0 }],
  update: [],
});

/**
 * An asset with no playback ID of any kind is reachable by design now: `moderate` with
 * `on_flagged.action: delete_playback_ids` empties it, and Contentful is where the editor is.
 * Before this, the tab reported the asset as already public and dropped the click, so the only
 * way back to a playable video was the Mux dashboard.
 */
describe('PlaybackSwitcher with no playback ID', () => {
  it('offers to create one instead of pretending the asset is public', async () => {
    const { onSwapPlaybackIDs } = renderSwitcher(asset());

    expect(screen.getByTestId('playback-create-offer')).toBeInTheDocument();
    await userEvent.click(screen.getByTestId('playback-create-request'));

    expect(onSwapPlaybackIDs).toHaveBeenCalledWith('public');
  });

  it('never asks for a policy the installation cannot create', () => {
    // Signed and DRM are configuration-dependent; offering one that is off buys a failed publish.
    renderSwitcher(asset());
    expect(screen.getByRole('radio', { name: /^Protected/ })).toBeDisabled();
    expect(screen.getByRole('radio', { name: /^DRM/ })).toBeDisabled();
    expect(screen.getByRole('radio', { name: 'Public' })).toBeEnabled();
  });

  it('offers signed and DRM where the installation has them', async () => {
    const { onSwapPlaybackIDs } = renderSwitcher(asset(), {
      enableSignedUrls: true,
      enableDRM: true,
    });

    await userEvent.click(screen.getByRole('radio', { name: /^Protected/ }));
    await userEvent.click(screen.getByTestId('playback-create-request'));
    expect(onSwapPlaybackIDs).toHaveBeenCalledWith('signed');
  });

  it('keeps DRM off an audio-only asset, which cannot use it', () => {
    renderSwitcher(asset({ audioOnly: true }), { enableSignedUrls: true, enableDRM: true });
    expect(screen.getByRole('radio', { name: /^DRM/ })).toBeDisabled();
  });

  it('shows the queued create as pending rather than as a done deal', () => {
    // Same as the policy switches: the work happens in `onPublish`, so until the entry is
    // published nothing exists at Mux.
    renderSwitcher(asset({ pendingActions: queuedCreate('signed') }));

    const pending = screen.getByTestId('playback-create-pending');
    expect(pending).toHaveTextContent('signed');
    expect(pending).toHaveTextContent('when you publish');
    expect(screen.queryByTestId('playback-create-request')).not.toBeInTheDocument();
  });
});

describe('PlaybackSwitcher with a playback ID', () => {
  it('shows the stored policy and swaps on a change', async () => {
    const { onSwapPlaybackIDs } = renderSwitcher(asset({ playbackId: 'p' }), {
      enableSignedUrls: true,
    });

    expect(screen.queryByTestId('playback-create-offer')).not.toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Public' })).toBeChecked();

    await userEvent.click(screen.getByRole('radio', { name: /^Protected/ }));
    expect(onSwapPlaybackIDs).toHaveBeenCalledWith('signed');
  });

  it('shows a queued swap as the selected policy', () => {
    renderSwitcher(asset({ playbackId: 'p', pendingActions: queuedCreate('signed') }), {
      enableSignedUrls: true,
    });
    expect(screen.getByRole('radio', { name: /^Protected/ })).toBeChecked();
  });
});
