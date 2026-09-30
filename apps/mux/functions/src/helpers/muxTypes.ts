/**
 * The parts of the Mux Video API this function actually reads.
 *
 * Deliberately partial and permissive — every field is optional, because the function must not
 * crash on an asset shape Mux extends or on one that is still preparing. What the types buy is
 * the other half: `isCaptionTrack` and `buildMuxAssetMirror` used to take `any`, and a silent
 * typo in a track field is exactly how the caption filter drifted out of step with the browser's.
 */

export interface MuxPlaybackId {
  id?: string;
  policy?: 'public' | 'signed' | 'drm';
}

export interface MuxTrack {
  id?: string;
  type?: string;
  /** Only meaningful for `type: 'text'`. Captions are subtitles, not every text track. */
  text_type?: string;
  text_source?: string;
  status?: string;
  name?: string;
  language_code?: string;
  closed_captions?: boolean;
}

export interface MuxStaticRendition {
  id?: string;
  name?: string;
  status?: string;
  resolution?: string;
  ext?: string;
  type?: string;
}

export interface MuxAsset {
  id?: string;
  upload_id?: string;
  status?: string;
  aspect_ratio?: string;
  max_stored_resolution?: string;
  max_stored_frame_rate?: number;
  duration?: number;
  created_at?: string | number;
  is_live?: boolean;
  live_stream_id?: string;
  passthrough?: string;
  meta?: Record<string, unknown>;
  playback_ids?: MuxPlaybackId[];
  tracks?: MuxTrack[];
  static_renditions?: { files?: MuxStaticRendition[] };
  errors?: { messages?: string[] };
}

/** The `meta` patch `updateMuxAsset` sends. Only `title` is written today. */
export interface MuxAssetMetaUpdate {
  title?: string;
}
