/* eslint-disable  @typescript-eslint/no-non-null-assertion */

import React from 'react';
import { render } from 'react-dom';

import { init, locations, AppExtensionSDK, FieldExtensionSDK } from '@contentful/app-sdk';
import {
  Button,
  Note,
  Spinner,
  TextLink,
  Tabs,
  Heading,
  Box,
  Flex,
  Switch,
} from '@contentful/f36-components';
import { Form, FormControl, Checkbox, TextInput } from '@contentful/f36-forms';

import MuxPlayer from '@mux/mux-player-react/dist/index.cjs';
import MuxUploader from '@mux/mux-uploader-react/dist/index.cjs';
import { MuxUploaderDrop } from '@mux/mux-uploader-react/dist/index.cjs';

import Config from './locations/config';
import ApiClient from './util/apiClient';
import {
  createSignedPlaybackToken,
  createSignedThumbnailToken,
  createSignedStoryboardToken,
} from './util/signingTokens';
import { countries } from './util/countries';

import Menu from './components/menu';
import PlayerCode from './components/playercode';
import CountryDatalist from './components/countryDatalist';
import CaptionsList from './components/captionsList';

import {
  type InstallationParams,
  type MuxContentfulObject,
  type AppState,
  AppProps,
} from './util/types';

import './index.css';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export class App extends React.Component<AppProps, AppState> {
  apiClient: ApiClient;

  constructor(props: AppProps) {
    super(props);

    const { muxAccessTokenId, muxAccessTokenSecret } = this.props.sdk.parameters
      .installation as InstallationParams;
    this.apiClient = new ApiClient(muxAccessTokenId, muxAccessTokenSecret);

    const field = props.sdk.field.getValue();

    this.state = {
      value: field,
      isDeleting: false,
      isReloading: false,
      error:
        (!muxAccessTokenId || !muxAccessTokenSecret) &&
        "It doesn't look like you've specified your Mux Access Token ID or Secret in the extension configuration.",
      errorShowResetAction: false,
      playerPlaybackId:
        field && ('playbackId' in field || 'signedPlaybackId' in field)
          ? field.playbackId || field.signedPlaybackId
          : undefined,
    };
  }

  // eslint-disable-next-line  @typescript-eslint/ban-types
  detachExternalChangeHandler: Function | null = null;

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
    this.props.sdk.window.startAutoResizer();

    // Handler for external field value changes (e.g. when multiple authors are working on the same entry).
    this.detachExternalChangeHandler = this.props.sdk.field.onValueChanged(this.onExternalChange);

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
          this.setSignedPlayback(this.state.value.signedPlaybackId);
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

  componentWillUnmount() {
    if (this.detachExternalChangeHandler) {
      this.detachExternalChangeHandler();
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

  requestDeleteAsset = async () => {
    if (!this.state.value || !this.state.value.assetId) {
      throw Error('Something went wrong, we cannot delete an asset without an assetId.');
    }

    const result = await this.props.sdk.dialogs.openConfirm({
      title: 'Are you sure you want to delete this asset?',
      message: 'This will delete the asset in both Mux and Contentful.',
      intent: 'negative',
      confirmLabel: 'Yes, Delete',
      cancelLabel: 'Cancel',
    });

    if (!result) {
      this.setState({ isDeleting: false });
      return;
    }
    this.setState({ isDeleting: true });

    const res = await this.apiClient.del(`/video/v1/assets/${this.state.value.assetId}`);

    if (!this.responseCheck(res)) {
      this.resync({ silent: true });
      return;
    }

    await this.resetField();
    this.setState({ isDeleting: false });
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
      this.addByURL(input);
      return;
    }

    await this.props.sdk.field.setValue({
      assetId: input,
    });
    this.pollForAssetDetails();
  };

  addByURL = async (remoteURL: string): Promise<void> => {
    const passthroughId = (this.props.sdk.entry.getSys() as { id: string }).id;

    const result = await this.apiClient.post(
      '/video/v1/assets',
      JSON.stringify({
        input: [
          {
            url: remoteURL,
          },
        ],
        passthrough: passthroughId,
        playback_policy: (this.props.sdk.parameters.installation as InstallationParams)
          .muxEnableSignedUrls
          ? 'signed'
          : 'public',
      })
    );

    if (!this.responseCheck(result)) {
      return;
    }

    const muxUpload = await result.json();

    if ('error' in muxUpload) {
      this.setAssetError(muxUpload.error.messages[0]);
      return;
    }

    if (muxUpload.data.status === 'errored') {
      this.setAssetError(muxUpload.data.errors.messages[0]);
      return;
    }

    await this.props.sdk.field.setValue({
      assetId: muxUpload.data.id,
    });
    await this.pollForAssetDetails();
  };

  getUploadUrl = async () => {
    const passthroughId = (this.props.sdk.entry.getSys() as { id: string }).id;

    const { muxEnableAudioNormalize } = this.props.sdk.parameters
      .installation as InstallationParams;

    const res = await this.apiClient.post(
      '/video/v1/uploads',
      JSON.stringify({
        cors_origin: window.location.origin,
        new_asset_settings: {
          passthrough: passthroughId,
          normalize_audio: muxEnableAudioNormalize || false,
          playback_policy: (this.props.sdk.parameters.installation as InstallationParams)
            .muxEnableSignedUrls
            ? 'signed'
            : 'public',
        },
      })
    );

    if (!this.responseCheck(res)) {
      return;
    }

    const { data: muxUpload } = await res.json();

    await this.props.sdk.field.setValue({
      uploadId: muxUpload.id,
    });

    return muxUpload.url;
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
    this.setState({
      playbackToken: createSignedPlaybackToken(
        signedPlaybackId,
        muxSigningKeyId!,
        muxSigningKeyPrivate!
      ),
      posterToken: createSignedThumbnailToken(
        signedPlaybackId,
        muxSigningKeyId!,
        muxSigningKeyPrivate!
      ),
      storyboardToken: createSignedStoryboardToken(
        signedPlaybackId,
        muxSigningKeyId!,
        muxSigningKeyPrivate!
      ),
    });
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

  // eslint-disable-next-line  @typescript-eslint/no-explicit-any
  resync = async (params?: any) => {
    return await this.pollForAssetDetails().then(() => {
      if (!params || !params.silent)
        this.props.sdk.notifier.success('Updated: Data was synced with Mux.');
      this.reloadPlayer();
    });
  };

  pollForAssetDetails = async (): Promise<void> => {
    if (!this.state.value || !this.state.value.assetId) {
      throw Error('Something went wrong, because by this point we require an assetId.');
    }

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
      return;
    }

    const asset = assetRes.data;

    const publicPlayback = asset.playback_ids.find(
      ({ policy }: { policy: string }) => policy === 'public'
    );
    const signedPlayback = asset.playback_ids.find(
      ({ policy }: { policy: string }) => policy === 'signed'
    );

    const audioOnly =
      'max_stored_resolution' in asset && asset.max_stored_resolution === 'Audio only'
        ? true
        : false;

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
          this.props.sdk.notifier.error('Error deleting caption: ' + deleteError.messages[0]);
        } catch (error) {
          const deleteError = await res.clone().text();
          console.error(error, deleteError);
        }
      }
    }

    const captions =
      'tracks' in asset
        ? asset.tracks.filter(
            (track) =>
              track.text_type === 'subtitles' &&
              (track.status === 'ready' || track.status === 'preparing')
          )
        : undefined;

    await this.props.sdk.field.setValue({
      version: 3,
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
      captions: captions && captions.length > 0 ? captions : undefined,
      is_live: asset.is_live || undefined,
      live_stream_id: asset.live_stream_id || undefined,
    });

    if (publicPlayback && publicPlayback.id) {
      this.setState({ playerPlaybackId: publicPlayback.id });
    } else if (signedPlayback && signedPlayback.id) {
      this.setState({ playerPlaybackId: signedPlayback.id });
    }

    if (signedPlayback) {
      this.setSignedPlayback(signedPlayback.id);
    }

    const trackPreparing = captions
      ? captions.find((track) => track.status === 'preparing')
      : false;

    // Contentful is not able to listen for Mux webhooks, so we poll for status changes.
    // Users will need to leave their browser windows open until processses are complete.
    // Webhooks are the recommended way to listen for status changes over polling.
    if (asset.status === 'preparing' || trackPreparing) {
      await delay(350);
      await this.pollForAssetDetails();
    }

    if (asset.is_live === true) {
      await delay(1000);
      await this.pollForAssetDetails();
    }
  };

  onPlayerReady = () => this.props.sdk.window.updateHeight();

  uploadCaption = async (e) => {
    if (!this.state.value) return;
    e.preventDefault();
    const form = e.target;

    if (form.url.value === '') return;
    if (form.name.value === '') return;

    const result = await this.apiClient.post(
      `/video/v1/assets/${this.state.value.assetId}/tracks`,
      JSON.stringify({
        url: form.url.value,
        name: form.name.value,
        language_code: form.languagecode.value || 'en-US',
        closed_captions: form.closedcaptions.checked || false,
        type: 'text',
        text_type: 'subtitles',
      })
    );

    if (!this.responseCheck(result)) {
      return;
    }

    const response = await result.json();

    if ('error' in response) {
      this.props.sdk.notifier.error('Error Uploading Captions: ' + response.error.messages[0]);
      return;
    }

    if (response.data.status === 'errored') {
      this.props.sdk.notifier.error(
        'Error Uploading Captions: ' + response.data.errors.messages[0]
      );
      return;
    }

    const captions = {
      type: response.data.type,
      'text_type ': response.data.text_type,
      language_code: response.data.language_code,
      name: response.data.name,
      closed_captions: response.data.closed_captions,
      //"status" : response.data.status, TODO Add or remove this.
      id: response.data.id,
      passthrough: response.data.passthrough,
    };

    this.state.value.captions = this.state.value.captions
      ? [...this.state.value.captions, captions]
      : [captions];

    this.clearCaptionForm(form);
    await this.resync();
    await this.reloadPlayer();
  };

  clearCaptionForm = (form) => {
    form.url.value = '';
    form.name.value = '';
    form.languagecode.value = '';
  };

  deleteCaption = async (e): Promise<void> => {
    if (!this.state.value) return;
    const trackID = e.target.closest('button').dataset.track;
    const assetID = this.state.value.assetId || '';
    const res = await this.apiClient.del(`/video/v1/assets/${assetID}/tracks/${trackID}`);
    if (res.status === 204) {
      await delay(500); // Hack, no webhook to wait for update, so we guess.
      await this.resync();
      await this.reloadPlayer();
    } else {
      const errorRes = await res.json();
      if (errorRes.error.messages[0]) {
        this.props.sdk.notifier.error(errorRes.error.messages[0]);
      }
      this.resync({ silent: true });
    }
  };

  autofillCaptionCode = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const val = e.target.value;
    if (val) {
      const language = countries.find((lang) => lang.name === val);
      if (language) {
        this.setState({
          captionname: language.code,
        });
      }
    }
  };

  updateLangCode = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    this.setState({
      captionname: val,
    });
  };

  reloadPlayer = async () => {
    if (!this.state || !this.state.value) return;
    // Toggle for Player to reload manifest and see/remove captions.
    this.setState({ isReloading: true });
    // A slight delay was required for captions to show.
    await delay(300).then(() => {
      this.setState({ isReloading: false });
    });
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

  swapPlaybackIDs = async () => {
    if (!this.state.value) return;

    const assetId = this.state.value.assetId;
    const playbackId = this.state.value.playbackId || this.state.value.signedPlaybackId;

    const deleteRes = await this.apiClient.del(
      `/video/v1/assets/${assetId}/playback-ids/${playbackId}`
    );

    if (!this.responseCheck(deleteRes)) {
      console.error('URL ', `/video/v1/assets/${assetId}/playback-ids/${playbackId}`);
      return;
    }

    try {
      const deleteResJson = await deleteRes.json();
      if ('error' in deleteRes) {
        this.props.sdk.notifier.error(deleteResJson.error.messages[0]);
      }
      // eslint-disable-next-line no-empty
    } catch (e) {}

    if (this.isUsingSigned()) {
      const createRes = await this.apiClient.post(
        `/video/v1/assets/${assetId}/playback-ids`,
        JSON.stringify({
          policy: 'public',
        })
      );
      this.responseCheck(createRes);
    } else {
      const createRes = await this.apiClient.post(
        `/video/v1/assets/${assetId}/playback-ids`,
        JSON.stringify({
          policy: 'signed',
        })
      );
      this.responseCheck(createRes);
    }

    this.resync();
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

  render = () => {
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

    if (this.state.value) {
      if (this.state.value.assetId && !this.state.value.ready) {
        return (
          <section data-testid="waitingtoplay" className="uploader_area center aspectratio">
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
        );
      }

      const { muxDomain } = this.props.sdk.parameters.installation as InstallationParams;

      if (
        this.state.value.ready &&
        (this.state.value.playbackId || this.state.value.signedPlaybackId)
      ) {
        return (
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

            {this.state.value.signedPlaybackId && !this.state.playbackToken && (
              <Box marginBottom="spacingM">
                <Note variant="negative" data-testid="nosigningtoken">
                  No signing key to create a playback token. Preview playback may not work. Try
                  toggling the global signing key settings.
                </Note>
              </Box>
            )}

            <section className="player" style={this.getPlayerAspectRatio()}>
              {!this.state.isReloading &&
              this.state.playerPlaybackId !== 'playback-test-123' &&
              (this.state.value.playbackId || this.state.playbackToken) ? (
                <MuxPlayer
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
              ) : (
                <Box>
                  <Spinner size="small" /> Refreshing Player
                </Box>
              )}
            </section>

            {this.isLive() && (
              <Box marginBottom="spacingM" marginTop="spacingM">
                <Note variant="positive">Is Live</Note>
              </Box>
            )}

            <Box marginTop="spacingM">
              <Menu
                requestRemoveAsset={this.requestRemoveAsset}
                requestDeleteAsset={this.requestDeleteAsset}
                resync={this.resync}
                assetId={this.state.value.assetId}
              />
            </Box>

            <Tabs defaultTab="captions">
              <Tabs.List variant="horizontal-divider">
                <Tabs.Tab panelId="captions">Captions</Tabs.Tab>
                <Tabs.Tab panelId="playercode">Player Code</Tabs.Tab>
                <Tabs.Tab panelId="debug">Data</Tabs.Tab>
              </Tabs.List>

              <Tabs.Panel id="playercode">
                {this.isUsingSigned() && (
                  <Box marginBottom="spacingM" marginTop="spacingM">
                    <Note variant="warning">
                      This code snippet is for limited testing and expires after about 12 hours.
                      Tokens should be generated seperately.
                    </Note>
                  </Box>
                )}
                <PlayerCode params={this.playerParams()}></PlayerCode>
              </Tabs.Panel>

              <Tabs.Panel id="captions">
                <Box marginTop="spacingL" marginBottom="spacingL">
                  {this.state.value?.captions && this.state.value?.captions.length > 0 ? (
                    <CaptionsList
                      captions={this.state.value.captions}
                      requestDeleteCaption={this.deleteCaption}
                      playbackId={this.state.value.playbackId || this.state.value.signedPlaybackId}
                      domain={this.props.sdk.parameters.installation.muxDomain}
                      token={this.state.playbackToken}></CaptionsList>
                  ) : (
                    <Note variant="neutral">No Captions</Note>
                  )}
                </Box>

                <Form onSubmit={this.uploadCaption}>
                  <Heading as="h3">Add</Heading>
                  <FormControl isRequired>
                    <FormControl.Label>Caption or Subtitle File URL</FormControl.Label>
                    <TextInput type="url" name="url" />
                  </FormControl>
                  <FormControl isRequired>
                    <FormControl.Label>Language Name</FormControl.Label>
                    <TextInput
                      type="text"
                      name="name"
                      list="countrycodes"
                      onChange={this.autofillCaptionCode}
                    />
                  </FormControl>
                  <FormControl isRequired>
                    <FormControl.Label>Language Code</FormControl.Label>
                    <TextInput
                      type="text"
                      name="languagecode"
                      value={this.state.captionname}
                      onChange={this.updateLangCode}
                    />
                    <CountryDatalist used={this.state.value.captions}></CountryDatalist>
                  </FormControl>
                  <FormControl>
                    <Checkbox name="closedcaptions"> Closed Captions</Checkbox>
                  </FormControl>
                  <Button variant="secondary" type="submit">
                    Submit
                  </Button>
                </Form>
              </Tabs.Panel>

              <Tabs.Panel id="debug">
                <Box marginTop="spacingS">
                  <Flex justifyContent="space-between" alignItems="center" marginBottom="spacingM">
                    <Flex marginRight="spacingM">
                      <Button id="resync" variant="secondary" onClick={this.resync}>
                        Resync
                      </Button>
                    </Flex>
                    <Flex>
                      <Switch
                        name="swap_signed_playback_id"
                        id="swap_signed_playback_id"
                        isChecked={this.isUsingSigned()}
                        onChange={() => this.swapPlaybackIDs()}>
                        {this.isUsingSigned() ? 'Signed Playback' : 'Signed Playback (off)'}
                      </Switch>
                    </Flex>
                  </Flex>
                </Box>

                {this.state.raw?.data.playback_ids.length > 1 ? (
                  <Note variant="warning">
                    This Asset ID has multiple playback IDs in Mux. Only the first public or signed
                    ID will be used in Contentful.
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
            </Tabs>
          </div>
        );
      }
    }

    return (
      <section>
        <Box marginBottom="spacingM">
          <div className="uploader_area">
            <MuxUploaderDrop
              mux-uploader="muxuploader"
              overlay
              overlayText="Drop Video"
              style={{
                '--overlay-background-color': 'rgb(231, 235, 238)',
              }}>
              <MuxUploader
                id="muxuploader"
                type="bar"
                onSuccess={this.onUploadSuccess}
                endpoint={this.getUploadUrl}
                //onError={this.onUploadError}
                style={
                  {
                    '--uploader-background-color': 'rgb(247, 249, 250)',
                    '--button-border-radius': '4px',
                    '--button-border': '1px solid rgb(207, 217, 224)',
                    '--button-padding': '0.5rem 1rem',
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: '1em',
                    minHeight: '250px',
                  } as React.CSSProperties
                }></MuxUploader>
            </MuxUploaderDrop>
          </div>
        </Box>

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
  } else {
    render(<App sdk={sdk as FieldExtensionSDK} />, document.getElementById('root'));
  }
});

// Enabling hot reload
if (module.hot) {
  module.hot.accept();
}
