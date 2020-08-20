/* eslint-disable @typescript-eslint/no-explicit-any */
const signingTokens = require('./signingTokens')

const { createSignedThumbnailUrl, createSignedPlaybackUrl } = signingTokens;

test('signedPlaybackUrl', () => {
  const url = createSignedPlaybackUrl('playback-id', 'token-id', 'token-secret')
  expect(url).toMatch(/^https:\/\/stream\.mux\.com\/playback-id\.m3u8\?token=/)
});

test('signedTokenUrl', () => {
  const url = createSignedThumbnailUrl('playback-id', 'token-id', 'token-secret')
  expect(url).toMatch(/^https:\/\/image\.mux\.com\/playback-id\/thumbnail\.jpg\?token=/)
});
