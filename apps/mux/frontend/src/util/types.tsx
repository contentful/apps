import { FieldExtensionSDK } from '@contentful/app-sdk';

export interface AppProps {
  sdk: FieldExtensionSDK;
}

export interface InstallationParams {
  muxAccessTokenId: string;
  muxAccessTokenSecret: string;
  muxEnableSignedUrls: boolean;
  muxSigningKeyId?: string;
  muxSigningKeyPrivate?: string;
  muxEnableAudioNormalize: boolean;
  muxDomain?: string;
}

export interface AppState {
  value?: MuxContentfulObject;
  error: string | false;
  errorShowResetAction: boolean | false;
  isDeleting: boolean | false;
  isReloading: boolean | false;
  playbackToken?: string;
  posterToken?: string;
  storyboardToken?: string;
  captionname?: string;
  playerPlaybackId?: string;
  // eslint-disable-next-line  @typescript-eslint/no-explicit-any
  raw?: any;
}

export interface MuxContentfulObject {
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
  created_at: number;
  captions?: Array<Captions>;
  is_live?: boolean;
  live_stream_id?: string;
}

export interface Error {
  type: string;
  messages: Array<string>;
}

export interface Captions {
  type?: string;
  text_type?: string;
  text_source?: string;
  language_code?: string;
  name?: string;
  closed_captions?: boolean;
  status?: string;
  id?: string;
  passthrough?: string;
  errored?: Error;
}

export interface captionListProps {
  captions: Array<Captions>;
  requestDeleteCaption: (e) => void;
  playbackId: string | undefined;
  domain: string;
  token: string | undefined;
}
