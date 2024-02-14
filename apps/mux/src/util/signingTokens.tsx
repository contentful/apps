import { SignJWT, importPKCS8, importSPKI } from 'jose';

const getPrivateKey = async (key: string, alg: string) => {
  const pkcs8 = `-----BEGIN PRIVATE KEY-----${key}-----END PRIVATE KEY-----`;
  try {
    const algorithm = 'ES256';
    const ecPrivateKey = await importPKCS8(pkcs8, algorithm);

    console.log(ecPrivateKey);
    return ecPrivateKey;
    // return await importSPKI(pkcs8, alg);
    // return await importPKCS8(testKey, alg);
  } catch (e) {
    console.error('Error importing private key', JSON.stringify(e));
  }
};

const sign = async (
  playbackId: string,
  signingKeyId: string,
  signingKeyPrivate: string,
  aud: string
) => {
  try {
    const alg = 'RS256';
    // console.log('creating private key...');
    const privateKey = await getPrivateKey(signingKeyPrivate, alg);
    // console.log('privateKey', privateKey);
    if (!privateKey) {
      throw new Error('');
    }

    return new SignJWT()
      .setProtectedHeader({ alg, kid: signingKeyId })
      .setIssuedAt()
      .setAudience(aud)
      .setSubject(playbackId)
      .setExpirationTime('12h')
      .sign(privateKey);
  } catch (e) {
    console.error('Error creating signing token', e);
  }
};

export const createSignedPlaybackToken = (
  playbackId: string,
  signingKeyId: string,
  signingKeyPrivate: string
) => {
  console.log('creating signed playback');
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
