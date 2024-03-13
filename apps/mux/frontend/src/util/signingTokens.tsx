import * as jwt from 'jsonwebtoken';

const getPrivateKey = (key: string) => Buffer.from(key, 'base64');

const sign = (playbackId: string, signingKeyId: string, signingKeyPrivate: string, aud: string) =>
  jwt.sign({}, getPrivateKey(signingKeyPrivate), {
    algorithm: 'RS256',
    keyid: signingKeyId,
    audience: aud,
    subject: playbackId,
    noTimestamp: true,
    expiresIn: '12h',
  });
export const createSignedPlaybackToken = (
  playbackId: string,
  signingKeyId: string,
  signingKeyPrivate: string
) => {
  return sign(playbackId, signingKeyId, signingKeyPrivate, 'v');
};

export const createSignedThumbnailToken = (
  playbackId: string,
  signingKeyId: string,
  signingKeyPrivate: string
) => {
  return sign(playbackId, signingKeyId, signingKeyPrivate, 't');
};
export const createSignedStoryboardToken = (
  playbackId: string,
  signingKeyId: string,
  signingKeyPrivate: string
) => {
  return sign(playbackId, signingKeyId, signingKeyPrivate, 's');
};
