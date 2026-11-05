export type PlayerStreamType = 'on-demand' | 'live' | 'll-live' | 'live:dvr' | 'll-live:dvr';

export type PlayerPreset = 'video' | 'live-video' | 'audio';

export interface PlayerTokens {
  playback?: string;
  thumbnail?: string;
  storyboard?: string;
  drm?: string;
}

export interface PlayerSnippetOptions {
  playbackId: string;
  streamType?: string;
  customDomain?: string;
  audio?: boolean;
  aspectRatio?: string;
  tokens?: PlayerTokens;
  videoTitle?: string;
  autoplay?: boolean;
  muted?: boolean;
  loop?: boolean;
}

export const VIDEOJS_CDN = 'https://cdn.jsdelivr.net/npm/@videojs/cdn@10.3.0';

export const VIDEOJS_MUX_DOCS_URL =
  'https://videojs.org/docs/framework/html/guides/migrate-from-mux-player';

export function isLiveStreamType(streamType?: string): boolean {
  return !!streamType && streamType !== 'on-demand';
}

export function isDvrStreamType(streamType?: string): boolean {
  return !!streamType && streamType.endsWith(':dvr');
}

export function playerPreset({
  audio,
  streamType,
}: {
  audio?: boolean;
  streamType?: string;
}): PlayerPreset {
  if (audio) return 'audio';
  return isLiveStreamType(streamType) ? 'live-video' : 'video';
}

/** `<mux-video>` and `<mux-audio>` know only on-demand and live; LL-HLS and DVR come from the manifest. */
export function mediaStreamType(streamType?: string): 'on-demand' | 'live' {
  return isLiveStreamType(streamType) ? 'live' : 'on-demand';
}

export function customStreamDomain(customDomain?: string): string | undefined {
  return customDomain && customDomain !== 'mux.com' ? customDomain : undefined;
}

export function muxSource({
  playbackId,
  customDomain,
  tokens,
}: Pick<PlayerSnippetOptions, 'playbackId' | 'customDomain' | 'tokens'>) {
  const domain = customStreamDomain(customDomain);
  return {
    playbackId,
    ...(domain && { customDomain: domain }),
    ...(tokens?.playback && { playback: { token: tokens.playback } }),
    ...(tokens?.thumbnail && { poster: { token: tokens.thumbnail } }),
    ...(tokens?.storyboard && { storyboard: { token: tokens.storyboard } }),
    ...(tokens?.drm && { drm: { token: tokens.drm } }),
  };
}

function escapeAttribute(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** JSON inside an inline `<script>`: a literal `</script>` in a title would end the element early. */
function scriptJson(value: unknown): string {
  return JSON.stringify(value, null, 2).replace(/</g, '\\u003c').replace(/\n/g, '\n  ');
}

const PRESET_ELEMENTS: Record<PlayerPreset, { script: string; player: string; skin: string }> = {
  video: { script: 'video.js', player: 'video-player', skin: 'video-skin' },
  'live-video': { script: 'live-video.js', player: 'live-video-player', skin: 'live-video-skin' },
  audio: { script: 'audio.js', player: 'audio-player', skin: 'audio-skin' },
};

/**
 * The HTML a customer pastes to play this asset with Video.js from the CDN. Values that cannot be
 * attributes (image and DRM tokens, Mux Data metadata) are set by an inline module script.
 */
export function buildPlayerSnippet(options: PlayerSnippetOptions): string {
  const { playbackId, streamType, audio, aspectRatio, tokens, videoTitle } = options;
  const preset = playerPreset({ audio, streamType });
  const { script, player, skin } = PRESET_ELEMENTS[preset];
  const media = audio ? 'mux-audio' : 'mux-video';
  const hasTokens = !!tokens && Object.values(tokens).some(Boolean);
  const domain = customStreamDomain(options.customDomain);

  const mediaAttributes = [
    !hasTokens && `src="https://stream.${domain ?? 'mux.com'}/${escapeAttribute(playbackId)}.m3u8"`,
    `stream-type="${mediaStreamType(streamType)}"`,
    !audio && 'playsinline',
    'crossorigin="anonymous"',
    options.autoplay && 'autoplay',
    options.muted && 'muted',
    options.loop && 'loop',
  ].filter(Boolean);

  const skinStyle =
    !audio && aspectRatio ? ` style="aspect-ratio: ${escapeAttribute(aspectRatio)}"` : '';

  const setup = [
    hasTokens &&
      `await customElements.whenDefined('${media}');\n  document.querySelector('${media}').source = ${scriptJson(
        muxSource(options)
      )};`,
    videoTitle &&
      `document.querySelector('mux-data').metadata = ${scriptJson({ video_title: videoTitle })};`,
  ].filter(Boolean);

  return [
    `<script type="module" src="${VIDEOJS_CDN}/${script}"></script>`,
    `<script type="module" src="${VIDEOJS_CDN}/media/${media}.js"></script>`,
    `<script type="module" src="${VIDEOJS_CDN}/extensions/mux-data.js"></script>`,
    '',
    `<${player}>`,
    `  <${skin}${skinStyle}>`,
    `    <${media} ${mediaAttributes.join(' ')}></${media}>`,
    '    <mux-data></mux-data>',
    `  </${skin}>`,
    `</${player}>`,
    ...(setup.length ? ['', '<script type="module">', `  ${setup.join('\n  ')}`, '</script>'] : []),
  ].join('\n');
}
