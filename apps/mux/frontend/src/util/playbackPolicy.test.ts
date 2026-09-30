import { describe, expect, it } from 'vitest';
import {
  currentPlaybackPolicy,
  existingPlaybackPolicy,
  hasAnyPlaybackId,
  pendingPlaybackPolicy,
} from './playbackPolicy';
import { MuxContentfulObject, PolicyType } from './types';

const asset = (overrides: Partial<MuxContentfulObject> = {}): MuxContentfulObject =>
  ({ version: 6, assetId: 'asset-1', ready: true, ...overrides } as MuxContentfulObject);

const queuedCreate = (policy?: PolicyType) => ({
  delete: [],
  create: [{ type: 'playback' as const, data: { policy, assetId: 'asset-1' }, retry: 0 }],
  update: [],
});

describe('existingPlaybackPolicy', () => {
  it('reads the policy off the IDs the field holds', () => {
    expect(existingPlaybackPolicy(asset({ playbackId: 'p' }))).toBe('public');
    expect(existingPlaybackPolicy(asset({ signedPlaybackId: 's' }))).toBe('signed');
    expect(existingPlaybackPolicy(asset({ drmPlaybackId: 'd' }))).toBe('drm');
  });

  it('answers public first when an asset holds more than one', () => {
    // The two copies of this logic disagreed here: the switcher showed public, the swap handler
    // read DRM, so picking DRM in the UI was dropped as "already DRM" and the radio sprang back.
    expect(existingPlaybackPolicy(asset({ playbackId: 'p', drmPlaybackId: 'd' }))).toBe('public');
    expect(existingPlaybackPolicy(asset({ signedPlaybackId: 's', drmPlaybackId: 'd' }))).toBe(
      'signed'
    );
  });

  it('is undefined when there is no playback ID at all, rather than defaulting to public', () => {
    // The distinction this whole module exists for: nothing is not public. It is the state a
    // `moderate` run with `on_flagged.action: delete_playback_ids` leaves behind.
    expect(existingPlaybackPolicy(asset())).toBeUndefined();
    expect(existingPlaybackPolicy(undefined)).toBeUndefined();
  });
});

describe('pendingPlaybackPolicy', () => {
  it('reads a queued create that has not been published yet', () => {
    expect(pendingPlaybackPolicy(asset({ pendingActions: queuedCreate('signed') }))).toBe('signed');
  });

  it('ignores queued work that is not a playback create', () => {
    expect(
      pendingPlaybackPolicy(
        asset({
          pendingActions: {
            delete: [{ type: 'playback', id: 'p', retry: 0 }],
            create: [{ type: 'caption', retry: 0 }],
            update: [],
          },
        })
      )
    ).toBeUndefined();
    expect(pendingPlaybackPolicy(asset())).toBeUndefined();
  });
});

describe('currentPlaybackPolicy', () => {
  it('prefers what is queued over what is stored', () => {
    expect(
      currentPlaybackPolicy(asset({ playbackId: 'p', pendingActions: queuedCreate('drm') }))
    ).toBe('drm');
  });

  it('falls back to the stored IDs, and stays undefined when there are none', () => {
    expect(currentPlaybackPolicy(asset({ signedPlaybackId: 's' }))).toBe('signed');
    expect(currentPlaybackPolicy(asset())).toBeUndefined();
  });
});

describe('hasAnyPlaybackId', () => {
  it('is true for any policy and false for none', () => {
    expect(hasAnyPlaybackId(asset({ playbackId: 'p' }))).toBe(true);
    expect(hasAnyPlaybackId(asset({ signedPlaybackId: 's' }))).toBe(true);
    expect(hasAnyPlaybackId(asset({ drmPlaybackId: 'd' }))).toBe(true);
    expect(hasAnyPlaybackId(asset())).toBe(false);
    expect(hasAnyPlaybackId(undefined)).toBe(false);
  });

  it('does not count a queued create as a playback ID that exists', () => {
    // It exists at Mux only after the entry is published.
    expect(hasAnyPlaybackId(asset({ pendingActions: queuedCreate('public') }))).toBe(false);
  });
});
