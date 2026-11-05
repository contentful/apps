import { describe, expect, it } from 'vitest';
import { buildPlayerSnippet, muxSource, playerPreset, VIDEOJS_CDN } from './playerSnippet';

describe('buildPlayerSnippet', () => {
  it('plays a public asset from the src attribute alone', () => {
    const snippet = buildPlayerSnippet({
      playbackId: 'pb_1',
      streamType: 'on-demand',
      aspectRatio: '16/9',
    });

    expect(snippet).toContain(`<script type="module" src="${VIDEOJS_CDN}/video.js"></script>`);
    expect(snippet).toContain(`src="${VIDEOJS_CDN}/media/mux-video.js"`);
    expect(snippet).toContain(`src="${VIDEOJS_CDN}/extensions/mux-data.js"`);
    expect(snippet).toContain('<video-skin style="aspect-ratio: 16/9">');
    expect(snippet).toContain(
      '<mux-video src="https://stream.mux.com/pb_1.m3u8" stream-type="on-demand" playsinline crossorigin="anonymous"></mux-video>'
    );
    expect(snippet).toContain('<mux-data></mux-data>');
    expect(snippet).not.toContain('<script type="module">\n');
  });

  it('serves the stream from a custom domain', () => {
    expect(buildPlayerSnippet({ playbackId: 'pb_1', customDomain: 'media.example.com' })).toContain(
      'src="https://stream.media.example.com/pb_1.m3u8"'
    );
    expect(buildPlayerSnippet({ playbackId: 'pb_1', customDomain: 'mux.com' })).toContain(
      'src="https://stream.mux.com/pb_1.m3u8"'
    );
  });

  it('sets every token on the source from a module script, with no src to load first', () => {
    const snippet = buildPlayerSnippet({
      playbackId: 'pb_drm',
      customDomain: 'media.example.com',
      tokens: { playback: 'tv', thumbnail: 'tt', storyboard: 'ts', drm: 'td' },
    });

    expect(snippet).not.toContain('src="https://stream.');
    expect(snippet).toContain("await customElements.whenDefined('mux-video');");
    const source = JSON.parse(
      snippet.slice(
        snippet.indexOf('.source = ') + 10,
        snippet.indexOf(';\n', snippet.indexOf('.source = '))
      )
    );
    expect(source).toEqual({
      playbackId: 'pb_drm',
      customDomain: 'media.example.com',
      playback: { token: 'tv' },
      poster: { token: 'tt' },
      storyboard: { token: 'ts' },
      drm: { token: 'td' },
    });
  });

  it('sends the title to Mux Data, escaped so it cannot close the script', () => {
    const snippet = buildPlayerSnippet({ playbackId: 'pb_1', videoTitle: 'A </script> "title"' });

    expect(snippet).toContain(
      'document.querySelector(\'mux-data\').metadata = {\n    "video_title": "A \\u003c/script> \\"title\\""\n  };'
    );
    expect(snippet.match(/<\/script>/g)).toHaveLength(4);
  });

  it('uses the live preset for every live stream type, and tells the media only that it is live', () => {
    for (const streamType of ['live', 'll-live', 'live:dvr', 'll-live:dvr']) {
      const snippet = buildPlayerSnippet({ playbackId: 'pb_live', streamType });
      expect(snippet).toContain(`src="${VIDEOJS_CDN}/live-video.js"`);
      expect(snippet).toContain('<live-video-player>');
      expect(snippet).toContain('<live-video-skin>');
      expect(snippet).toContain('stream-type="live"');
    }
  });

  it('uses the audio preset and media for an audio-only asset', () => {
    const snippet = buildPlayerSnippet({
      playbackId: 'pb_audio',
      audio: true,
      aspectRatio: '16/9',
    });

    expect(snippet).toContain(`src="${VIDEOJS_CDN}/audio.js"`);
    expect(snippet).toContain(`src="${VIDEOJS_CDN}/media/mux-audio.js"`);
    expect(snippet).toContain('<audio-player>\n  <audio-skin>');
    expect(snippet).toContain('<mux-audio src="https://stream.mux.com/pb_audio.m3u8"');
    expect(snippet).not.toContain('playsinline');
  });

  it('adds autoplay, muted and loop as media attributes', () => {
    expect(
      buildPlayerSnippet({ playbackId: 'pb_1', autoplay: true, muted: true, loop: true })
    ).toContain('crossorigin="anonymous" autoplay muted loop></mux-video>');
  });
});

describe('playerPreset', () => {
  it('picks audio over live', () => {
    expect(playerPreset({ audio: true, streamType: 'live' })).toBe('audio');
    expect(playerPreset({ streamType: 'll-live:dvr' })).toBe('live-video');
    expect(playerPreset({ streamType: 'on-demand' })).toBe('video');
    expect(playerPreset({})).toBe('video');
  });
});

describe('muxSource', () => {
  it('leaves out groups that have no token', () => {
    expect(muxSource({ playbackId: 'pb_1', tokens: { playback: 'tv' } })).toEqual({
      playbackId: 'pb_1',
      playback: { token: 'tv' },
    });
  });
});
