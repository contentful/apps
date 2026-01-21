import { FunctionEventHandler } from '@contentful/node-apps-toolkit';
import {
  AppActionRequest,
  FunctionEventContext,
  FunctionTypeEnum,
} from '@contentful/node-apps-toolkit/lib/requests/typings';
import { Mux } from '@mux/mux-node';

type Parameters = {
  playbackId: string;
  isDRM?: boolean;
};

interface SignReturn {
  licenseToken?: string;
  playbackToken: string;
  thumbnailToken: string;
  storyboardToken: string;  
}

async function sign(
  mux: Mux,
  playbackId: string,
  signingKeyId: string,
  signingKeyPrivate: string,
  isDRM: boolean
): Promise<SignReturn> {
  const baseOptions = {
    keyId: signingKeyId,
    keySecret: signingKeyPrivate,
    expiration: '12h',
  };

  const playbackToken = await mux.jwt.signPlaybackId(playbackId, { ...baseOptions, type: 'video' });
  const thumbnailToken = await mux.jwt.signPlaybackId(playbackId, {
    ...baseOptions,
    type: 'thumbnail',
  });
  const storyboardToken = await mux.jwt.signPlaybackId(playbackId, {
    ...baseOptions,
    type: 'storyboard',
  });
  const licenseToken = (isDRM) ? await mux.jwt.signPlaybackId(playbackId, {
    ...baseOptions,
    type: 'drm_license',
  }) : undefined;

  return {
    licenseToken,
    playbackToken,
    thumbnailToken,
    storyboardToken,
  };
}

export const handler: FunctionEventHandler<FunctionTypeEnum.AppActionCall> = async (
  event: AppActionRequest<'Custom', Parameters>,
  context: FunctionEventContext
) => {
  const { playbackId, isDRM = false } = event.body;
  const {
    appInstallationParameters: {
      muxSigningKeyId,
      muxSigningKeyPrivate,
      muxAccessTokenId,
      muxAccessTokenSecret,
    },
  } = context;
  if (typeof muxSigningKeyId !== 'string' || typeof muxSigningKeyPrivate !== 'string') {
    console.error('muxSigningKeyId and muxSigningKeyPrivate are not set');
    return {
      ok: false,
      error: 'You must enable the "Signed URLs" in the app settings to play this video',
    }
  }
  const mux = new Mux({ tokenId: muxAccessTokenId, tokenSecret: muxAccessTokenSecret, jwtSigningKey: muxSigningKeyId, jwtPrivateKey: muxSigningKeyPrivate });

  const signedTokens = await sign(mux, playbackId, muxSigningKeyId, muxSigningKeyPrivate, isDRM);

  return {
    ok: true,
    data: {
      licenseToken: signedTokens.licenseToken,
      playbackToken: signedTokens.playbackToken,
      posterToken: signedTokens.thumbnailToken,
      storyboardToken: signedTokens.storyboardToken,
    },
  };
};
