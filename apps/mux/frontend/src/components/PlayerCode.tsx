import React, { useState } from 'react';
import { Box, Switch, Tabs, TextLink, Flex, Note } from '@contentful/f36-components';
import CodeBlock from './CodeBlock';
import { buildPlayerSnippet, isDvrStreamType, VIDEOJS_MUX_DOCS_URL } from '../util/playerSnippet';

interface PlayerCodeProps {
  params: { name: string; value: string | undefined }[];
}

const PlayerCode: React.FC<PlayerCodeProps> = ({ params }) => {
  const [codeType, setCodeType] = useState<'videojs' | 'iframe'>('videojs');
  const [autoplay, setAutoplay] = useState(false);
  const [mute, setMute] = useState(false);
  const [loop, setLoop] = useState(false);

  // Helper to get param by name
  const getParam = (name: string) => params.find((p) => p.name === name)?.value;

  const playbackId = getParam('playback-id') || '';
  const videoTitle = getParam('video-title') || '';
  const playbackToken = getParam('playback-token');
  const thumbnailToken = getParam('thumbnail-token');
  const storyboardToken = getParam('storyboard-token');
  const drmToken = getParam('drm-token');
  const audio = getParam('audio');
  const customDomain = getParam('custom-domain');
  const streamType = getParam('stream-type');
  const aspectRatio = getParam('aspect-ratio');

  const videojsCode = buildPlayerSnippet({
    playbackId,
    streamType,
    customDomain,
    audio: audio === 'true',
    aspectRatio,
    tokens: {
      playback: playbackToken,
      thumbnail: thumbnailToken,
      storyboard: storyboardToken,
      drm: drmToken,
    },
    videoTitle,
    autoplay,
    muted: mute,
    loop,
  });

  let iframeSrcBase =
    customDomain && customDomain !== 'mux.com'
      ? `https://${customDomain}/${playbackId}`
      : `https://player.mux.com/${playbackId}`;
  if (streamType) {
    iframeSrcBase += `?stream_type=${streamType}`;
  }
  const iframeQueryParams: string[] = [];
  if (autoplay) {
    iframeQueryParams.push('autoplay=true');
  }
  if (mute) {
    iframeQueryParams.push('muted=true');
  }
  if (loop) {
    iframeQueryParams.push('loop=true');
  }
  if (playbackToken) {
    iframeQueryParams.push(`token=${playbackToken}`);
  }
  const iframeSrc = iframeQueryParams.length
    ? `${iframeSrcBase}${iframeSrcBase.includes('?') ? '&' : '?'}${iframeQueryParams.join('&')}`
    : iframeSrcBase;

  const iframeAttrs = [
    `src="${iframeSrc}"`,
    'allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"',
    'allowfullscreen="true"',
  ]
    .filter(Boolean)
    .join(' ');

  const iframeCode = `<iframe ${iframeAttrs} style="aspect-ratio: 16/9; width: 100%; border: 0;"></iframe>`;

  const codeSnippet = codeType === 'videojs' ? videojsCode : iframeCode;

  return (
    <section>
      <Tabs defaultTab="videojs" onTabChange={(id) => setCodeType(id as 'videojs' | 'iframe')}>
        <Tabs.List>
          <Tabs.Tab panelId="videojs">Video.js</Tabs.Tab>
          <Tabs.Tab panelId="iframe">iframe</Tabs.Tab>
        </Tabs.List>
      </Tabs>
      {codeType === 'videojs' && isDvrStreamType(streamType) && (
        <Box marginTop="spacingS">
          <Note variant="neutral">
            The Video.js live skin has no DVR time slider yet, so viewers can return to the live
            edge but cannot scrub back.{' '}
            <TextLink
              href="https://github.com/videojs/video.js/issues/9621"
              target="_blank"
              rel="noopener noreferrer">
              Track DVR support
            </TextLink>
          </Note>
        </Box>
      )}
      <CodeBlock
        value={codeSnippet}
        tooltipCopiedText="Snippet Copied"
        tooltipText="Copy Player Snippet"
      />
      <Box marginTop="spacingM" marginBottom="spacingM">
        <Flex flexDirection="column" gap="spacingS">
          <Switch isChecked={autoplay} onChange={() => setAutoplay((v) => !v)}>
            Autoplay
          </Switch>
          <Switch isChecked={mute} onChange={() => setMute((v) => !v)}>
            Mute
          </Switch>
          <Switch isChecked={loop} onChange={() => setLoop((v) => !v)}>
            Looping content
          </Switch>
        </Flex>
      </Box>
      <p>
        <TextLink href={VIDEOJS_MUX_DOCS_URL} target="_blank" rel="noopener noreferrer">
          Read more about Video.js with Mux
        </TextLink>
      </p>
    </section>
  );
};

export default PlayerCode;
