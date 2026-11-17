import React, { useMemo } from 'react';
import '@videojs/react/video/skin.css';
import '@videojs/react/live-video/skin.css';
import '@videojs/react/audio/skin.css';
import { VideoPlayer, VideoSkin } from '@videojs/react/video';
import { LiveVideoPlayer, LiveVideoSkin } from '@videojs/react/live-video';
import { AudioPlayer, AudioSkin } from '@videojs/react/audio';
import { MuxVideo } from '@videojs/react/media/mux-video';
import { MuxAudio } from '@videojs/react/media/mux-audio';
import { MuxData } from '@videojs/react/extensions/mux-data';

import { mediaStreamType, muxSource, playerPreset, type PlayerTokens } from '../util/playerSnippet';

export interface PreviewPlayerProps {
  playbackId: string;
  streamType: string;
  audio?: boolean;
  customDomain?: string;
  tokens?: PlayerTokens;
  aspectRatio?: string;
  metadata: {
    player_name: string;
    page_type: string;
    viewer_user_id?: string;
  };
}

const PreviewPlayer: React.FC<PreviewPlayerProps> = ({
  playbackId,
  streamType,
  audio,
  customDomain,
  tokens,
  aspectRatio,
  metadata,
}) => {
  const { playback, thumbnail, storyboard, drm } = tokens ?? {};
  const source = useMemo(
    () => muxSource({ playbackId, customDomain, tokens: { playback, thumbnail, storyboard, drm } }),
    [playbackId, customDomain, playback, thumbnail, storyboard, drm]
  );
  const { player_name, page_type, viewer_user_id } = metadata;
  const muxMetadata = useMemo(
    () => ({ player_name, page_type, viewer_user_id }),
    [player_name, page_type, viewer_user_id]
  );
  const muxData = <MuxData metadata={muxMetadata} />;
  const preset = playerPreset({ audio, streamType });
  const skinStyle = { width: '100%', aspectRatio };

  if (preset === 'audio') {
    return (
      <AudioPlayer>
        <AudioSkin style={{ width: '100%' }}>
          <MuxAudio
            data-testid="preview-media"
            source={source}
            streamType={mediaStreamType(streamType)}
            crossOrigin="anonymous"
          />
          {muxData}
        </AudioSkin>
      </AudioPlayer>
    );
  }

  const media = (
    <MuxVideo
      data-testid="preview-media"
      source={source}
      streamType={mediaStreamType(streamType)}
      playsInline
      crossOrigin="anonymous"
    />
  );

  if (preset === 'live-video') {
    return (
      <LiveVideoPlayer>
        <LiveVideoSkin style={skinStyle}>
          {media}
          {muxData}
        </LiveVideoSkin>
      </LiveVideoPlayer>
    );
  }

  return (
    <VideoPlayer>
      <VideoSkin style={skinStyle}>
        {media}
        {muxData}
      </VideoSkin>
    </VideoPlayer>
  );
};

export default PreviewPlayer;
