import { FieldExtensionSDK } from '@contentful/app-sdk';
import { ModalData } from '../components/AssetConfiguration/MuxAssetConfigurationModal';
import ApiClient from './apiClient';

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
  muxEnableDRM?: boolean;
  muxDRMConfigurationId?: string;
}

export interface AppState {
  value?: MuxContentfulObject;
  error: string | false;
  errorShowResetAction: boolean | false;
  isDeleting: boolean | false;
  isTokenLoading: boolean | false;
  playbackToken?: string;
  posterToken?: string;
  storyboardToken?: string;
  drmLicenseToken?: string;
  captionname?: string;
  audioName?: string;
  playerPlaybackId?: string;
  // eslint-disable-next-line  @typescript-eslint/no-explicit-any
  raw?: any;
  modalAssetConfigurationVisible: boolean;
  file: File | null;
  showMuxUploaderUI: boolean;
  pendingUploadURL: string | null;
  isPolling: boolean;
  initialResyncDone: boolean;
}

export type ResolutionType = 'highest' | 'audio-only';

export type PolicyType = 'signed' | 'public' | 'drm';

export interface PendingAction {
  type: 'playback' | 'asset' | 'caption' | 'staticRendition' | 'audio' | 'metadata';
  id?: string;
  data?: {
    policy?: PolicyType;
    assetId?: string;
    title?: string;
  };
  retry: number;
}

export interface PendingActions {
  delete: PendingAction[];
  create: PendingAction[];
  update: PendingAction[];
}

export interface MuxContentfulObject {
  version: number;
  uploadId?: string;
  assetId: string;
  playbackId?: string;
  signedPlaybackId?: string;
  drmPlaybackId?: string;
  ready: boolean;
  ratio?: string;
  error?: string;
  max_stored_resolution?: string;
  max_stored_frame_rate?: number;
  audioOnly?: boolean;
  duration?: number;
  created_at?: number;
  captions?: Array<Track>;
  audioTracks?: Array<Track>;
  is_live?: boolean;
  live_stream_id?: string;
  static_renditions?: Array<StaticRendition>;
  meta?: {
    title?: string;
    creator_id?: string;
    external_id?: string;
  };
  passthrough?: string;
  pendingActions?: PendingActions;
}

export interface Error {
  type: string;
  messages: Array<string>;
}

export interface Captions {
  type: string;
  'text_type ': string;
  language_code: string;
  name: string;
  closed_captions: boolean;
  status?: string;
  id: string;
  passthrough?: string;
  errored?: Error;
}

export interface StaticRendition {
  width?: number;
  type: string;
  status: 'ready' | 'preparing' | 'error' | 'skipped';
  resolution_tier?: string;
  resolution: ResolutionType;
  name: string;
  id: string;
  height?: number;
  filesize?: string;
  ext: string;
  bitrate?: number;
  url?: string;
}

export interface captionListProps {
  captions: Array<Captions>;
  requestDeleteCaption: (e) => void;
  playbackId: string | undefined;
  domain: string;
  token: string | undefined;
}

export interface BaseTrack {
  type: string;
  id: string;
  status?: string;
  passthrough?: string;
  name?: string;
  language_code?: string;
}

export interface AudioTrack extends BaseTrack {
  type: 'audio';
  primary?: boolean;
  max_channels?: number;
  max_channel_layout?: string;
  duration?: number;
}

export interface CaptionTrack extends BaseTrack {
  type: 'text';
  text_type: string;
  name: string;
  language_code: string;
  closed_captions: boolean;
  text_source?: string;
  errored?: Error;
}

export type Track = AudioTrack | CaptionTrack;

export interface AddByURLConfig {
  apiClient: ApiClient;
  sdk: FieldExtensionSDK;
  remoteURL: string;
  options: ModalData;
  responseCheck: (res: Response) => boolean | Promise<boolean>;
  setAssetError: (msg: string) => void;
  pollForAssetDetails: () => Promise<void>;
}

export interface RenditionInfo {
  status: 'ready' | 'inProgress' | 'none' | 'skipped';
  url?: string;
  id?: string;
}

export interface RenditionActionsProps {
  onCreateRendition: (type: ResolutionType) => void;
  onDeleteRendition: (id: string) => void;
  onUndoDeleteRendition: (id: string) => void;
  isRenditionPendingDelete: (id: string) => boolean;
}

export interface ResyncParams {
  silent?: boolean;
  skipPlayerResync?: boolean;
}
