import * as jwt from 'jsonwebtoken';

const getPrivateKey = (key: string) => Buffer.from(key, 'base64')

export const createSignedPlaybackUrl = (playbackId: string, signingKeyId: string, signingKeyPrivate: string) => {
  const token = jwt.sign({}, getPrivateKey(signingKeyPrivate), {
    algorithm: 'RS256',
    keyid: signingKeyId,
    audience: 'v',
    subject: playbackId,
    noTimestamp: true,
    expiresIn: '12h'
  });
  return `https://stream.mux.com/${playbackId}.m3u8?token=${token}`
}

export const createSignedThumbnailUrl = (playbackId: string, signingKeyId: string, signingKeyPrivate: string) => {
  const token = jwt.sign({}, getPrivateKey(signingKeyPrivate), {
    algorithm: 'RS256',
    keyid: signingKeyId,
    audience: 't',
    subject: playbackId,
    noTimestamp: true,
    expiresIn: '12h'
  });
  return `https://image.mux.com/${playbackId}/thumbnail.jpg?token=${token}`
}
