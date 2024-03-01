import { SignJWT } from 'jose';

const encode = (value: string) => new TextEncoder().encode(value);

const sign = async (
  playbackId: string,
  signingKeyId: string,
  signingKeyPrivate: string,
  aud: string
) => {
  const alg = 'HS256';
  return await new SignJWT({ sub: playbackId })
    .setProtectedHeader({ alg })
    .setIssuedAt()
    .setAudience(aud)
    .setExpirationTime('12h')
    .sign(encode(signingKeyPrivate));
};

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
