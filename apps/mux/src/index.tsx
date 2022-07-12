import * as React from 'react';
import { render } from 'react-dom';
import { Note, Paragraph, Spinner, Button, TextLink } from '@contentful/forma-36-react-components';
import { init, locations, AppExtensionSDK, FieldExtensionSDK } from '@contentful/app-sdk';
import { createUpload } from '@mux/upchunk';
import MuxPlayer from '@mux/mux-player-react';
import '@contentful/forma-36-react-components/dist/styles.css';
import './index.css';

import Config from './config';
import DeleteButton from './deleteButton';
import ApiClient from './apiClient';
import {
  createSignedPlaybackToken,
  createSignedThumbnailToken,
  createSignedStoryboardToken,
} from './signingTokens';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface InstallationParams {
  muxAccessTokenId: string;
  muxAccessTokenSecret: string;
  muxEnableSignedUrls: boolean;
  muxSigningKeyId?: string;
  muxSigningKeyPrivate?: string;
  muxDomain?: string;
}

interface AppProps {
  sdk: FieldExtensionSDK;
}

interface MuxContentfulObject {
  version: number;
  uploadId: string;
  assetId: string;
  playbackId?: string;
  signedPlaybackId?: string;
  ready: boolean;
  ratio: string;
  error: string;
  max_stored_resolution: string;
  max_stored_frame_rate: number;
  audioOnly: boolean;
  duration: number;
}

interface AppState {
  value?: MuxContentfulObject;
  uploadProgress?: number;
  error: string | false;
  errorShowResetAction: boolean | false;
  isDeleting: boolean | false;
  playbackToken?: string;
  posterToken?: string;
  storyboardToken?: string;
}

export class App extends React.Component<AppProps, AppState> {
  apiClient: ApiClient;

  constructor(props: AppProps) {
    super(props);

    const { muxAccessTokenId, muxAccessTokenSecret } = this.props.sdk.parameters
      .installation as InstallationParams;
    this.apiClient = new ApiClient(muxAccessTokenId, muxAccessTokenSecret);

    this.state = {
      value: props.sdk.field.getValue(),
      isDeleting: false,
      error:
        (!muxAccessTokenId || !muxAccessTokenSecret) &&
        "It doesn't look like you've specified your Mux Access Token ID or Secret in the extension configuration.",
      errorShowResetAction: false,
    };
  }

  detachExternalChangeHandler: Function | null = null;

  checkForValidAsset = async () => {
    if (!(this.state.value && this.state.value.assetId)) return false;
    const res = await this.apiClient.get(`/video/v1/assets/${this.state.value.assetId}`);
    if (res.status === 400) {
      const json = await res.json();
      if (json.error.messages[0].match(/mismatching environment/)) {
        this.setState({
          error: 'Error: it looks like your api keys are for the wrong environment',
        });
        return false;
      }
      if (json.error.type === 'invalid_parameters') {
        this.setState({
          error: 'Error: it appears that this asset has been deleted',
          errorShowResetAction: true,
        });
        return false;
      }
    }
    if (res.status === 401) {
      this.setState({
        error:
          'Error: it looks like your api keys are not configured properly. Check App configuration.',
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
        // eslint-disable-next-line react/no-did-mount-set-state
        this.setAssetError(this.state.value.error);
        return;
      }

      if (this.state.value.ready) {
        await this.checkForValidAsset();
        if (this.state.value.signedPlaybackId) {
          this.setSignedPlayback(this.state.value.signedPlaybackId);
        }
        return;
      }

      if (this.state.value.uploadId && !this.state.value.ready) {
        await this.pollForUploadDetails();
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

  isUsingSigned = () => {
    return this.state.value && !this.state.value.playbackId && this.state.value.signedPlaybackId;
  };

  requestDeleteAsset = async () => {
    if (!this.state.value || !this.state.value.assetId) {
      throw Error('Something went wrong, we cannot delete an asset without an assetId.');
    }

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

    const res = await this.apiClient.get(`/video/v1/assets/${this.state.value.assetId}`);

    if (res.status === 401) {
      throw Error(
        'Looks like something is wrong with the Mux Access Token specified in the config. Are you sure the token ID and secret in the extension settings match the access token you created?'
      );
    }

    await this.resetField();
    this.setState({ isDeleting: false });
  };

  resetField = async () => {
    await this.props.sdk.field.setValue(undefined);
    this.setState({ error: false, errorShowResetAction: false });
  };

  getUploadUrl = async () => {
    const passthroughId = (this.props.sdk.entry.getSys() as { id: string }).id;

    const res = await this.apiClient.post(
      '/video/v1/uploads',
      JSON.stringify({
        cors_origin: window.location.origin,
        new_asset_settings: {
          passthrough: passthroughId,
          playback_policy: (this.props.sdk.parameters.installation as InstallationParams)
            .muxEnableSignedUrls
            ? 'signed'
            : 'public',
        },
      })
    );

    if (res.status === 401) {
      throw Error(
        'Looks like something is wrong with the Mux Access Token specified in the config. Are you sure the token ID and secret in the extension settings match the access token you created?'
      );
    }

    const { data: muxUpload } = await res.json();

    await this.props.sdk.field.setValue({
      uploadId: muxUpload.id,
    });

    return muxUpload.url;
  };

  getChunkSize = () => {
    const chunkSize = 1024 * 100; // 100mb chunks default.
    const connection = navigator.connection;
    if (!connection) return chunkSize;
    if (
      ('effectiveType' in connection && connection.effectiveType === '4g') ||
      ('rtt' in connection && connection.rtt < 100)
    ) {
      return 1024 * 500; // 500mb.
    }
  };

  onChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files && e.currentTarget.files[0];
    this.setState({ uploadProgress: 1 });

    if (!file) {
      throw Error("Looks like a file wasn't selected");
    }

    try {
      const endpoint = await this.getUploadUrl();

      const upload = createUpload({
        file,
        endpoint,
        chunkSize: this.getChunkSize(),
      });

      upload.on('error', this.onUploadError);
      upload.on('progress', this.onUploadProgress);
      upload.on('success', this.onUploadSuccess);
    } catch (error) {
      this.setState({ error: error.message });
    }
  };

  onUploadError = (progress: CustomEvent) => {
    this.setState({ error: progress.detail });
  };

  onUploadProgress = (progress: CustomEvent) => {
    this.setState({ uploadProgress: progress.detail });
  };

  onUploadSuccess = async () => {
    this.setState({ uploadProgress: 100 });
    await this.pollForUploadDetails();
  };

  setAssetError = (errorMessage: string) => {
    this.setState({
      error: `Error with this video file ${errorMessage}`,
      errorShowResetAction: true,
    });
  };

  pollForUploadDetails = async () => {
    if (!this.state.value || !this.state.value.uploadId) {
      throw Error('Something went wrong, because by this point we require an upload ID.');
    }

    const res = await this.apiClient.get(`/video/v1/uploads/${this.state.value.uploadId}`);
    const { data: muxUpload } = await res.json();

    if (muxUpload && muxUpload['asset_id']) {
      await this.props.sdk.field.setValue({
        uploadId: muxUpload.id,
        assetId: muxUpload['asset_id'],
      });
      this.setState({ uploadProgress: undefined });
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

  getAsset = async () => {
    if (!this.state.value || !this.state.value.assetId) {
      throw Error('Something went wrong, we cannot getAsset without an assetId.');
    }

    const res = await this.apiClient.get(`/video/v1/assets/${this.state.value.assetId}`);
    const { data: asset } = await res.json();

    return asset;
  };

  pollForAssetDetails = async () => {
    if (!this.state.value || !this.state.value.assetId) {
      throw Error('Something went wrong, because by this point we require an assetId.');
    }

    const asset = await this.getAsset();
    let assetError;
    if (asset.status === 'errored') {
      assetError =
        (asset.errors && asset.errors.messages && asset.errors.messages[0]) || 'Unknown error';
    }

    if (!asset) {
      throw Error('Something went wrong, we were not able to get the asset.');
    }

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

    await this.props.sdk.field.setValue({
      version: 2,
      uploadId: this.state.value.uploadId,
      assetId: this.state.value.assetId,
      playbackId: (publicPlayback && publicPlayback.id) || undefined,
      signedPlaybackId: (signedPlayback && signedPlayback.id) || undefined,
      ready: asset.status === 'ready',
      ratio: asset.aspect_ratio,
      max_stored_resolution: asset.max_stored_resolution,
      max_stored_frame_rate: asset.max_stored_frame_rate,
      duration: asset.duration,
      audioOnly: audioOnly,
      error: assetError,
    });

    if (signedPlayback) {
      this.setSignedPlayback(signedPlayback.id);
    }

    if (assetError) {
      this.setAssetError(assetError);
    }

    if (asset.status === 'preparing') {
      await delay(500);
      await this.pollForAssetDetails();
    }
  };

  onPlayerReady = () => this.props.sdk.window.updateHeight();

  render = () => {
    if (this.state.error) {
      return (
        <Note noteType="negative">
          <span>{this.state.error}</span>
          <span>
            {this.state.errorShowResetAction ? (
              <Button
                buttonType="negative"
                size="small"
                onClick={this.resetField}
                className="reset-field-button"
              >
                Reset this field
              </Button>
            ) : null}
          </span>
        </Note>
      );
    }

    if (this.state.isDeleting) {
      return (
        <Paragraph>
          <Spinner size="small" /> Deleting this asset.
        </Paragraph>
      );
    }

    if (this.state.value) {
      if (this.state.value.assetId && !this.state.value.ready) {
        return (
          <Paragraph>
            <Spinner size="small" /> Waiting for asset to be playable!
          </Paragraph>
        );
      }

      const { muxDomain } = this.props.sdk.parameters.installation as InstallationParams;

      if (this.state.value.ready && (this.state.value.playbackId || this.state.playbackToken)) {
        return (
          <div>
            {this.isUsingSigned() && (
              <Note>
                Note: this mux asset is using a{' '}
                <TextLink
                  href="https://docs.mux.com/docs/headless-cms-contentful#advanced-signed-urls"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  signedPlaybackId
                </TextLink>
              </Note>
            )}
            <MuxPlayer
              style={{ height: '100%', width: '100%' }}
              playbackId={this.state.value.playbackId || this.state.value.signedPlaybackId}
              streamType="on-demand"
              poster={this.state.value.audioOnly ? '#' : undefined}
              customDomain={muxDomain || undefined}
              audio={this.state.value.audioOnly}
              metadata={{
                player_name: 'Contentful Admin Dashboard',
                viewer_user_id: 'user' in this.props.sdk ? this.props.sdk.user.sys.id : undefined,
                page_type: 'Preview Player',
              }}
              tokens={{
                playback: this.isUsingSigned() ? this.state.playbackToken : undefined,
                thumbnail: this.isUsingSigned() ? this.state.posterToken : undefined,
                storyboard: this.isUsingSigned() ? this.state.storyboardToken : undefined,
              }}
            />
            {this.state.value.assetId ? (
              <DeleteButton requestDeleteAsset={this.requestDeleteAsset} />
            ) : null}
          </div>
        );
      }
    }

    if (this.state.uploadProgress) {
      return (
        <div>
          <Paragraph>
            <Spinner size="small" />{' '}
            {this.state.uploadProgress < 100
              ? 'Uploading file to Mux...'
              : 'Upload complete! Waiting for created asset details...'}
          </Paragraph>
          <div className="progress" style={{ width: `${this.state.uploadProgress}%` }} />
        </div>
      );
    }

    return <input type="file" className="cf-file-input" onChange={this.onChange} />;
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
