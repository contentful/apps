import * as React from 'react';
import { render } from 'react-dom';
import {
  Note,
  Paragraph,
  Spinner,
  Button,
} from '@contentful/forma-36-react-components';
import {
  init,
  locations,
  AppExtensionSDK,
  FieldExtensionSDK,
} from 'contentful-ui-extensions-sdk';
import { createUpload } from '@mux/upchunk';
import '@contentful/forma-36-react-components/dist/styles.css';
import './index.css';

import Config from './config';
import Player from './player';
import DeleteButton from './deleteButton';
import ApiClient from './apiClient';
import {
  createSignedPlaybackUrl,
  createSignedThumbnailUrl,
} from './signingTokens';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface InstallationParams {
  muxAccessTokenId: string;
  muxAccessTokenSecret: string;
  muxEnableSignedUrls: boolean;
  muxSigningKeyId?: string;
  muxsigningKeyPrivate?: string;
}

interface AppProps {
  sdk: FieldExtensionSDK;
}

interface MuxContentfulObject {
  uploadId: string;
  assetId: string;
  playbackId?: string;
  signedPlaybackId?: string;
  ready: boolean;
  ratio: string;
  error: string;
}

interface AppState {
  value?: MuxContentfulObject;
  uploadProgress?: number;
  error: string | false;
  errorShowResetAction: boolean | false;
  isDeleting: boolean | false;
  playbackUrl?: string;
  posterUrl?: string;
}

export class App extends React.Component<AppProps, AppState> {
  apiClient: ApiClient;
  muxBaseReqOptions: {
    mode: 'cors' | 'no-cors';
    headers: Headers;
  };

  constructor(props: AppProps) {
    super(props);

    const { muxAccessTokenId, muxAccessTokenSecret } = this.props.sdk.parameters
      .installation as InstallationParams;
    this.apiClient = new ApiClient(muxAccessTokenId, muxAccessTokenSecret);

    this.muxBaseReqOptions = {
      mode: 'cors',
      headers: this.requestHeaders(muxAccessTokenId, muxAccessTokenSecret),
    };

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

  async componentDidMount() {
    this.props.sdk.window.startAutoResizer();

    // Handler for external field value changes (e.g. when multiple authors are working on the same entry).
    this.detachExternalChangeHandler = this.props.sdk.field.onValueChanged(
      this.onExternalChange
    );

    if (this.state.error) return;

    // Just in case someone left an asset in a bad place, we'll do some additional checks first just to see if
    // we can clean up.
    if (this.state.value) {
      if (this.state.value.error) {
        // eslint-disable-next-line react/no-did-mount-set-state
        this.setAssetError(this.state.value.error);
      }

      if (this.state.value.ready) {
        const res = await this.apiClient.get(
          `/video/v1/assets/${this.state.value.assetId}`
        );
        if (res.status === 400) {
          const json = await res.json();
          if (json.error.messages[0].match(/mismatching environment/)) {
            this.setState({
              error:
                'Error: it looks like your api keys are for the wrong environment',
            });
            return;
          }
          if (json.error.type === 'invalid_parameters') {
            this.setState({
              error: 'Error: it appears that this asset has been deleted',
              errorShowResetAction: true,
            });
            return;
          }
        }
        if (res.status === 401) {
          this.setState({
            error:
              'Error: it looks like your api keys are not configured properly. Check App configuration.',
          });
          return;
        }
        const { data: asset } = await res.json();
        if (this.state.value.playbackId) {
          this.setPublicPlayback(this.state.value.playbackId);
        }
        if (this.state.value.signedPlaybackId) {
          await this.setSignedPlayback(this.state.value.signedPlaybackId);
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
    return (
      this.state.value &&
      !this.state.value.playbackId &&
      this.state.value.signedPlaybackId
    );
  };

  requestHeaders = (tokenId: string, tokenSecret: string) => {
    let headers = new Headers();
    headers.set('Authorization', 'Basic ' + btoa(`${tokenId}:${tokenSecret}`));
    headers.set('Content-Type', 'application/json');

    return headers;
  };

  requestDeleteAsset = async () => {
    if (!this.state.value || !this.state.value.assetId) {
      throw Error(
        'Something went wrong, we cannot delete an asset without an assetId.'
      );
    }

    const result = await this.props.sdk.dialogs.openConfirm({
      title: 'Are you sure you want to delete this asset?',
      message:
        'This will remove the asset in Mux and in Contentful. There is no way to recover your video, make sure you have a backup if you think you may want to use it again.',
      intent: 'negative',
      confirmLabel: 'Yes, delete this asset',
      cancelLabel: 'Cancel',
    });

    if (!result) {
      this.setState({ isDeleting: false });
      return;
    }
    this.setState({ isDeleting: true });

    const res = await this.apiClient.get(
      `/video/v1/assets/${this.state.value.assetId}`
    );

    if (res.status === 401) {
      throw Error(
        'Looks like something is wrong with the Mux Access Token specified in the config. Are you sure the token ID and secret in the extension settings match the access token you created?'
      );
    }

    await this.resetField();
    this.setState({ isDeleting: false });
  };

  resetField = async () => {
    await this.props.sdk.field.setValue({
      uploadId: undefined,
      assetId: undefined,
      playbackId: undefined,
      ready: undefined,
      ratio: undefined,
      error: undefined,
    });
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
          playback_policy: (this.props.sdk.parameters
            .installation as InstallationParams).muxEnableSignedUrls
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
        chunkSize: 5120, // Uploads the file in ~5mb chunks
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
      throw Error(
        'Something went wrong, because by this point we require an upload ID.'
      );
    }

    const res = await this.apiClient.get(
      `/video/v1/uploads/${this.state.value.uploadId}`
    );
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

  setPublicPlayback = (playbackId: string) => {
    this.setState({
      playbackUrl: `https://stream.mux.com/${playbackId}.m3u8`,
      posterUrl: `https://image.mux.com/${playbackId}/thumbnail.jpg`,
    });
  };

  setSignedPlayback = async (signedPlaybackId: string) => {
    const { muxSigningKeyId, muxsigningKeyPrivate } = this.props.sdk.parameters
      .installation as InstallationParams;
    this.setState({
      playbackUrl: createSignedPlaybackUrl(
        signedPlaybackId,
        muxSigningKeyId!,
        muxsigningKeyPrivate!
      ),
      posterUrl: createSignedThumbnailUrl(
        signedPlaybackId,
        muxSigningKeyId!,
        muxsigningKeyPrivate!
      ),
    });
  };

  getAsset = async () => {
    if (!this.state.value || !this.state.value.assetId) {
      throw Error(
        'Something went wrong, we cannot getAsset without an assetId.'
      );
    }

    const res = await this.apiClient.get(
      `/video/v1/assets/${this.state.value.assetId}`
    );
    const { data: asset } = await res.json();

    return asset;
  };

  pollForAssetDetails = async () => {
    if (!this.state.value || !this.state.value.assetId) {
      throw Error(
        'Something went wrong, because by this point we require an assetId.'
      );
    }

    const asset = await this.getAsset();
    let assetError;
    if (asset.status === 'errored') {
      assetError =
        (asset.errors && asset.errors.messages && asset.errors.messages[0]) ||
        'Unknown error';
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

    await this.props.sdk.field.setValue({
      uploadId: this.state.value.uploadId,
      assetId: this.state.value.assetId,
      playbackId: (publicPlayback && publicPlayback.id) || undefined,
      signedPlaybackId: (signedPlayback && signedPlayback.id) || undefined,
      ready: asset.status === 'ready',
      ratio: asset.ratio,
      error: assetError,
    });

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

      if (
        this.state.value.ready &&
        this.state.playbackUrl &&
        this.state.posterUrl
      ) {
        return (
          <div>
            {this.isUsingSigned() && (
              <Paragraph>
                Note: this mux asset is using a signedPlaybackId
              </Paragraph>
            )}
            <Player
              playbackUrl={this.state.playbackUrl}
              posterUrl={this.state.posterUrl}
              ratio={this.state.value.ratio}
              onReady={this.onPlayerReady}
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
          <div
            className="progress"
            style={{ width: `${this.state.uploadProgress}%` }}
          />
        </div>
      );
    }

    return (
      <input type="file" className="cf-file-input" onChange={this.onChange} />
    );
  };
}

init((sdk) => {
  if (sdk.location.is(locations.LOCATION_APP_CONFIG)) {
    render(
      <Config sdk={sdk as AppExtensionSDK} />,
      document.getElementById('root')
    );
  } else {
    render(
      <App sdk={sdk as FieldExtensionSDK} />,
      document.getElementById('root')
    );
  }
});

// Enabling hot reload
if (module.hot) {
  module.hot.accept();
}
