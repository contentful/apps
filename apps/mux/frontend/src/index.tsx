/* eslint-disable  @typescript-eslint/no-non-null-assertion */

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
import ApiClient from './util/apiClient';

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

import {
  type InstallationParams,
  type MuxContentfulObject,
  type AppState,
  AppProps,
  ResolutionType,
  Track,
  ResyncParams,
  PendingActions,
  PendingAction,
} from './util/types';

import './index.css';
import { createClient, PlainClientAPI } from 'contentful-management';
import {
  addByURL,
  getUploadUrl,
  deleteStaticRendition,
  createStaticRendition,
  uploadTrack,
  deleteTrack,
  generateAutoCaptions,
} from './util/muxApi';
import Sidebar from './locations/Sidebar';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface SignedTokens {
  playbackToken: string;
  posterToken: string;
  storyboardToken: string;
}

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

// Helper for updating pendingActions
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
  apiClient: ApiClient;
  cmaClient: PlainClientAPI;
  resolveRef = createRef<(value: string | null) => void>();
  muxUploaderRef = createRef<any>(); // eslint-disable-line @typescript-eslint/no-explicit-any
  fileInputRef = React.createRef<HTMLInputElement>();
  muxPlayerRef = React.createRef<any>(); // eslint-disable-line @typescript-eslint/no-explicit-any
  getSignedTokenActionId: string;
  private pollPending = false;

  constructor(props: AppProps) {
    super(props);

    const { muxAccessTokenId, muxAccessTokenSecret } = this.props.sdk.parameters
      .installation as InstallationParams;
    this.apiClient = new ApiClient(muxAccessTokenId, muxAccessTokenSecret);

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

    this.getSignedTokenActionId = '';
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
        field && ('playbackId' in field || 'signedPlaybackId' in field)
          ? field.playbackId || field.signedPlaybackId
          : undefined,
      modalAssetConfigurationVisible: false,
      file: null,
      showMuxUploaderUI: false,
      pendingUploadURL: null,
      isPolling: false,
      initialResyncDone: false,
      captionname: undefined,
      audioName: undefined,
      playbackToken: undefined,
      posterToken: undefined,
      storyboardToken: undefined,
      raw: undefined,
    };
  }

  // eslint-disable-next-line  @typescript-eslint/ban-types
  detachExternalChangeHandler: Function | null = null;
  detachSysChangeHandler: Function | null = null;

  checkForValidAsset = async () => {
    if (!(this.state.value && this.state.value.assetId)) return false;
    const res = await this.apiClient.get(`/video/v1/assets/${this.state.value.assetId}`);
    if (!res) {
      this.setState({
        error: 'Error: Failed to get status update.',
      });
      return false;
    }
    if (res.status === 400) {
      const json = await res.json();
      if (json.error.messages[0].match(/mismatching environment/)) {
        this.setState({
          error: 'Error: it looks like your api keys are for the wrong environment',
        });
        return false;
      }
      this.setState({
        error: json.error.messages[0],
        errorShowResetAction: true,
      });
      return false;
    }
    if (res.status === 401) {
      this.setState({
        error:
          'Error: it looks like your api keys are not configured properly. Check App configuration.',
      });
      return false;
    }
    if (res.status === 404) {
      this.setState({
        error: 'Error: The video was not found.',
        errorShowResetAction: true,
      });
      return false;
    }

    if (!res.ok) {
      this.setState({
        error: 'API Check Error: ' + res.statusText,
        errorShowResetAction: true,
      });
      return false;
    }
    return true;
  };

  async componentDidMount() {
    const appActionsResponse = await this.cmaClient.appAction.getManyForEnvironment({
      environmentId: this.props.sdk.ids.environment,
      spaceId: this.props.sdk.ids.space,
    });
    this.getSignedTokenActionId =
      appActionsResponse.items.find((x) => x.name === 'getSignedUrlTokens')?.sys.id ?? '';

    this.props.sdk.window.startAutoResizer();

    // Handler for external field value changes (e.g. when multiple authors are working on the same entry).
    this.detachExternalChangeHandler = this.props.sdk.field.onValueChanged(this.onExternalChange);

    // Subscribe to any `sys` change to detect publish
    const initialSys = this.props.sdk.entry.getSys();
    this.detachSysChangeHandler = this.props.sdk.entry.onSysChanged(async (newSys) => {
      const wasPublished =
        !!newSys.publishedVersion && newSys.version === newSys.publishedVersion + 1;

      const justNow = !initialSys.publishedAt || initialSys.publishedAt !== newSys.publishedAt;

      if (wasPublished && justNow) {
        await this.resync();
      }
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
        if (this.isUsingSigned() && this.state.value.signedPlaybackId) {
          await this.setSignedPlayback(this.state.value.signedPlaybackId);
          this.setState({ playerPlaybackId: this.state.value.signedPlaybackId });
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
    if (this.state.value?.assetId && !this.state.initialResyncDone) {
      this.resync({ silent: true });
      this.setState({ initialResyncDone: true });
    }
  }

  componentWillUnmount() {
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

  addVideoByInput = async (e): Promise<void> => {
    e.preventDefault();
    const input = e.target.muxvideoinput.value.trim();
    if (!input) return;

    if (this.isURL(input)) {
      this.setState({ modalAssetConfigurationVisible: true, pendingUploadURL: input });
      return;
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
    if (this.state.pendingUploadURL) {
      await addByURL({
        apiClient: this.apiClient,
        sdk: this.props.sdk,
        remoteURL: this.state.pendingUploadURL,
        options,
        responseCheck: async (res) => await this.responseCheck(res),
        setAssetError: this.setAssetError,
        pollForAssetDetails: this.pollForAssetDetails,
      });
      this.setState({ pendingUploadURL: null });
    } else {
      const muxUploadUrl = await getUploadUrl(
        this.apiClient,
        this.props.sdk,
        options,
        async (res) => await this.responseCheck(res)
      );
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

    const result = await this.apiClient.get(`/video/v1/uploads/${this.state.value.uploadId}`);

    if (!this.responseCheck(result)) {
      return;
    }

    const muxUpload = await result.json();

    if ('error' in muxUpload) {
      this.setAssetError(muxUpload.error.messages[0]);
      return;
    }

    if (muxUpload.data?.status === 'errored') {
      this.setAssetError(muxUpload.data.errors.messages[0]);
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
  };

  private fetchSignedTokens = async (playbackId: string): Promise<SignedTokens> => {
    this.setState({ isTokenLoading: true });

    try {
      if (!this.getSignedTokenActionId) {
        throw new Error('App Action for Get Signed Token not found.');
      }

      const {
        response: { body },
      } = await this.cmaClient.appActionCall.createWithResponse(
        {
          organizationId: this.props.sdk.ids.organization,
          appDefinitionId: this.props.sdk.ids.app!,
          appActionId: this.getSignedTokenActionId,
        },
        { parameters: { playbackId } }
      );
      const parsedBody = JSON.parse(body);
      if (!parsedBody.ok) throw new Error(parsedBody.error);

      const tokens = parsedBody.data as SignedTokens;
      this.setState({ isTokenLoading: false });
      return tokens;
    } catch (e) {
      console.error(e);
      this.setState({ isTokenLoading: false });
      return {
        playbackToken: 'playback-token-not-found',
        posterToken: 'poster-token-not-found',
        storyboardToken: 'storyboard-token-not-found',
      };
    }
  };

  setSignedPlayback = async (signedPlaybackId: string) => {
    const { muxSigningKeyId, muxSigningKeyPrivate } = this.props.sdk.parameters
      .installation as InstallationParams;
    if (!(muxSigningKeyId && muxSigningKeyPrivate)) {
      this.setState({
        error:
          'Error: this asset was created with a signed playback ID, but signing keys do not exist for your account',
        errorShowResetAction: true,
      });
      return;
    }
    const { playbackToken, posterToken, storyboardToken } = await this.fetchSignedTokens(
      signedPlaybackId
    );
    this.setState({ playbackToken, posterToken, storyboardToken });
  };

  getAsset = async (assetId: string) => {
    if (!assetId) {
      throw Error('Something went wrong, we cannot getAsset without an assetId.');
    }
    const res = await this.apiClient.get(`/video/v1/assets/${assetId}`);
    if (!this.responseCheck(res)) {
      return;
    }
    const asset = await res.json();
    return asset;
  };

  responseCheck = async (res) => {
    switch (true) {
      case res.status === 401: {
        const json = await res.json();
        this.props.sdk.notifier.error(
          'Looks like something is wrong with the Mux Access Token in the config. Are you sure the token ID and secret in the extension settings match the access token you created?'
        );
        this.setAssetError(json.error.messages[0]);
        return false;
      }

      case res.status === 429:
        this.props.sdk.notifier.error(
          'Mux API rate limit exceeded. Try closing the browser and wait a few minutes.'
        );
        return false;

      case !res.ok:
        this.props.sdk.notifier.error(`API Error. ${res.status} ${res.statusText}`);
        return false;

      default:
        return true;
    }
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

    if (!this.state.value || !this.state.value.assetId) {
      return;
    }

    if (!isRecursiveCall) {
      this.setState({ isPolling: true });
    }

    try {
      const assetRes = await this.getAsset(this.state.value.assetId);

      if (!assetRes) {
        throw Error('Something went wrong, we were not able to get the asset.');
      }

      this.setState({
        raw: assetRes,
      });

      let assetError;
      if ('error' in assetRes) {
        assetError = assetRes.error.messages[0] || 'Unknown error';
      }
      if (assetRes.data?.status === 'errored') {
        assetError = assetRes.data.errors.messages[0] || 'Unknown error';
      }

      if (assetError) {
        this.setAssetError(assetError);
        await this.props.sdk.field.setValue({
          ...this.state.value,
          error: assetError,
        });
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

      const audioOnly =
        'max_stored_resolution' in asset && asset.max_stored_resolution === 'Audio only';

      const erroredTracks =
        'tracks' in asset ? asset.tracks.filter((track) => track.status === 'errored') : undefined;

      // Notifly of the error and delete any failed tracks (like captions) so the track can be re-uploaded.
      if (erroredTracks && erroredTracks.length > 0) {
        this.props.sdk.notifier.error(erroredTracks[0].error.messages[0]);
        const res = await this.apiClient.del(
          `/video/v1/assets/${this.state.value.assetId}/tracks/${erroredTracks[0].id}`
        );
        if (res.status !== 204) {
          try {
            const deleteError = await res.clone().json();
            this.props.sdk.notifier.error('Error deleting track: ' + deleteError.messages[0]);
          } catch (error) {
            const deleteError = await res.clone().text();
            console.error(error, deleteError);
          }
        }
      }

      let audioTracks: Track[] | undefined = undefined;
      let captions: Track[] | undefined = undefined;
      let trackPreparing = false;
      if ('tracks' in asset) {
        asset.tracks.forEach((track) => {
          trackPreparing = track.status === 'preparing';
          if (track.type === 'audio') {
            audioTracks = [...(audioTracks || []), track];
          } else if (
            track.text_type === 'subtitles' &&
            (track.status === 'ready' || track.status === 'preparing')
          ) {
            captions = [...(captions || []), track];
          }
        });
      }

      const newValue = {
        version: this.state.value.version ?? 3,
        uploadId: this.state.value.uploadId || undefined,
        assetId: this.state.value.assetId,
        playbackId: (publicPlayback && publicPlayback.id) || undefined,
        signedPlaybackId: (signedPlayback && signedPlayback.id) || undefined,
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
        static_renditions: asset.static_renditions?.files || undefined,
        is_live: asset.is_live || undefined,
        live_stream_id: asset.live_stream_id || undefined,
        meta: asset.meta || undefined,
        passthrough: asset.passthrough || undefined,
        pendingActions: this.state.value.pendingActions || undefined,
      };
      const oldNorm = JSON.stringify(normalizeForDiff(this.state.value));
      const newNorm = JSON.stringify(normalizeForDiff(newValue));
      if (oldNorm !== newNorm) {
        await this.props.sdk.field.setValue(newValue);
      }

      if (publicPlayback && publicPlayback.id) {
        this.setState({ playerPlaybackId: publicPlayback.id });
      } else if (signedPlayback && signedPlayback.id) {
        this.setState({ playerPlaybackId: signedPlayback.id });
      }

      if (signedPlayback) {
        await this.setSignedPlayback(signedPlayback.id);
      }

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

        await generateAutoCaptions(this.apiClient, this.state.value.assetId, audioTrack.id, {
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

        await uploadTrack(this.apiClient, this.state.value.assetId, options);
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
      const res = await deleteTrack(this.apiClient, this.state.value.assetId, trackId);

      if (res.status === 204) {
        await this.resync();
      } else {
        const errorRes = await res.json();
        if (errorRes.error?.messages?.[0]) {
          this.props.sdk.notifier.error(errorRes.error.messages[0]);
        }
        this.resync({ silent: true });
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.props.sdk.notifier.error(error.message);
      } else {
        this.props.sdk.notifier.error('An unknown error occurred');
      }
    }
  };

  reloadPlayer = async () => {
    if (!this.state || !this.state.value) return;
    this.muxPlayerRef.current?.load();
  };

  playerParams = () => {
    if (!this.state.value) return;

    const params = [
      {
        name: 'playback-id',
        value: this.state.value.playbackId || this.state.value.signedPlaybackId,
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

  swapPlaybackIDs = async (policy: 'public' | 'signed') => {
    if (!this.state.value) return;

    const currentValue = this.state.value;
    const currentPlaybackId = currentValue.playbackId || currentValue.signedPlaybackId;
    const totalPendingActions =
      (currentValue.pendingActions?.create?.length || 0) +
      (currentValue.pendingActions?.delete?.length || 0);

    const updatedPendingActions: PendingActions = {
      delete: currentValue.pendingActions?.delete
        ? currentValue.pendingActions.delete.filter((action) => action.type !== 'playback')
        : [],
      create: currentValue.pendingActions?.create
        ? currentValue.pendingActions.create.filter((action) => action.type !== 'playback')
        : [],
      update: currentValue.pendingActions?.update ?? [],
    };

    const hasPending =
      updatedPendingActions.create.length + updatedPendingActions.delete.length <
      totalPendingActions;

    if (hasPending) {
      await this.props.sdk.field.setValue(
        updatePendingActions(currentValue, updatedPendingActions)
      );
      return;
    }

    const isCurrentlySigned = this.isUsingSigned();
    const currentPolicy = isCurrentlySigned ? 'signed' : 'public';
    let targetPolicy: 'public' | 'signed';

    if (policy) {
      if (policy === currentPolicy) return;
      targetPolicy = policy;
    } else {
      targetPolicy = isCurrentlySigned ? 'public' : 'signed';
    }

    updatedPendingActions.delete.push({ type: 'playback', id: currentPlaybackId, retry: 0 });
    updatedPendingActions.create.push({
      type: 'playback',
      data: {
        policy: targetPolicy,
        assetId: currentValue.assetId,
      },
      retry: 0,
    });
    await this.props.sdk.field.setValue(updatePendingActions(currentValue, updatedPendingActions));
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

    const res = await deleteStaticRendition(this.apiClient, assetId, staticRenditionId);

    if (res.status === 204) {
      await delay(500);
      await this.resync({ skipPlayerResync: true });
    } else {
      try {
        const errorRes = await res.json();
        if (errorRes.error?.messages?.[0]) {
          this.props.sdk.notifier.error(errorRes.error.messages[0]);
        }
      } catch (e) {
        this.props.sdk.notifier.error('Error deleting static rendition');
      }
      this.resync({ silent: true, skipPlayerResync: true });
    }
  };

  createStaticRenditionHandler = async (type: ResolutionType) => {
    if (!this.state.value || !this.state.value.assetId) return;
    const assetId = this.state.value.assetId;

    const res = await createStaticRendition(this.apiClient, assetId, type);

    if (res.status === 201) {
      await delay(500);
      await this.resync({ skipPlayerResync: true });
    } else {
      try {
        const errorRes = await res.json();
        if (errorRes.error?.messages?.[0]) {
          this.props.sdk.notifier.error(errorRes.error.messages[0]);
        }
      } catch (e) {
        this.props.sdk.notifier.error('Error creating static rendition');
      }
      this.resync({ silent: true, skipPlayerResync: true });
    }
  };

  onDeleteTrack = async (trackId: string, type: 'caption' | 'audio') => {
    const value = this.state.value;
    if (!value) return;
    const pending: PendingActions = value.pendingActions || { delete: [], create: [], update: [] };
    const newDelete: PendingAction[] = [
      ...pending.delete,
      { type: type === 'caption' ? 'caption' : 'audio', id: trackId, retry: 0 },
    ];
    const newPendingActions: PendingActions = { ...pending, delete: newDelete };
    await this.props.sdk.field.setValue(updatePendingActions(value, newPendingActions));
  };

  onUndoDeleteTrack = async (trackId: string, type: 'caption' | 'audio') => {
    const value = this.state.value;
    if (!value || !value.pendingActions) return;
    const newDelete = value.pendingActions.delete.filter(
      (action) =>
        !(action.type === (type === 'caption' ? 'caption' : 'audio') && action.id === trackId)
    );
    const newPendingActions: PendingActions = {
      ...value.pendingActions,
      delete: newDelete,
    };
    await this.props.sdk.field.setValue(updatePendingActions(value, newPendingActions));
  };

  onDeleteRendition = async (renditionId: string) => {
    const value = this.state.value;
    if (!value) return;
    const pending: PendingActions = value.pendingActions || { delete: [], create: [], update: [] };
    const newDelete = [
      ...pending.delete,
      { type: 'staticRendition', id: renditionId, retry: 0 } as PendingAction,
    ];
    const newPendingActions: PendingActions = { ...pending, delete: newDelete };
    await this.props.sdk.field.setValue(updatePendingActions(value, newPendingActions));
  };

  onUndoDeleteRendition = async (renditionId: string) => {
    const value = this.state.value;
    if (!value || !value.pendingActions) return;
    const newDelete = value.pendingActions.delete.filter(
      (action) => !(action.type === 'staticRendition' && action.id === renditionId)
    );
    const newPendingActions: PendingActions = {
      ...value.pendingActions,
      delete: newDelete,
    };
    await this.props.sdk.field.setValue(updatePendingActions(value, newPendingActions));
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
    const value = this.state.value;
    if (!value || !value.assetId) return;
    const pending: PendingActions = value.pendingActions || { delete: [], create: [], update: [] };
    const newDelete = [...pending.delete, { type: 'asset', id: value.assetId, retry: 0 }];
    const newPendingActions = { ...pending, delete: newDelete };
    await this.props.sdk.field.setValue(updatePendingActions(value, newPendingActions));
  };

  // Handler to undo asset pending delete
  onUndoDeleteAsset = async () => {
    const value = this.state.value;
    if (!value || !value.pendingActions || !value.assetId) return;
    const newDelete = value.pendingActions.delete.filter(
      (action) => !(action.type === 'asset' && action.id === value.assetId)
    );
    const newPendingActions = { ...value.pendingActions, delete: newDelete };
    await this.props.sdk.field.setValue(updatePendingActions(value, newPendingActions));
  };

  onUpdateMetadata = async ({ standardMetadata }: { standardMetadata: { title?: string } }) => {
    const value = this.state.value;
    if (!value) return;
    const currentTitle = value.meta?.title || '';
    const newTitle = standardMetadata.title || '';
    const pending: PendingActions = value.pendingActions || { delete: [], create: [], update: [] };
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
    const newPendingActions = { ...pending, update: newUpdate };
    await this.props.sdk.field.setValue(updatePendingActions(value, newPendingActions));
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

    if (this.state.value && (this.state.value.playbackId || this.state.value.signedPlaybackId)) {
      const { muxDomain } = this.props.sdk.parameters.installation as InstallationParams;
      const showPlayer =
        (this.state.value.ready && this.state.value.playbackId) ||
        (this.isUsingSigned() && !this.state.isTokenLoading);

      return (
        <>
          {modal}
          <div>
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

            <section
              className="player"
              style={{ ...this.getPlayerAspectRatio(), display: showPlayer ? undefined : 'none' }}>
              {this.state.playerPlaybackId !== 'playback-test-123' && (
                <MuxPlayer
                  ref={this.muxPlayerRef}
                  data-testid="muxplayer"
                  style={{ height: '100%', width: '100%' }}
                  playbackId={this.state.playerPlaybackId}
                  streamType={this.getPlayerType()}
                  poster={this.state.value.audioOnly ? '#' : undefined}
                  customDomain={muxDomain && muxDomain !== 'mux.com' ? muxDomain : undefined}
                  audio={this.state.value.audioOnly}
                  metadata={{
                    player_name: 'Contentful Admin Dashboard',
                    viewer_user_id:
                      'user' in this.props.sdk ? this.props.sdk.user.sys.id : undefined,
                    page_type: 'Preview Player',
                  }}
                  tokens={{
                    playback: this.isUsingSigned() ? this.state.playbackToken : undefined,
                    thumbnail: this.isUsingSigned() ? this.state.posterToken : undefined,
                    storyboard: this.isUsingSigned() ? this.state.storyboardToken : undefined,
                  }}
                />
              )}
            </section>

            {showPlayer && this.isLive() && (
              <Box marginBottom="spacingM" marginTop="spacingM">
                <Note variant="positive">Is Live</Note>
              </Box>
            )}

            {showPlayer && (
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

            {!showPlayer && (
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

            <Tabs defaultTab="captions">
              <Tabs.List variant="horizontal-divider" className="tabs-scroll">
                <Tabs.Tab panelId="captions">Captions</Tabs.Tab>
                <Tabs.Tab panelId="audio">Audio Tracks</Tabs.Tab>
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
                    playbackId={this.state.value?.playbackId || this.state.value?.signedPlaybackId}
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
                    playbackId={this.state.value?.playbackId || this.state.value?.signedPlaybackId}
                    domain={this.props.sdk.parameters.installation.domain}
                    token={this.state.playbackToken}
                    isSigned={this.isUsingSigned()}
                  />
                </Tabs.Panel>

                <Tabs.Panel id="metadata">
                  <MetadataPanel
                    asset={this.state.value}
                    onUpdateMetadata={this.onUpdateMetadata}
                  />
                </Tabs.Panel>

                <Tabs.Panel id="playercode">
                  {this.isUsingSigned() && (
                    <Box marginBottom="spacingM" marginTop="spacingM">
                      <Note variant="warning">
                        This code snippet is for limited testing and expires after about 12 hours.
                        Tokens should be generated seperately.
                      </Note>
                    </Box>
                  )}
                  <PlayerCode params={this.playerParams() || []} />
                </Tabs.Panel>

                <Tabs.Panel id="playback">
                  <PlaybackSwitcher
                    value={this.state.value}
                    onSwapPlaybackIDs={this.swapPlaybackIDs}
                    enableSignedUrls={
                      (this.props.sdk.parameters.installation as InstallationParams)
                        .muxEnableSignedUrls
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
if (module.hot) {
  module.hot.accept();
}
