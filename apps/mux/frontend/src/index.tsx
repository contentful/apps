/* eslint-disable  @typescript-eslint/no-non-null-assertion */

// Must be imported before MuxPlayer to prevent Chromecast errors in Contentful's sandboxed iframe
import './util/disableChromecast';

import React, { ChangeEvent, createRef } from 'react';
import { render } from 'react-dom';

import {
  init,
  locations,
  AppExtensionSDK,
  FieldExtensionSDK,
  SidebarExtensionSDK,
} from '@contentful/app-sdk';
import { Button, Note, Spinner, TextLink, Tabs, Box, Flex } from '@contentful/f36-components';
import { Form, FormControl, TextInput } from '@contentful/f36-forms';

import MuxPlayer from '@mux/mux-player-react';

import Config from './locations/config';

import Menu from './components/menu';
import PlayerCode from './components/PlayerCode';
import MuxAssetConfigurationModal, {
  ModalData,
} from './components/AssetConfiguration/MuxAssetConfigurationModal';
import UploadArea from './components/UploadArea/UploadArea';
import Mp4RenditionsPanel from './components/AssetConfiguration/Mp4RenditionsPanel';
import TrackForm from './components/TrackForm/TrackForm';
import MetadataPanel from './components/AssetConfiguration/MetadataPanel';
import PlaybackSwitcher from './components/AssetConfiguration/Playback/PlaybackSwitcher';
import RobotsPanel from './components/Robots/RobotsPanel';
import RobotsErrorBoundary from './components/Robots/RobotsErrorBoundary';

import {
  type InstallationParams,
  type MuxContentfulObject,
  type AppState,
  AppProps,
  ResolutionType,
  PolicyType,
  Track,
  ResyncParams,
  PendingActions,
  PendingAction,
} from './util/types';

import './index.css';
import { createClient, PlainClientAPI } from 'contentful-management';
import {
  MuxApiService,
  MuxApiError,
  addByURL,
  getUploadUrl,
  type SignedTokens,
} from './util/muxApi';
import Sidebar from './locations/Sidebar';
import { deriveFieldVersion } from './util/muxFieldVersion';
import { currentPlaybackPolicy, hasAnyPlaybackId } from './util/playbackPolicy';
import { unfinishedJobRecords } from './util/robots';
import { canRunRobots, isSpaceAdmin } from './util/robotsAccess';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Delete undefined keys and sort keys recursively
function normalizeForDiff<T>(obj: T): T {
  if (Array.isArray(obj)) {
    return obj.map(normalizeForDiff) as unknown as T;
  } else if (obj && typeof obj === 'object') {
    return Object.keys(obj)
      .filter((k) => (obj as Record<string, unknown>)[k] !== undefined)
      .sort()
      .reduce((acc, k) => {
        (acc as Record<string, unknown>)[k] = normalizeForDiff((obj as Record<string, unknown>)[k]);
        return acc;
      }, {} as Record<string, unknown>) as T;
  }
  return obj;
}

/**
 * A description of one change to the field value. Given whatever is currently stored, return the
 * value that should replace it — or the input untouched to say "nothing to do".
 */
export type FieldMutator = (
  current: MuxContentfulObject | undefined
) => MuxContentfulObject | undefined;

/** Per-call options for `updateField`. */
export interface UpdateFieldOptions {
  /**
   * Ask the web app to persist the entry as soon as the value lands, rather than waiting for its
   * own autosave.
   *
   * `sdk.field.setValue` resolves when the value has crossed the postMessage bridge into the
   * Contentful web app — not when anything is stored. For most writes that is fine: the asset
   * mirror is re-derived from Mux on the next open, so losing one is free. For a write that
   * records something which costs money and cannot be re-derived — a Robots job already running
   * and billing — it is not, because closing the tab in that window orphans it.
   *
   * Off by default. Saving is a write to the entry, and turning it on for every field write would
   * mean an entry save several times a second while an asset prepares.
   */
  save?: boolean;
  /**
   * Called when this write is parked behind the publish gate, and again if a second publish parks
   * it once more. The returned promise still settles with the real outcome. It reports the gate
   * to the one caller whose write it holds, so no copy of the gate has to live anywhere else.
   */
  onParked?: () => void;
  /**
   * `false` drops this write, rather than flushing it, if it is still parked when the editor
   * closes: it rejects with `DiscardedFieldWriteError`. For a write that only makes sense if the
   * caller then goes on to act — the placeholder saved before a Robots create is sent — flushing
   * would leave a guard with nothing behind it, because a closing editor sends nothing. Default
   * `true`.
   */
  flushOnUnmount?: boolean;
}

/**
 * A write that was parked behind the publish gate and then dropped without reaching the field.
 *
 * A caller has to be able to tell "written" from "queued and then dropped": a silent success on a
 * write that never happened is the defect, not the dropping.
 */
export class DiscardedFieldWriteError extends Error {
  /** The underlying failure, when there was one. Absent when the write was simply dropped. */
  readonly reason?: unknown;

  constructor(message: string, reason?: unknown) {
    super(message);
    this.name = 'DiscardedFieldWriteError';
    this.reason = reason;
  }
}

/** A mutator parked behind the publish gate, with the promise its caller is still holding. */
interface DeferredMutation {
  mutate: FieldMutator;
  options?: UpdateFieldOptions;
  resolve: () => void;
  reject: (error: unknown) => void;
}

/** How long the publish gate stays shut before we assume the publish function is not coming. */
const PUBLISH_GATE_TIMEOUT_MS = 90_000;

/**
 * Stable empty fallback for the configured directive ids.
 *
 * A fresh `[]` on every render changes the identity of the `useCallback`s in `RobotsPanel` that
 * close over it, and the Robots poll effect depends on those — so the 6 s timer was cleared and
 * re-armed on every render of this component, and never fired while the asset poll was running.
 */
const NO_DIRECTIVE_IDS: string[] = [];

/**
 * How hard the app looks for the automation an upload attached, before leaving it to the tab.
 *
 * Four attempts five seconds apart, starting from the moment the asset reports `ready`. A
 * directive dispatches its first workflow shortly after ingest, so this catches the normal case;
 * anything slower is the Robots tab's job, which polls properly and says what it finds.
 */
const ROBOTS_UPLOAD_CHECK_ATTEMPTS = 4;
const ROBOTS_UPLOAD_CHECK_INTERVAL_MS = 5000;

/**
 * Which Mux tracks belong in `captions`.
 *
 * **Duplicated in `functions/src/onPublish.ts` — change one, change the other.** Separate
 * packages with independent builds, so there is no module to share. It has drifted before: the
 * function took `type === 'text'` at any status, so a publish swapped the caption list for a
 * differently-filtered one and errored text tracks reappeared on the entry.
 */
function isCaptionTrack(track: { text_type?: string; status?: string }): boolean {
  return (
    track.text_type === 'subtitles' && (track.status === 'ready' || track.status === 'preparing')
  );
}

/**
 * Which Mux track belongs in `chaptersTrack`. An asset holds a single chapters track, which
 * `generate-chapters` writes when `update_asset_chapters` is on. Same status rule as captions.
 *
 * **Duplicated in `functions/src/onPublish.ts` — change one, change the other.**
 */
function isChaptersTrack(track: { text_type?: string; status?: string }): boolean {
  return (
    track.text_type === 'chapters' && (track.status === 'ready' || track.status === 'preparing')
  );
}

function sameNormalized(a: unknown, b: unknown): boolean {
  return JSON.stringify(normalizeForDiff(a)) === JSON.stringify(normalizeForDiff(b));
}

const updatePendingActions = (value, newPendingActions) => {
  const safePendingActions = {
    delete: Array.isArray(newPendingActions.delete) ? newPendingActions.delete : [],
    create: Array.isArray(newPendingActions.create) ? newPendingActions.create : [],
    update: Array.isArray(newPendingActions.update) ? newPendingActions.update : [],
  };

  const finalPendingActions =
    safePendingActions.delete.length === 0 &&
    safePendingActions.create.length === 0 &&
    safePendingActions.update.length === 0
      ? undefined
      : safePendingActions;
  return { ...value, pendingActions: finalPendingActions };
};

export class App extends React.Component<AppProps, AppState> {
  cmaClient: PlainClientAPI;
  muxApi!: MuxApiService;
  resolveRef = createRef<(value: string | null) => void>();
  muxUploaderRef = createRef<any>(); // eslint-disable-line @typescript-eslint/no-explicit-any
  fileInputRef = React.createRef<HTMLInputElement>();
  muxPlayerRef = React.createRef<any>(); // eslint-disable-line @typescript-eslint/no-explicit-any
  private pollPending = false;

  /**
   * Serialises every read-modify-write of the field value. See `updateField`.
   * Never rejects, so one failed write cannot break the chain for the next one.
   */
  private writeChain: Promise<void> = Promise.resolve();
  /** Mutations parked while the publish function is rewriting the field server-side. */
  private deferredMutations: DeferredMutation[] = [];
  private publishGateOpen = false;
  private publishGateTimer?: ReturnType<typeof setTimeout>;
  /** Tracks the last publish we reacted to, so one publish is handled once. */
  private lastHandledPublishedAt?: string;
  private isUnmounted = false;
  /**
   * Directives attached to an upload started in this session, and whether we have spoken about
   * them yet.
   *
   * Both are instance fields rather than state because neither should ever cause a render, and
   * because "an upload just finished here" is a fact about this session — not about the entry.
   * Nothing derives them from the stored value, which is what keeps the toast off every
   * subsequent open of an entry whose asset has automation on it.
   */
  private uploadDirectiveIds: string[] = [];
  private hasAnnouncedRobotsOnUpload = false;
  /**
   * Whether this person sees the controls that run Robots (ADR-0016). Worked out once: the user
   * and the installation parameters are both handed to the iframe when it loads.
   */
  private readonly userCanRunRobots: boolean;

  constructor(props: AppProps) {
    super(props);

    const installation = this.props.sdk.parameters.installation as InstallationParams;
    const { muxAccessTokenId, muxAccessTokenSecret } = installation;
    this.userCanRunRobots = canRunRobots(isSpaceAdmin(this.props.sdk.user), installation);

    this.cmaClient = createClient(
      { apiAdapter: this.props.sdk.cmaAdapter },
      {
        type: 'plain',
        defaults: {
          environmentId: this.props.sdk.ids.environmentAlias ?? this.props.sdk.ids.environment,
          spaceId: this.props.sdk.ids.space,
        },
      }
    );

    const field = props.sdk.field.getValue();

    this.state = {
      value: field,
      isDeleting: false,
      isTokenLoading: true,
      error:
        (!muxAccessTokenId || !muxAccessTokenSecret) &&
        "It doesn't look like you've specified your Mux Access Token ID or Secret in the extension configuration.",
      errorShowResetAction: false,
      playerPlaybackId:
        field && ('playbackId' in field || 'signedPlaybackId' in field || 'drmPlaybackId' in field)
          ? field.playbackId || field.signedPlaybackId || field.drmPlaybackId
          : undefined,
      modalAssetConfigurationVisible: false,
      file: null,
      showMuxUploaderUI: false,
      pendingUploadURL: null,
      isPolling: false,
      initialResyncDone: false,
      selectedTab: 'captions',
      captionname: undefined,
      audioName: undefined,
      playbackToken: undefined,
      posterToken: undefined,
      storyboardToken: undefined,
      drmLicenseToken: undefined,
      raw: undefined,
    };
  }

  // eslint-disable-next-line  @typescript-eslint/ban-types
  detachExternalChangeHandler: Function | null = null;
  detachSysChangeHandler: Function | null = null;

  /**
   * The one place the field value is written. See ADR-0001.
   *
   * Every caller describes only its own change; the current value is read through
   * `sdk.field.getValue()` rather than React state, and concurrent calls are chained so they
   * apply one after another. That is what makes two independent poll loops safe — a mutator that
   * closes over component state reads a value `onExternalChange` has not refreshed yet.
   *
   * Two invariants live here because this is the only place they can be enforced:
   *
   * - **No-op writes never reach the entry.** Every `setValue` bumps the entry version and flips
   *   a published entry to "Changed", so a poll tick that learns nothing must not write. This is
   *   also what keeps entries that predate Robots byte-identical to what is on disk.
   * - **Nothing is written while the publish function is mid-rewrite.** See `openPublishGate`.
   *
   * The returned promise settles when the change has been applied, including after waiting behind
   * the publish gate, and rejects with `DiscardedFieldWriteError` if it was dropped instead — so a
   * caller recording something that costs money can tell the two apart.
   */
  updateField = (mutate: FieldMutator, options?: UpdateFieldOptions): Promise<void> => {
    /**
     * Set when this call is parked behind the publish gate. Settled later by whoever drains the
     * queue — `closePublishGate` when the function's publish lands, or the unmount flush.
     */
    let parked: Promise<void> | undefined;

    const apply = async (): Promise<void> => {
      if (this.isUnmounted) return;

      if (this.publishGateOpen) {
        parked = new Promise<void>((resolve, reject) => {
          this.deferredMutations.push({ mutate, options, resolve, reject });
        });
        options?.onParked?.();
        return;
      }

      const current = this.props.sdk.field.getValue() as MuxContentfulObject | undefined;
      const next = mutate(current);

      if (next === current || sameNormalized(current, next)) return;

      await this.props.sdk.field.setValue(next);
      // Keep React state in step immediately rather than waiting for `onValueChanged`, so the UI
      // does not render a value the field no longer holds.
      if (!this.isUnmounted) this.setState({ value: next });

      // After the write, and only when there was one: a no-op write must stay a no-op, or the
      // whole "entries that predate Robots are byte-identical" property (ADR-0006) turns into an
      // entry save on every poll tick.
      if (options?.save) await this.saveEntry();
    };

    const chained = this.writeChain.then(apply);
    // The chain itself must survive a rejected write; the caller still gets the real promise.
    this.writeChain = chained.then(
      () => undefined,
      () => undefined
    );
    // The chain deliberately does *not* wait on `parked`: a parked mutator is released by
    // `closePublishGate`, which writes through this same chain, so blocking the chain behind it
    // would deadlock the release. Only the caller's promise waits.
    return chained.then(() => parked);
  };

  /**
   * Persist the entry, best effort.
   *
   * A failure here is not a write failure and must not be reported as one — `setValue` has
   * already resolved, so the value is in the editor's buffer and the web app's own autosave will
   * still get to it. Reporting it as a failed write would make callers retry a write that
   * happened.
   */
  private saveEntry = async (): Promise<void> => {
    try {
      await this.props.sdk.entry.save();
    } catch (error) {
      console.warn('[mux] Wrote the field but could not save the entry.', error);
    }
  };

  /**
   * Stops browser writes while the publish function rewrites the field server-side.
   *
   * `onPublish` runs in two cycles — clear `pendingActions` and update, then rebuild the field
   * from fresh Mux data and republish — so a guard keyed off `pendingActions` lifts one cycle
   * before the destructive write lands. `onPublish` merging rather than replacing (ADR-0002) is
   * what makes the remaining window survivable; this gate is what makes it narrow.
   *
   * A heuristic, not a lock: the browser cannot observe the function, so the gate is released on
   * the function's own publish, or by timeout if it never arrives.
   */
  private openPublishGate = () => {
    this.publishGateOpen = true;
    if (this.publishGateTimer) clearTimeout(this.publishGateTimer);
    this.publishGateTimer = setTimeout(() => {
      console.warn('[mux] Publish gate timed out waiting for the publish function; resuming.');
      this.closePublishGate();
    }, PUBLISH_GATE_TIMEOUT_MS);
  };

  private closePublishGate = () => {
    if (this.publishGateTimer) {
      clearTimeout(this.publishGateTimer);
      this.publishGateTimer = undefined;
    }
    if (!this.publishGateOpen) return;
    this.publishGateOpen = false;

    // Re-apply against whatever the function left behind, not against what we saw before it ran.
    const queued = this.deferredMutations;
    this.deferredMutations = [];
    for (const deferred of queued) {
      // The caller has been holding a promise this whole time. Hand it the real outcome of the
      // re-applied write — including a rejection, and including being parked again if a second
      // publish has already re-opened the gate.
      this.updateField(deferred.mutate, deferred.options).then(deferred.resolve, deferred.reject);
    }
  };

  /**
   * Apply everything parked behind the publish gate, in one direct write, as the component goes
   * away — otherwise a Robots job started inside the 90 s gate window loses its record while the
   * job keeps running and billing.
   *
   * Best effort, and deliberately *not* routed through `writeChain`: a promise chained during
   * unmount may never get a turn. What it does guarantee is that every parked caller learns
   * whether its change was written. A write that asked for `flushOnUnmount: false` is dropped.
   */
  private flushDeferredMutations = (): void => {
    const queued = this.deferredMutations.filter((deferred) => {
      if (deferred.options?.flushOnUnmount !== false) return true;
      deferred.reject(
        new DiscardedFieldWriteError('The editor closed before this write could be made.')
      );
      return false;
    });
    this.deferredMutations = [];
    if (queued.length === 0) return;

    let current: MuxContentfulObject | undefined;
    try {
      current = this.props.sdk.field.getValue() as MuxContentfulObject | undefined;
    } catch (error) {
      for (const deferred of queued) {
        deferred.reject(
          new DiscardedFieldWriteError('Could not read the field value while unmounting.', error)
        );
      }
      return;
    }

    const applied: DeferredMutation[] = [];
    let next = current;
    for (const deferred of queued) {
      try {
        next = deferred.mutate(next);
        applied.push(deferred);
      } catch (error) {
        // One bad mutator must not take the rest of the queue down with it.
        deferred.reject(error);
      }
    }

    if (applied.length === 0) return;

    if (next === current || sameNormalized(current, next)) {
      // Nothing left to write: the parked changes are already in the stored value. That is an
      // applied write, not a dropped one.
      for (const deferred of applied) deferred.resolve();
      return;
    }

    const wantsSave = applied.some((deferred) => deferred.options?.save);

    Promise.resolve(this.props.sdk.field.setValue(next))
      .then(() => {
        for (const deferred of applied) deferred.resolve();
        // Nothing is going to autosave on behalf of a closing tab, so this is the one place the
        // save matters most — and `saveEntry` never throws, so it cannot turn a written value
        // into a reported failure.
        if (wantsSave) return this.saveEntry();
        return undefined;
      })
      .catch((error) => {
        for (const deferred of applied) {
          deferred.reject(
            new DiscardedFieldWriteError(
              'The field write queued behind a publish was dropped when the editor closed.',
              error
            )
          );
        }
      });
  };

  checkForValidAsset = async () => {
    if (!(this.state.value && this.state.value.assetId)) return false;
    try {
      await this.muxApi.getAsset(this.state.value.assetId);
      return true;
    } catch (e) {
      if (e instanceof MuxApiError) {
        if (e.status === 400) {
          if (e.message.match(/mismatching environment/)) {
            this.setState({
              error: 'Error: it looks like your api keys are for the wrong environment',
            });
            return false;
          }
          this.setState({ error: e.message, errorShowResetAction: true });
          return false;
        }
        if (e.status === 401) {
          this.setState({
            error:
              'Error: it looks like your api keys are not configured properly. Check App configuration.',
          });
          return false;
        }
        if (e.status === 404) {
          this.setState({ error: 'Error: The video was not found.', errorShowResetAction: true });
          return false;
        }
        this.setState({ error: 'API Check Error: ' + e.message, errorShowResetAction: true });
        return false;
      }
      this.setState({ error: 'Error: Failed to get status update.' });
      return false;
    }
  };

  async componentDidMount() {
    this.muxApi = await MuxApiService.getInstance(this.cmaClient, this.props.sdk);

    this.props.sdk.window.startAutoResizer();

    // Handler for external field value changes (e.g. when multiple authors are working on the same entry).
    this.detachExternalChangeHandler = this.props.sdk.field.onValueChanged(this.onExternalChange);

    // Subscribe to any `sys` change to detect publish
    const initialSys = this.props.sdk.entry.getSys();
    this.lastHandledPublishedAt = initialSys.publishedAt;
    this.detachSysChangeHandler = this.props.sdk.entry.onSysChanged(async (newSys) => {
      const wasPublished =
        !!newSys.publishedVersion && newSys.version === newSys.publishedVersion + 1;

      const justNow =
        !this.lastHandledPublishedAt || this.lastHandledPublishedAt !== newSys.publishedAt;

      if (!wasPublished || !justNow) return;
      this.lastHandledPublishedAt = newSys.publishedAt;

      // If there are pendingActions, the onPublish function will handle
      // the Mux API changes and update+publish the entry when done.
      // Resyncing now would read stale Mux data and cause version conflicts.
      // The publish triggered by onPublish will fire this handler again
      // (without pendingActions), doing a clean resync at that point.
      const currentValue = this.props.sdk.field.getValue();
      if (currentValue?.pendingActions) {
        // The function is about to rewrite this field from the server. Hold every browser write
        // until its own publish lands, otherwise anything written in between is overwritten.
        this.openPublishGate();
        return;
      }

      // This publish is the function's republish — the gate can lift and queued writes can flush.
      this.closePublishGate();
      await this.resync();
    });

    if (this.state.error) return;

    // Just in case someone left an asset in a bad place, we'll do some additional checks first just to see if
    // we can clean up.
    if (this.state.value) {
      if (this.state.value.error) {
        this.setAssetError(this.state.value.error);
        return;
      }

      if (this.state.value.is_live) {
        await this.pollForAssetDetails();
      }

      if (this.state.value.ready) {
        await this.checkForValidAsset();

        if (this.isUsingDRM() && this.state.value.drmPlaybackId) {
          // Load DRM tokens for external player link
          await this.setSignedPlayback(this.state.value.drmPlaybackId, true);
          this.setState({ playerPlaybackId: this.state.value.drmPlaybackId });
        } else if (this.isUsingSigned() && this.state.value.signedPlaybackId) {
          await this.setSignedPlayback(this.state.value.signedPlaybackId);
          this.setState({ playerPlaybackId: this.state.value.signedPlaybackId });
        } else if (this.state.value.playbackId) {
          this.setState({ playerPlaybackId: this.state.value.playbackId });
        }
        return;
      }

      if (this.state.value.uploadId && !this.state.value.ready) {
        await this.pollForUploadDetails();
        return;
      }

      // No status usually means errored asset that was not cleared.
      if (this.state.value.assetId && !('ready' in this.state.value)) {
        await this.pollForAssetDetails();
        return;
      }
    }
  }

  componentDidUpdate() {
    // `muxApi` is assigned by `componentDidMount`, which awaits a CMA round trip first. An update
    // that lands inside that window — a tab click on a slow connection — used to resync with no
    // client at all and throw an unhandled `TypeError` from inside a lifecycle method. Deferred
    // rather than skipped: `initialResyncDone` stays false, so the next update tries again.
    if (this.muxApi && this.state.value?.assetId && !this.state.initialResyncDone) {
      this.resync({ silent: true });
      this.setState({ initialResyncDone: true });
    }
  }

  componentWillUnmount() {
    // Drained *before* the unmount flag goes up, because `updateField` refuses to write once it
    // is set. Anything still parked is a change whose caller has been told nothing yet.
    this.flushDeferredMutations();
    this.isUnmounted = true;
    this.publishGateOpen = false;
    if (this.publishGateTimer) {
      clearTimeout(this.publishGateTimer);
      this.publishGateTimer = undefined;
    }
    if (this.detachExternalChangeHandler) {
      this.detachExternalChangeHandler();
    }
    if (this.detachSysChangeHandler) {
      this.detachSysChangeHandler();
    }
  }

  onExternalChange = (value: MuxContentfulObject) => {
    this.setState({ value });
  };

  isUsingSigned = (): boolean => {
    // If both public and signed IDs are set, use the public for previewing.
    return this.state.value && this.state.value.signedPlaybackId && !this.state.value.playbackId
      ? true
      : false;
  };

  isUsingDRM = (): boolean => {
    // Check if DRM playback ID is set
    return this.state.value && this.state.value.drmPlaybackId ? true : false;
  };

  isPlayerReady = (): boolean => {
    if (!this.state.playerPlaybackId) return false;

    const isPublicReady = !!this.state.value?.ready && !!this.state.value?.playbackId;
    const isSignedReady =
      this.isUsingSigned() && !this.state.isTokenLoading && !!this.state.playbackToken;

    return isPublicReady || isSignedReady;
  };

  getSwitchCheckedState = (): boolean => {
    // If there are pending actions of playback, use the state of the pending action
    if (this.state.value?.pendingActions?.create) {
      const playbackCreateAction = this.state.value.pendingActions.create.find(
        (action) => action.type === 'playback'
      );
      if (playbackCreateAction) {
        return playbackCreateAction.data?.policy === 'signed';
      }
    }

    // If there are no pending actions, use the state of the asset
    return this.isUsingSigned();
  };

  requestDeleteAsset = async () => {
    if (!this.state.value || !this.state.value.assetId) {
      throw Error('Something went wrong, we cannot delete an asset without an assetId.');
    }

    const result = await this.props.sdk.dialogs.openConfirm({
      title: 'Mark asset for deletion?',
      message:
        'This will mark the asset for deletion. The asset will be deleted from Mux and Contentful when you publish. You can undo this action before publishing.',
      intent: 'negative',
      confirmLabel: 'Yes, Mark for Deletion',
      cancelLabel: 'Cancel',
    });

    if (result) {
      await this.onDeleteAsset();
    }
  };

  requestRemoveAsset = async () => {
    const result = await this.props.sdk.dialogs.openConfirm({
      title: 'Are you sure you want to remove this asset?',
      message: 'This will remove the asset in Contentful, but remain in Mux.',
      intent: 'negative',
      confirmLabel: 'Yes, remove',
      cancelLabel: 'Cancel',
    });

    if (!result) {
      this.setState({ isDeleting: false });
      return;
    }
    this.setState({ isDeleting: true });

    await this.resetField();
    this.setState({ isDeleting: false });
  };

  resetField = async () => {
    await this.props.sdk.field.setValue(undefined);
    this.setState({ error: false, errorShowResetAction: false });
  };

  isURL = (string: string): boolean => {
    let url;
    try {
      url = new URL(string);
    } catch (_) {
      return false;
    }
    return url.protocol === 'http:' || url.protocol === 'https:';
  };

  /**
   * Does the stored value hold anything a fresh `{ assetId }` would destroy?
   *
   * Only Robots records and the caption list count. The rest of the value is an asset mirror that
   * the poll rebuilds from Mux within a second of the write, so losing it costs nothing.
   */
  private holdsUnrecoverableData = (value: MuxContentfulObject | undefined): boolean =>
    !!(value?.robotsJobs?.length || value?.robotsOutputs || value?.captions?.length);

  addVideoByInput = async (e): Promise<void> => {
    e.preventDefault();
    const input = e.target.muxvideoinput.value.trim();
    if (!input) return;

    if (this.isURL(input)) {
      this.setState({ modalAssetConfigurationVisible: true, pendingUploadURL: input });
      return;
    }

    // This is one of the three writes ADR-0001 keeps off `updateField` because it deliberately
    // discards everything. Discarding is right when the field is empty, which is the only state
    // this form is reachable from now that the editor branch keys off `assetId`. The confirm is
    // for the case that gets us here anyway — a value that still holds Robots records or a
    // caption list is not an empty field, and replacing it silently is not a recoverable action.
    const current = this.props.sdk.field.getValue() as MuxContentfulObject | undefined;
    if (this.holdsUnrecoverableData(current) && current?.assetId !== input) {
      const confirmed = await this.props.sdk.dialogs.openConfirm({
        title: 'Replace this video?',
        message:
          'This field already holds data for another Mux asset — Robots results and caption records that are stored nowhere else. Replacing it discards them permanently.',
        intent: 'negative',
        confirmLabel: 'Yes, replace it',
        cancelLabel: 'Cancel',
      });
      if (!confirmed) return;
    }

    await this.props.sdk.field.setValue({
      assetId: input,
    });
    this.pollForAssetDetails();
  };

  handleFile = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      this.setState({ file: e.target.files[0] });
      this.setState({ modalAssetConfigurationVisible: true });
    }
  };

  handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files?.[0]) {
      this.setState({ file: e.dataTransfer.files[0] });
      this.setState({ modalAssetConfigurationVisible: true });
    }
  };

  onConfirmModal = async (options: ModalData) => {
    // Remembered before the upload starts, because it is the only moment anything in the browser
    // knows a directive was attached: `new_asset_settings.directives` goes out with the asset and
    // Mux dispatches the run server-side, with nothing to observe it. See `announceRobotsActivity`.
    this.uploadDirectiveIds = options.directiveIds ?? [];

    if (this.state.pendingUploadURL) {
      await addByURL({
        muxApi: this.muxApi,
        sdk: this.props.sdk,
        remoteURL: this.state.pendingUploadURL,
        options,
        setAssetError: this.setAssetError,
        pollForAssetDetails: this.pollForAssetDetails,
      });
      this.setState({ pendingUploadURL: null });
    } else {
      const muxUploadUrl = await getUploadUrl(this.muxApi, this.props.sdk, options);

      if (!muxUploadUrl) {
        // Adding this fallback so the upload won't fail when the DRM Configuration ID is invalid
        this.setState({ modalAssetConfigurationVisible: false });
        return;
      }

      const uploader = this.muxUploaderRef.current!;
      uploader.endpoint = muxUploadUrl;

      uploader.dispatchEvent(
        new CustomEvent('file-ready', {
          bubbles: true,
          composed: true,
          detail: this.state.file,
        })
      );

      this.setState({ showMuxUploaderUI: true });
    }
    this.setState({ modalAssetConfigurationVisible: false });
  };

  onCloseModal = () => {
    if (this.state.pendingUploadURL) {
      this.setState({ pendingUploadURL: null });
    } else {
      this.resolveRef.current?.(null);
      this.setState({ file: null });
      if (this.fileInputRef.current) {
        this.fileInputRef.current.value = '';
      }
    }
    this.setState({ modalAssetConfigurationVisible: false });
  };

  onUploadError = (progress: CustomEvent) => {
    this.setState({ error: progress.detail });
  };

  onUploadSuccess = async () => {
    await this.pollForUploadDetails();
  };

  setAssetError = (errorMessage: string) => {
    this.setState({
      error: `Error with this video file: ${errorMessage}`,
      errorShowResetAction: true,
    });
  };

  pollForUploadDetails = async () => {
    if (!this.state.value || !this.state.value.uploadId) {
      throw Error('Something went wrong, because by this point we require an upload ID.');
    }

    try {
      const muxUpload = await this.muxApi.getUpload(this.state.value.uploadId);

      if (muxUpload.error) {
        this.setAssetError(muxUpload.error.messages[0]);
        return;
      }

      if (muxUpload.data?.status === 'errored') {
        this.setAssetError(muxUpload.data.errors?.messages[0] ?? 'Unknown error');
        return;
      }

      if (muxUpload && muxUpload.data['asset_id']) {
        await this.props.sdk.field.setValue({
          uploadId: muxUpload.data.id,
          assetId: muxUpload.data['asset_id'],
        });
        await this.pollForAssetDetails();
      } else {
        await delay(350);
        await this.pollForUploadDetails();
      }
    } catch (e) {
      if (e instanceof MuxApiError) {
        this.setAssetError(e.message);
      } else {
        this.setState({ error: 'Error: Failed to get upload status.' });
      }
    }
  };

  private fetchSignedTokens = async (playbackId: string, isDRM = false): Promise<SignedTokens> => {
    this.setState({ isTokenLoading: true });

    try {
      const tokens = await this.muxApi.getSignedUrlTokens(playbackId, isDRM);
      this.setState({ isTokenLoading: false });
      return tokens;
    } catch (e) {
      console.error(e);
      return {
        licenseToken: undefined,
        playbackToken: 'playback-token-not-found',
        posterToken: 'poster-token-not-found',
        storyboardToken: 'storyboard-token-not-found',
      };
    }
  };

  setSignedPlayback = async (signedPlaybackId: string, isDRM = false) => {
    const { muxSigningKeyId, muxSigningKeyPrivate } = this.props.sdk.parameters
      .installation as InstallationParams;
    if (!(muxSigningKeyId && muxSigningKeyPrivate)) {
      this.setState({
        error: `Error: this asset was created with ${
          isDRM ? 'DRM protection' : 'signed playback'
        }, but signing keys do not exist for your account. Make sure to enable "Signed URLs" in the app settings.`,
        errorShowResetAction: true,
      });
      return;
    }
    const { playbackToken, posterToken, storyboardToken, licenseToken } =
      await this.fetchSignedTokens(signedPlaybackId, isDRM);

    this.setState({
      playbackToken,
      posterToken,
      storyboardToken,
      drmLicenseToken: licenseToken,
      isTokenLoading: false,
    });
  };

  getAsset = async (assetId: string) => {
    if (!assetId) {
      throw Error('Something went wrong, we cannot getAsset without an assetId.');
    }
    return this.muxApi.getAsset(assetId);
  };

  resync = async (params?: ResyncParams) => {
    this.setState({ isTokenLoading: true });
    await this.pollForAssetDetails();

    if (!params?.silent) {
      this.props.sdk.notifier.success('Updated: Data was synced with Mux.');
    }

    if (!params?.skipPlayerResync) {
      this.reloadPlayer();
    }
  };

  pollForAssetDetails = async (isRecursiveCall = false): Promise<void> => {
    if (!isRecursiveCall && this.state.isPolling) {
      this.pollPending = true;
      return;
    }

    // Read the field, not React state: `onValueChanged` refreshes state asynchronously, so with a
    // second writer in play state can lag behind what is actually stored.
    const currentValue = this.props.sdk.field.getValue() as MuxContentfulObject | undefined;
    if (!currentValue || !currentValue.assetId) {
      return;
    }

    if (!isRecursiveCall) {
      this.setState({ isPolling: true });
    }

    try {
      const assetRes = await this.getAsset(currentValue.assetId);

      if (!assetRes) {
        throw Error('Something went wrong, we were not able to get the asset.');
      }

      // Only when it actually changed. This runs every 500 ms while an asset prepares and every
      // second for the whole life of a live stream, and an unconditional setState re-renders the
      // field editor on each tick — which resets the Robots poll timer before it can ever fire.
      this.setState((previous) =>
        JSON.stringify(previous.raw) === JSON.stringify(assetRes) ? null : { raw: assetRes }
      );

      let assetError;
      if (assetRes.error) {
        assetError = assetRes.error.messages[0] || 'Unknown error';
      }
      if (assetRes.data?.status === 'errored') {
        assetError = assetRes.data.errors?.messages[0] || 'Unknown error';
      }

      if (assetError) {
        this.setAssetError(assetError);
        await this.updateField((current) =>
          current ? { ...current, error: assetError } : current
        );
        if (!isRecursiveCall) {
          this.setState({ isPolling: false });
        }
        return;
      }

      const asset = assetRes.data;

      const publicPlayback = asset.playback_ids?.find(
        ({ policy }: { policy: string }) => policy === 'public'
      );
      const signedPlayback = asset.playback_ids?.find(
        ({ policy }: { policy: string }) => policy === 'signed'
      );
      const drmPlayback = asset.playback_ids?.find(
        ({ policy }: { policy: string }) => policy === 'drm'
      );

      const audioOnly =
        'max_stored_resolution' in asset && asset.max_stored_resolution === 'Audio only';

      const erroredTracks = asset.tracks?.filter((track) => track.status === 'errored');

      // Notify of the error and delete any failed tracks (like captions) so the track can be re-uploaded.
      if (erroredTracks && erroredTracks.length > 0) {
        this.props.sdk.notifier.error(erroredTracks[0].error?.messages[0] ?? 'Track error');
        try {
          await this.muxApi.deleteTrack(currentValue.assetId, erroredTracks[0].id);
        } catch (error) {
          if (error instanceof MuxApiError) {
            this.props.sdk.notifier.error('Error deleting track: ' + error.message);
          } else {
            console.error(error);
          }
        }
      }

      let audioTracks: Track[] | undefined = undefined;
      let captions: Track[] | undefined = undefined;
      let chaptersTrack: Track | undefined = undefined;
      let trackPreparing = false;
      if (asset.tracks) {
        asset.tracks.forEach((track) => {
          // Accumulated, not assigned. This was `trackPreparing = track.status === 'preparing'`,
          // so only the *last* track counted: a caption still preparing stopped the poll loop as
          // soon as any ready track followed it in the list, and the entry kept whatever the
          // half-finished track looked like until someone reloaded.
          trackPreparing = trackPreparing || track.status === 'preparing';
          if (track.type === 'audio') {
            audioTracks = [...(audioTracks || []), track];
          } else if (isCaptionTrack(track)) {
            captions = [...(captions || []), track];
          } else if (!chaptersTrack && isChaptersTrack(track)) {
            chaptersTrack = track;
          }
        });
      }

      // The asset mirror, overlaid onto whatever is stored rather than replacing it: building a
      // fresh object from a fixed key list drops every key it does not know about, `robotsJobs`
      // and `robotsOutputs` included, on every poll tick. Setting a mirror key to `undefined`
      // still clears it, because JSON drops undefined keys on the way to storage.
      //
      // The version is derived, never asserted — see `deriveFieldVersion` and ADR-0006.
      await this.updateField((current) => {
        if (!current) return current;
        return {
          ...current,
          version: deriveFieldVersion(current),
          uploadId: current.uploadId || undefined,
          assetId: current.assetId,
          playbackId: (publicPlayback && publicPlayback.id) || undefined,
          signedPlaybackId: (signedPlayback && signedPlayback.id) || undefined,
          drmPlaybackId: (drmPlayback && drmPlayback.id) || undefined,
          ready: asset.status === 'ready',
          ratio: asset.aspect_ratio || undefined,
          max_stored_resolution: asset.max_stored_resolution || undefined,
          max_stored_frame_rate: asset.max_stored_frame_rate || undefined,
          duration: asset.duration || undefined,
          audioOnly: audioOnly,
          error: assetError || undefined,
          created_at: asset.created_at ? Number(asset.created_at) : undefined,
          captions: captions,
          audioTracks: audioTracks,
          chaptersTrack: chaptersTrack,
          static_renditions: asset.static_renditions?.files || undefined,
          is_live: asset.is_live || undefined,
          live_stream_id: asset.live_stream_id || undefined,
          meta: asset.meta || undefined,
          passthrough: asset.passthrough || undefined,
          pendingActions: current.pendingActions || undefined,
        };
      });

      // The `else` matters: playback IDs can be deleted at Mux — by hand, or by a `moderate`
      // workflow configured with `on_flagged: delete_playback_ids` — and leaving the last known
      // id behind keeps a stale token beside it.
      const nextPlayerPlaybackId =
        drmPlayback?.id || publicPlayback?.id || signedPlayback?.id || undefined;

      // The player vanishing mid-session needs saying out loud. A `moderate` run started from the
      // Robots tab can delete every playback ID, and the poll picks that up silently — the notice
      // in the editor explains the end state, but only a toast connects it to what just happened.
      const hadPlaybackId = hasAnyPlaybackId(currentValue);
      if (hadPlaybackId && !nextPlayerPlaybackId) {
        this.props.sdk.notifier.warning(
          'This video no longer has any playback IDs, so it cannot be played. Request a new one in the Playback tab, or add one in Mux and resync.'
        );
      }

      this.setState({ playerPlaybackId: nextPlayerPlaybackId });
      if (!nextPlayerPlaybackId) {
        this.setState({
          playbackToken: undefined,
          posterToken: undefined,
          storyboardToken: undefined,
          drmLicenseToken: undefined,
        });
      }

      if (signedPlayback) {
        await this.setSignedPlayback(signedPlayback.id);
      } else if (drmPlayback) {
        await this.setSignedPlayback(drmPlayback.id, true);
      }

      // The asset being ready is what "the upload finished" means to Mux, and it is when an
      // ingest-attached directive actually starts — not when the upload's asset id appeared,
      // which is minutes earlier for a long video. Fired here so both upload paths (direct and
      // by URL) reach it, and not awaited: this poll drives the player and must not wait on it.
      if (asset.status === 'ready') void this.announceRobotsActivity(currentValue.assetId);

      const renditionPreparing = asset.static_renditions?.files
        ? asset.static_renditions.files.find((rend) => rend.status === 'preparing')
        : false;

      // Contentful is not able to listen for Mux webhooks, so we poll for status changes.
      // Users will need to leave their browser windows open until processses are complete.
      // Webhooks are the recommended way to listen for status changes over polling.
      if (asset.status === 'preparing' || trackPreparing || renditionPreparing) {
        await delay(500);
        await this.pollForAssetDetails(true);
      }

      if (asset.is_live === true) {
        await delay(1000);
        await this.pollForAssetDetails(true);
      }
    } finally {
      if (!isRecursiveCall) {
        this.setState({ isPolling: false }, () => {
          if (this.pollPending) {
            this.pollPending = false;
            this.pollForAssetDetails();
          }
        });
      }
    }
  };

  /**
   * Tell the editor that the directives they attached to this upload are already at work.
   *
   * An ingest-dispatched run is the one thing this app cannot see happen. There is no browser
   * moment to record it — Mux creates the run server-side from `new_asset_settings` — which is
   * the known gap in ADR-0009, and the reason the tested case was "the directive ran correctly
   * and the editor had no idea until they happened to open the Robots tab". This does not close
   * that gap; it points at the tab where the work is visible, at the one moment the editor is
   * still looking at the upload they just made.
   *
   * Three bounds, all deliberate:
   *
   * - **It only runs for an upload that attached a directive**, so an install with no Robots
   *   pays nothing and hears nothing (ADR-0006).
   * - **It runs once per session**, from the flag above rather than from anything on the entry,
   *   so reopening an entry whose asset has automation on it is silent.
   * - **It gives up after `ROBOTS_UPLOAD_CHECK_ATTEMPTS`.** Polling for a run that never starts
   *   would spend app-action round trips on an open tab indefinitely, and the Robots tab is the
   *   place that answers the question properly. Each wait is an `await`, not a scheduled
   *   callback, and every step re-checks `isUnmounted` — a closing tab stops here rather than
   *   notifying into a component that is gone.
   */
  private announceRobotsActivity = async (assetId: string): Promise<void> => {
    const directiveIds = this.uploadDirectiveIds;
    if (this.hasAnnouncedRobotsOnUpload || directiveIds.length === 0 || !this.muxApi) return;
    this.hasAnnouncedRobotsOnUpload = true;

    for (let attempt = 0; attempt < ROBOTS_UPLOAD_CHECK_ATTEMPTS; attempt += 1) {
      if (attempt > 0) await delay(ROBOTS_UPLOAD_CHECK_INTERVAL_MS);
      if (this.isUnmounted) return;

      try {
        // Both, because a run exists before the first job it dispatches does, and a job outlives
        // a run that has fallen out of the list window. Either one answers the question.
        const [jobs, ...runLists] = await Promise.all([
          this.muxApi.listRobotsJobs({ asset_id: assetId, limit: 1 }),
          ...directiveIds.map((directiveId) =>
            this.muxApi.listRobotsDirectiveRuns(directiveId, { limit: 25 })
          ),
        ]);
        if (this.isUnmounted) return;

        const hasJob = (jobs.data ?? []).length > 0;
        const hasRun = runLists.some((list) =>
          (list.data ?? []).some((run) => run.subject_id === assetId)
        );
        if (hasJob || hasRun) {
          this.props.sdk.notifier.success(
            'Robots is already working on this video. Open the Robots tab to follow along.'
          );
          return;
        }
      } catch (error) {
        // Nothing here is worth an error toast: the editor did not ask for this check, and the
        // Robots tab reports its own failures properly.
        console.error('[robots] Could not check what is running on the new asset', error);
        return;
      }
    }
  };

  onPlayerReady = () => this.props.sdk.window.updateHeight();

  uploadTrack = async (form: HTMLFormElement, type: 'audio' | 'caption') => {
    if (!this.state.value?.assetId) return;

    const captionsTypeInput = form.elements.namedItem('captionsType') as HTMLSelectElement;
    const urlInput = form.elements.namedItem('url') as HTMLInputElement;
    const nameInput = form.elements.namedItem('name') as HTMLInputElement;
    const languageCodeInput = form.elements.namedItem('languagecode') as HTMLInputElement;
    const closedCaptionsInput = form.elements.namedItem('closedcaptions') as HTMLInputElement;

    try {
      if (type === 'caption' && captionsTypeInput?.value === 'auto') {
        const audioTrack =
          this.state.value.audioTracks?.find((track) => track.type === 'audio' && track.primary) ||
          this.state.value.audioTracks?.[0];

        if (!audioTrack) {
          throw new Error('No audio track found to generate subtitles');
        }

        await this.muxApi.generateSubtitles(this.state.value.assetId, audioTrack.id, {
          language_code: languageCodeInput.value,
          name: nameInput.value,
        });
      } else {
        const options = {
          url: urlInput.value,
          name: nameInput.value,
          language_code: languageCodeInput.value || 'en-US',
          type: type === 'audio' ? ('audio' as const) : ('text' as const),
          ...(type === 'caption' && {
            text_type: 'subtitles',
            closed_captions: closedCaptionsInput?.checked || false,
          }),
        };

        await this.muxApi.createTrack(this.state.value.assetId, options);
      }

      await this.resync();
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.props.sdk.notifier.error(error.message);
      } else {
        this.props.sdk.notifier.error('An unknown error occurred');
      }
    }
  };

  deleteTrack = async (trackId: string) => {
    if (!this.state.value?.assetId) return;

    try {
      await this.muxApi.deleteTrack(this.state.value.assetId, trackId);
      await this.resync();
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.props.sdk.notifier.error(error.message);
      } else {
        this.props.sdk.notifier.error('An unknown error occurred');
      }
      this.resync({ silent: true });
    }
  };

  reloadPlayer = async () => {
    if (!this.state || !this.state.value) return;
    this.muxPlayerRef.current?.load();
  };

  generateExternalPlayerURL = (): string | null => {
    if (
      !this.isUsingDRM() ||
      !this.state.value ||
      !this.state.playbackToken ||
      !this.state.drmLicenseToken
    ) {
      return null;
    }

    const playbackId = this.state.value.drmPlaybackId;
    const streamType = this.getPlayerType();
    const customDomain = this.props.sdk.parameters.installation.muxDomain;
    const videoTitle = this.state.value.meta?.title || 'DRM Protected Video';

    // Use JSON.stringify for safe string escaping
    const tokens = {
      playback: this.state.playbackToken,
      ...(this.state.posterToken && { thumbnail: this.state.posterToken }),
      ...(this.state.storyboardToken && { storyboard: this.state.storyboardToken }),
      drm: this.state.drmLicenseToken,
    };

    // Build player attributes
    const attrs: string[] = [
      `playback-id="${playbackId}"`,
      streamType ? `stream-type="${streamType}"` : '',
      customDomain && customDomain !== 'mux.com' ? `custom-domain="${customDomain}"` : '',
      this.state.value.audioOnly ? 'audio="true"' : '',
    ].filter(Boolean);

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mux DRM Player - ${videoTitle.replace(/"/g, '&quot;')}</title>
  <style>
    body {
      margin: 0;
      padding: 20px;
      font-family: BlinkMacSystemFont, Segoe UI, Helvetica, Arial, sans-serif;
      background: white;
      color: #333;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
    }
    .container {
      max-width: 1200px;
      width: 100%;
    }
    h1 {
      margin-bottom: 20px;
      font-size: 24px;
    }
    mux-player {
      width: 100%;
      max-width: 100%;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>${videoTitle.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</h1>
    <script src="https://unpkg.com/@mux/mux-player"></script>
    <mux-player ${attrs.join(' ')} style="width:100%"></mux-player>
    <script>
      const player = document.querySelector('mux-player');
      if (player) {
        player.tokens = ${JSON.stringify(tokens)};
      }
    </script>
  </div>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html' });
    return URL.createObjectURL(blob);
  };

  playerParams = () => {
    if (!this.state.value) return;

    const params = [
      {
        name: 'playback-id',
        value:
          this.state.value.playbackId ||
          this.state.value.signedPlaybackId ||
          this.state.value.drmPlaybackId,
      },
      {
        name: 'stream-type',
        value: this.getPlayerType(),
      },
      {
        name: 'video-title',
        value: this.state.value.meta?.title,
      },
    ];
    if (this.state.value.signedPlaybackId) {
      params.push(
        {
          name: 'playback-token',
          value: this.isUsingSigned() ? this.state.playbackToken : undefined,
        },
        {
          name: 'thumbnail-token',
          value: this.isUsingSigned() ? this.state.posterToken : undefined,
        },
        {
          name: 'storyboard-token',
          value: this.isUsingSigned() ? this.state.storyboardToken : undefined,
        }
      );
    }
    if (this.isUsingDRM() && this.state.playbackToken) {
      params.push(
        {
          name: 'playback-token',
          value: this.state.playbackToken,
        },
        {
          name: 'thumbnail-token',
          value: this.state.posterToken,
        },
        {
          name: 'storyboard-token',
          value: this.state.storyboardToken,
        },
        {
          name: 'drm-token',
          value: this.state.drmLicenseToken,
        }
      );
    }
    if (this.state.value.audioOnly) {
      params.push({
        name: 'audio',
        value: this.state.value.audioOnly.toString(),
      });
    }
    if (this.props.sdk.parameters.installation.muxDomain !== 'mux.com') {
      params.push({
        name: 'custom-domain',
        value: this.props.sdk.parameters.installation.muxDomain,
      });
    }
    return params;
  };

  swapPlaybackIDs = async (policy: PolicyType) => {
    await this.updateField((currentValue) => {
      if (!currentValue) return currentValue;

      const currentPlaybackId =
        currentValue.playbackId || currentValue.signedPlaybackId || currentValue.drmPlaybackId;

      const updatedPendingActions: PendingActions = {
        delete: currentValue.pendingActions?.delete
          ? currentValue.pendingActions.delete.filter((action) => action.type !== 'playback')
          : [],
        create: currentValue.pendingActions?.create
          ? currentValue.pendingActions.create.filter((action) => action.type !== 'playback')
          : [],
        update: currentValue.pendingActions?.update ?? [],
      };

      // `undefined` when the asset has no playback ID and none is queued, which is the whole
      // point: this used to read "public" in that state, so requesting a public playback ID on an
      // asset that had lost all of them was silently dropped as "already public". Shared with
      // `PlaybackSwitcher` so the click and the radio can never disagree about what is current.
      const currentPolicy = currentPlaybackPolicy(currentValue);

      if (policy === currentPolicy) return currentValue;

      // Only queue a delete when there is something to delete. The Playback tab is now reachable
      // on an asset whose playback IDs have all been removed, and a delete action with no `id`
      // makes the publish function issue `DELETE /assets/{id}/playback-ids` with no ID — which
      // fails, gets re-queued with a bumped retry, and fails again on the next three publishes.
      if (currentPlaybackId) {
        updatedPendingActions.delete.push({ type: 'playback', id: currentPlaybackId, retry: 0 });
      }
      updatedPendingActions.create.push({
        type: 'playback',
        data: {
          policy: policy,
          assetId: currentValue.assetId,
        },
        retry: 0,
      });
      return updatePendingActions(currentValue, updatedPendingActions);
    });
  };

  getPlayerAspectRatio = () => {
    if (!this.state.value) return undefined;

    if (this.state.value?.max_stored_resolution === 'Audio only') {
      return undefined;
    }

    const ratio = this.state.value.ratio ? this.state.value.ratio.replace(':', '/') : '16 / 9';

    return { aspectRatio: ratio };
  };

  isLive = () => {
    if (!this.state.value) return;
    return this.state.value.is_live;
  };
  isLiveRecording = () => {
    if (!this.state.value) return;
    return this.state.value.live_stream_id;
  };

  getPlayerType = () => {
    if (!this.state.raw?.data) return 'on-demand';
    const asset = this.state.raw.data;

    // For this to completely work, we need the live stream response,
    // however API rate limiting may become an issue.
    if ('stream_key' in asset) {
      if (asset.latency_mode === 'low') return 'll-live';
      return 'live';
    } else if ('live_stream_id' in asset) {
      if (!asset.is_live) return 'on-demand';
      if (asset.latency_mode === 'low') return 'll-live:dvr';
      return 'live:dvr';
    } else {
      return 'on-demand';
    }
  };

  deleteStaticRenditionHandler = async (staticRenditionId: string) => {
    if (!this.state.value || !this.state.value.assetId) return;
    const assetId = this.state.value.assetId;

    try {
      await this.muxApi.deleteStaticRendition(assetId, staticRenditionId);
      await delay(500);
      await this.resync({ skipPlayerResync: true });
    } catch (e) {
      if (e instanceof MuxApiError) {
        this.props.sdk.notifier.error(e.message);
      } else {
        this.props.sdk.notifier.error('Error deleting static rendition');
      }
      this.resync({ silent: true, skipPlayerResync: true });
    }
  };

  createStaticRenditionHandler = async (type: ResolutionType) => {
    if (!this.state.value || !this.state.value.assetId) return;
    const assetId = this.state.value.assetId;

    try {
      await this.muxApi.createStaticRendition(assetId, type);
      await delay(500);
      await this.resync({ skipPlayerResync: true });
    } catch (e) {
      if (e instanceof MuxApiError) {
        this.props.sdk.notifier.error(e.message);
      } else {
        this.props.sdk.notifier.error('Error creating static rendition');
      }
      this.resync({ silent: true, skipPlayerResync: true });
    }
  };

  onDeleteTrack = async (trackId: string, type: 'caption' | 'audio') => {
    await this.updateField((value) => {
      if (!value) return value;
      const pending: PendingActions = value.pendingActions || {
        delete: [],
        create: [],
        update: [],
      };
      const newDelete: PendingAction[] = [
        ...pending.delete,
        { type: type === 'caption' ? 'caption' : 'audio', id: trackId, retry: 0 },
      ];
      return updatePendingActions(value, { ...pending, delete: newDelete });
    });
  };

  onUndoDeleteTrack = async (trackId: string, type: 'caption' | 'audio') => {
    await this.updateField((value) => {
      if (!value || !value.pendingActions) return value;
      const newDelete = value.pendingActions.delete.filter(
        (action) =>
          !(action.type === (type === 'caption' ? 'caption' : 'audio') && action.id === trackId)
      );
      return updatePendingActions(value, { ...value.pendingActions, delete: newDelete });
    });
  };

  onDeleteRendition = async (renditionId: string) => {
    await this.updateField((value) => {
      if (!value) return value;
      const pending: PendingActions = value.pendingActions || {
        delete: [],
        create: [],
        update: [],
      };
      const newDelete = [
        ...pending.delete,
        { type: 'staticRendition', id: renditionId, retry: 0 } as PendingAction,
      ];
      return updatePendingActions(value, { ...pending, delete: newDelete });
    });
  };

  onUndoDeleteRendition = async (renditionId: string) => {
    await this.updateField((value) => {
      if (!value || !value.pendingActions) return value;
      const newDelete = value.pendingActions.delete.filter(
        (action) => !(action.type === 'staticRendition' && action.id === renditionId)
      );
      return updatePendingActions(value, { ...value.pendingActions, delete: newDelete });
    });
  };

  isTrackPendingDelete = (trackId: string, type: 'caption' | 'audio') => {
    const pending = this.state.value?.pendingActions?.delete || [];
    return pending.some(
      (action) =>
        action.type === (type === 'caption' ? 'caption' : 'audio') && action.id === trackId
    );
  };

  isRenditionPendingDelete = (renditionId: string) => {
    const pending = this.state.value?.pendingActions?.delete || [];
    return pending.some((action) => action.type === 'staticRendition' && action.id === renditionId);
  };

  // Helper to check if asset is pending delete
  isAssetPendingDelete = () => {
    const assetId = this.state.value?.assetId;
    if (!assetId) return false;
    const pending = this.state.value?.pendingActions?.delete || [];
    return pending.some((action) => action.type === 'asset' && action.id === assetId);
  };

  // Handler to add asset to pending delete
  onDeleteAsset = async () => {
    await this.updateField((value) => {
      if (!value || !value.assetId) return value;
      const pending: PendingActions = value.pendingActions || {
        delete: [],
        create: [],
        update: [],
      };
      const newDelete = [...pending.delete, { type: 'asset', id: value.assetId, retry: 0 }];
      return updatePendingActions(value, { ...pending, delete: newDelete });
    });
  };

  // Handler to undo asset pending delete
  onUndoDeleteAsset = async () => {
    await this.updateField((value) => {
      if (!value || !value.pendingActions || !value.assetId) return value;
      const newDelete = value.pendingActions.delete.filter(
        (action) => !(action.type === 'asset' && action.id === value.assetId)
      );
      return updatePendingActions(value, { ...value.pendingActions, delete: newDelete });
    });
  };

  onUpdateMetadata = async ({ standardMetadata }: { standardMetadata: { title?: string } }) => {
    await this.updateField((value) => {
      if (!value) return value;
      const currentTitle = value.meta?.title || '';
      const newTitle = standardMetadata.title || '';
      const pending: PendingActions = value.pendingActions || {
        delete: [],
        create: [],
        update: [],
      };
      let newUpdate: PendingAction[] =
        pending.update?.filter((action) => action.type !== 'metadata') ?? [];

      if (currentTitle !== newTitle) {
        newUpdate = [
          ...newUpdate.map((action) => ({ ...action, retry: action.retry ?? 0 })),
          { type: 'metadata', data: { title: newTitle }, retry: 0 },
        ];
      } else {
        newUpdate = newUpdate.map((action) => ({ ...action, retry: action.retry ?? 0 }));
      }
      return updatePendingActions(value, { ...pending, update: newUpdate });
    });
  };

  render = () => {
    const modal = (
      <MuxAssetConfigurationModal
        isShown={this.state.modalAssetConfigurationVisible}
        onClose={this.onCloseModal}
        onConfirm={this.onConfirmModal}
        installationParams={this.props.sdk.parameters.installation as InstallationParams}
        asset={this.state.value}
        sdk={this.props.sdk}
        canChooseDirectives={this.userCanRunRobots}
        muxApi={this.muxApi}
        file={this.state.file}
        pendingUploadURL={this.state.pendingUploadURL}
      />
    );

    if (this.state.error) {
      return (
        <Note variant="negative" className="center" data-testid="terminalerror">
          <Flex justifyContent="space-between" alignItems="center">
            {this.state.error}
            {this.state.errorShowResetAction ? (
              <Button
                variant="negative"
                size="small"
                onClick={this.resetField}
                className="reset-field-button">
                Reset this field
              </Button>
            ) : null}
          </Flex>
        </Note>
      );
    }

    if (this.state.isDeleting) {
      return (
        <Note variant="neutral" className="center" data-testid="deletemessage">
          <Spinner size="small" /> Deleting this asset.
        </Note>
      );
    }

    // Gated on `assetId`, not on a playback ID.
    //
    // `moderate` with `on_flagged.action: delete_playback_ids` — and anyone clicking delete in the
    // Mux dashboard — removes every playback ID from the asset. The mirror then correctly clears
    // all three, and this branch used to fall through to the upload area, presenting a field that
    // still held `assetId`, `captions`, `robotsJobs` and `robotsOutputs` as if it were empty. The
    // only affordance left was the "URL or Mux Asset ID" form, whose submit replaces the whole
    // value — so the one visible way out destroyed the Robots record and the caption list.
    //
    // An entry with an asset gets the editor for that asset. Whether it can be *played* is a
    // property of the asset, not of whether this field has anything in it.
    if (this.state.value && this.state.value.assetId) {
      const { muxDomain } = this.props.sdk.parameters.installation as InstallationParams;

      const hasPlaybackId = hasAnyPlaybackId(this.state.value);

      const showPlayer = this.isPlayerReady();

      // Read from the stored value, so this costs no request and is known before the Robots tab
      // has fetched anything.
      const unfinishedJobs = unfinishedJobRecords(this.state.value);

      return (
        <>
          {modal}
          <div>
            {this.isUsingDRM() &&
              (() => {
                const externalPlayerURL =
                  this.state.playbackToken && this.state.drmLicenseToken
                    ? this.generateExternalPlayerURL()
                    : null;

                return (
                  <Box marginBottom="spacingM">
                    <Note variant="warning">
                      DRM-protected videos cannot be displayed in Contentful's preview due to
                      platform-level security restrictions.{' '}
                      {externalPlayerURL ? (
                        <>
                          <TextLink
                            href={externalPlayerURL}
                            target="_blank"
                            rel="noopener noreferrer">
                            Open in external player
                          </TextLink>{' '}
                          to view the DRM-protected video (note: DRM playback has an associated
                          cost), or use the generated playback code in your production environment.
                        </>
                      ) : (
                        'The generated playback code is fully functional and will work correctly in your production environment outside of Contentful.'
                      )}
                    </Note>
                  </Box>
                );
              })()}

            {this.isUsingDRM() && !this.state.drmLicenseToken && !this.state.isTokenLoading && (
              <Box marginBottom="spacingM">
                <Note variant="negative" data-testid="nodrmtoken">
                  {(() => {
                    const { muxSigningKeyId, muxSigningKeyPrivate } = this.props.sdk.parameters
                      .installation as InstallationParams;
                    if (!muxSigningKeyId || !muxSigningKeyPrivate) {
                      return 'No signing key to create a DRM license token. Please configure signing keys in the app settings.';
                    }
                    return 'You must enable the "Signed URLs" in the app settings to preview this video with DRM protection.';
                  })()}
                </Note>
              </Box>
            )}

            {this.isUsingSigned() && (
              <Box marginBottom="spacingM">
                <Note variant="neutral">
                  This Mux asset is using a{' '}
                  <TextLink
                    href="https://docs.mux.com/docs/headless-cms-contentful#advanced-signed-urls"
                    target="_blank"
                    rel="noopener noreferrer">
                    signedPlaybackId
                  </TextLink>
                </Note>
              </Box>
            )}

            {this.state.value.signedPlaybackId &&
              !this.state.playbackToken &&
              !this.state.isTokenLoading && (
                <Box marginBottom="spacingM">
                  <Note variant="negative" data-testid="nosigningtoken">
                    No signing key to create a playback token. Preview playback may not work. Try
                    toggling the global signing key settings.
                  </Note>
                </Box>
              )}

            {this.isAssetPendingDelete() && (
              <Box marginBottom="spacingM">
                <Note variant="negative">
                  This asset is <strong>marked for deletion</strong>. It will be deleted from Mux
                  and Contentful when you publish. You can undo this action before publishing.
                </Note>
              </Box>
            )}

            {/* Publishing mid-job is allowed, and says so rather than being blocked — see
                ADR-0013. It lives out here rather than in the Robots tab because the editor
                deciding to publish is not necessarily looking at that tab. */}
            {unfinishedJobs.length > 0 && (
              <Box marginBottom="spacingM">
                <Note variant="warning" data-testid="robots-jobs-in-flight">
                  {unfinishedJobs.length === 1
                    ? 'A Robots job is still running on this video.'
                    : `${unfinishedJobs.length} Robots jobs are still running on this video.`}{' '}
                  You can publish now, but the entry will publish the job as unfinished — publish
                  again once it completes to include the result.
                </Note>
              </Box>
            )}

            {/* Where the player would go. An asset with no playback IDs is not an error and not
                an empty field — it is a video that currently cannot be played, and saying so is
                the whole point: everything else on this screen still works. */}
            {!hasPlaybackId && (
              <Box marginBottom="spacingM">
                <Note variant="warning" data-testid="noplaybackids">
                  <Flex justifyContent="space-between" alignItems="center" gap="spacingM">
                    <span>
                      This video has no playback IDs, so it cannot be played or embedded. The asset
                      and everything recorded against it are still here. Playback IDs can be removed
                      in the Mux dashboard, or by a Robots moderation run set to delete them when
                      content is flagged. Request a new one in the Playback tab and publish, or add
                      one in Mux and resync.
                    </span>
                    <Button
                      variant="secondary"
                      size="small"
                      onClick={() => this.resync()}
                      className="resync-no-playback">
                      Resync
                    </Button>
                  </Flex>
                </Note>
              </Box>
            )}

            {showPlayer && (
              <section className="player" style={this.getPlayerAspectRatio()}>
                <MuxPlayer
                  ref={this.muxPlayerRef}
                  data-testid="muxplayer"
                  style={{ height: '100%', width: '100%' }}
                  playbackId={this.state.playerPlaybackId}
                  streamType={this.getPlayerType()}
                  customDomain={muxDomain && muxDomain !== 'mux.com' ? muxDomain : undefined}
                  audio={this.state.value.audioOnly}
                  metadata={{
                    player_name: 'Contentful Admin Dashboard',
                    viewer_user_id:
                      'user' in this.props.sdk ? this.props.sdk.user.sys.id : undefined,
                    page_type: 'Preview Player',
                  }}
                  tokens={
                    this.isUsingSigned() && this.state.playbackToken
                      ? {
                          playback: this.state.playbackToken,
                          thumbnail: this.state.posterToken,
                          storyboard: this.state.storyboardToken,
                        }
                      : undefined
                  }
                />
              </section>
            )}

            {showPlayer && this.isLive() && (
              <Box marginBottom="spacingM" marginTop="spacingM">
                <Note variant="positive">Is Live</Note>
              </Box>
            )}

            {this.state.value && this.state.value.assetId && (
              <Box marginTop="spacingM">
                <Menu
                  requestRemoveAsset={this.requestRemoveAsset}
                  onDelete={this.requestDeleteAsset}
                  onUndo={this.onUndoDeleteAsset}
                  isPendingDelete={this.isAssetPendingDelete()}
                  resync={this.resync}
                  assetId={this.state.value.assetId}
                />
              </Box>
            )}

            {/* `hasPlaybackId` keeps "waiting for the asset to become playable" out of the one
                case where it is never going to: there is nothing to wait for without a playback
                ID, and the note above says so instead. */}
            {!showPlayer && hasPlaybackId && !this.isUsingDRM() && (
              <section className="uploader_area center aspectratio" data-testid="waitingtoplay">
                <span>
                  <Spinner size="small" /> Waiting for asset to be playable
                </span>
                <Button
                  variant="negative"
                  size="small"
                  onClick={this.resetField}
                  className="reset-field-button">
                  Reset this field
                </Button>
              </section>
            )}

            {/* `currentTab` is controlled rather than left to `defaultTab` so the Robots panel
                knows when it is being looked at: every panel renders, and Robots must not cost an
                app-action round trip on entries where nobody opens it. */}
            <Tabs
              currentTab={this.state.selectedTab}
              onTabChange={(tab) => this.setState({ selectedTab: tab })}>
              <Tabs.List variant="horizontal-divider" className="tabs-scroll">
                <Tabs.Tab panelId="captions">Captions</Tabs.Tab>
                <Tabs.Tab panelId="audio">Audio Tracks</Tabs.Tab>
                <Tabs.Tab panelId="robots">Robots</Tabs.Tab>
                <Tabs.Tab panelId="metadata">Metadata</Tabs.Tab>
                <Tabs.Tab panelId="mp4renditions">MP4 Renditions</Tabs.Tab>
                <Tabs.Tab panelId="playback">Playback</Tabs.Tab>
                <Tabs.Tab panelId="playercode">Player Code</Tabs.Tab>
                <Tabs.Tab panelId="debug">Data</Tabs.Tab>
              </Tabs.List>

              <Box marginTop="spacingL" marginBottom="spacingL">
                <Tabs.Panel id="captions">
                  <TrackForm
                    onSubmit={(e) => {
                      e.preventDefault();
                      this.uploadTrack(e.target as HTMLFormElement, 'caption');
                    }}
                    onDeleteTrack={(trackId) => this.onDeleteTrack(trackId, 'caption')}
                    onUndoDeleteTrack={(trackId) => this.onUndoDeleteTrack(trackId, 'caption')}
                    isTrackPendingDelete={(trackId) =>
                      this.isTrackPendingDelete(trackId, 'caption')
                    }
                    tracks={(this.state.value?.captions || []) as Track[]}
                    type="caption"
                    title="Add Caption"
                    playbackId={
                      this.state.value?.playbackId ||
                      this.state.value?.signedPlaybackId ||
                      this.state.value?.drmPlaybackId
                    }
                    domain={this.props.sdk.parameters.installation.domain}
                    token={this.state.playbackToken}
                    isSigned={this.isUsingSigned()}
                  />
                </Tabs.Panel>

                <Tabs.Panel id="audio">
                  <TrackForm
                    onSubmit={(e) => {
                      e.preventDefault();
                      this.uploadTrack(e.target as HTMLFormElement, 'audio');
                    }}
                    onDeleteTrack={(trackId) => this.onDeleteTrack(trackId, 'audio')}
                    onUndoDeleteTrack={(trackId) => this.onUndoDeleteTrack(trackId, 'audio')}
                    isTrackPendingDelete={(trackId) => this.isTrackPendingDelete(trackId, 'audio')}
                    tracks={(this.state.value?.audioTracks || []) as Track[]}
                    type="audio"
                    title="Add Audio Track"
                    playbackId={
                      this.state.value?.playbackId ||
                      this.state.value?.signedPlaybackId ||
                      this.state.value?.drmPlaybackId
                    }
                    domain={this.props.sdk.parameters.installation.domain}
                    token={this.state.playbackToken}
                    isSigned={this.isUsingSigned()}
                  />
                </Tabs.Panel>

                {/* `forceMount` because this panel holds state that must outlive a tab switch.
                    f36's `Tabs.Panel` forwards it to Radix, which otherwise *unmounts* an
                    inactive panel rather than hiding it — and the poll loop, which notices a
                    job finishing while the editor watches Captions, and the create this tab may
                    be making, both live in this component. Costs nothing in requests: `isActive`
                    already gates the first fetch.

                    `hidden` has to be ours. Radix reads `forceMount` as "mounted *and* rendered"
                    — it sets `hidden={!present}` and `forceMount` is what makes `present` true —
                    so the panel would otherwise draw its contents underneath every other tab.
                    That is for animation libraries that manage visibility themselves; here the
                    only thing we wanted from it was to keep the component alive. */}
                <Tabs.Panel id="robots" forceMount>
                  {/* The `hidden` lives on our own element rather than on `Tabs.Panel`, which
                      forwards unknown props to its div at runtime but does not declare them. */}
                  <div hidden={this.state.selectedTab !== 'robots'} data-test-id="robots_tab_panel">
                    {/* Fenced off: an unhandled error here would otherwise unmount the whole field
                      editor, and with `forceMount` this panel now renders on every entry with a
                      video — including installs that never enable Robots. */}
                    <RobotsErrorBoundary>
                      <RobotsPanel
                        sdk={this.props.sdk}
                        muxApi={this.muxApi}
                        value={this.state.value}
                        isActive={this.state.selectedTab === 'robots'}
                        updateField={this.updateField}
                        resync={this.resync}
                        defaultDirectiveIds={
                          (this.props.sdk.parameters.installation as InstallationParams)
                            .muxDefaultDirectiveIds ?? NO_DIRECTIVE_IDS
                        }
                        canRunRobots={this.userCanRunRobots}
                      />
                    </RobotsErrorBoundary>
                  </div>
                </Tabs.Panel>

                <Tabs.Panel id="metadata">
                  <MetadataPanel
                    asset={this.state.value}
                    onUpdateMetadata={this.onUpdateMetadata}
                  />
                </Tabs.Panel>

                <Tabs.Panel id="playercode">
                  {!hasPlaybackId ? (
                    // A snippet built from no playback ID is `playback-id=""` and
                    // `player.mux.com/` — copyable, and broken wherever it is pasted.
                    <Box marginBottom="spacingM" marginTop="spacingM">
                      <Note variant="warning" data-testid="playercode-noplaybackid">
                        There is no playback ID to build player code from. Request one in the
                        Playback tab and publish, or add one in Mux and resync.
                      </Note>
                    </Box>
                  ) : (
                    <>
                      {(this.isUsingSigned() || this.isUsingDRM()) && (
                        <Box marginBottom="spacingM" marginTop="spacingM">
                          <Note variant="warning">
                            {this.isUsingDRM()
                              ? 'DRM-protected content requires license tokens to be generated on your server. This code snippet is for reference only.'
                              : 'This code snippet is for limited testing and expires after about 12 hours. Tokens should be generated seperately.'}
                          </Note>
                        </Box>
                      )}
                      <PlayerCode params={this.playerParams() || []} />
                    </>
                  )}
                </Tabs.Panel>

                <Tabs.Panel id="playback">
                  <PlaybackSwitcher
                    value={this.state.value}
                    onSwapPlaybackIDs={this.swapPlaybackIDs}
                    enableSignedUrls={
                      (this.props.sdk.parameters.installation as InstallationParams)
                        .muxEnableSignedUrls
                    }
                    enableDRM={
                      (this.props.sdk.parameters.installation as InstallationParams).muxEnableDRM
                    }
                  />
                </Tabs.Panel>

                <Tabs.Panel id="debug">
                  <Box marginTop="spacingS">
                    <Flex
                      justifyContent="space-between"
                      alignItems="center"
                      marginBottom="spacingM">
                      <Flex marginRight="spacingM">
                        <Button id="resync" variant="secondary" onClick={() => this.resync()}>
                          Resync
                        </Button>
                      </Flex>
                    </Flex>
                  </Box>

                  {this.state.raw?.data?.playback_ids?.length > 1 ? (
                    <Note variant="warning">
                      This Asset ID has multiple playback IDs in Mux. Only the first public or
                      signed ID will be used in Contentful.
                    </Note>
                  ) : (
                    ''
                  )}

                  <pre>
                    <Box as="code" display="inline" marginRight="spacingL">
                      {JSON.stringify(this.state.value, null, 2)}
                    </Box>
                  </pre>
                </Tabs.Panel>

                <Tabs.Panel id="mp4renditions">
                  <Mp4RenditionsPanel
                    asset={this.state.value}
                    onCreateRendition={this.createStaticRenditionHandler}
                    onDeleteRendition={this.onDeleteRendition}
                    onUndoDeleteRendition={this.onUndoDeleteRendition}
                    isRenditionPendingDelete={this.isRenditionPendingDelete}
                  />
                </Tabs.Panel>
              </Box>
            </Tabs>
          </div>
        </>
      );
    }

    return (
      <section>
        {modal}
        <UploadArea
          showMuxUploaderUI={this.state.showMuxUploaderUI}
          muxUploaderRef={this.muxUploaderRef}
          onSuccess={this.onUploadSuccess}
          onDrop={this.handleDrop}
          onFileChange={this.handleFile}
          fileInputRef={this.fileInputRef}
        />

        <Form onSubmit={this.addVideoByInput}>
          <FormControl>
            <FormControl.Label>URL or Mux Asset ID</FormControl.Label>
            <TextInput type="text" name="muxvideoinput" />
            <Box marginTop="spacingM">
              <Button variant="secondary" type="submit">
                Submit
              </Button>
            </Box>
          </FormControl>
        </Form>
      </section>
    );
  };
}

init((sdk) => {
  if (sdk.location.is(locations.LOCATION_APP_CONFIG)) {
    render(<Config sdk={sdk as AppExtensionSDK} />, document.getElementById('root'));
  } else if (sdk.location.is(locations.LOCATION_ENTRY_SIDEBAR)) {
    render(<Sidebar sdk={sdk as SidebarExtensionSDK} />, document.getElementById('root'));
  } else {
    render(<App sdk={sdk as FieldExtensionSDK} />, document.getElementById('root'));
  }
});

// Enabling hot reload
if (typeof module !== 'undefined' && module.hot) {
  module.hot.accept();
}
