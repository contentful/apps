import React, { useState } from 'react';
import {
  Box,
  Switch,
  Tabs,
  Textarea,
  CopyButton,
  TextLink,
  Flex,
} from '@contentful/f36-components';

interface PlayerCodeProps {
  params: { name: string; value: string | undefined }[];
}

const PlayerCode: React.FC<PlayerCodeProps> = ({ params }) => {
  const [codeType, setCodeType] = useState<'mux-player' | 'iframe'>('mux-player');
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
  const audio = getParam('audio');
  const customDomain = getParam('custom-domain');
  const streamType = getParam('stream-type');

  // Compose attributes for both code types
  const muxPlayerAttrs = [
    `playback-id="${playbackId}"`,
    streamType ? `stream-type="${streamType}"` : '',
    playbackToken ? `playback-token="${playbackToken}"` : '',
    thumbnailToken ? `thumbnail-token="${thumbnailToken}"` : '',
    storyboardToken ? `storyboard-token="${storyboardToken}"` : '',
    audio ? `audio="${audio}"` : '',
    customDomain ? `custom-domain="${customDomain}"` : '',
    autoplay ? 'autoplay' : '',
    mute ? 'muted' : '',
    loop ? 'loop' : '',
    videoTitle ? `metadata-video-title="${videoTitle}"` : '',
  ]
    .filter(Boolean)
    .join(' ');

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

  const muxPlayerCode = `<script src="https://unpkg.com/@mux/mux-player"></script>\n\n<mux-player ${muxPlayerAttrs} style="width:100%" />`;
  const iframeCode = `<iframe ${iframeAttrs} style="aspect-ratio: 16/9; width: 100%; border: 0;"></iframe>`;

  const codeSnippet = codeType === 'mux-player' ? muxPlayerCode : iframeCode;

  return (
    <section>
      <Tabs
        defaultTab="mux-player"
        onTabChange={(id) => setCodeType(id as 'mux-player' | 'iframe')}>
        <Tabs.List>
          <Tabs.Tab panelId="mux-player">Mux Player</Tabs.Tab>
          <Tabs.Tab panelId="iframe">iframe</Tabs.Tab>
        </Tabs.List>
      </Tabs>
      <Box marginTop="spacingM" marginBottom="spacingS">
        <Textarea value={codeSnippet} isReadOnly={true} className="copycodearea" />
      </Box>
      <CopyButton
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
        <TextLink
          href="https://docs.mux.com/guides/video/mux-player"
          target="_blank"
          rel="noopener noreferrer">
          Read more about Mux Player
        </TextLink>
      </p>
    </section>
  );
};

export default PlayerCode;
