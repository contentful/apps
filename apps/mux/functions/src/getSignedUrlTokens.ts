import { FunctionEventHandler } from '@contentful/node-apps-toolkit';
import {
  AppActionRequest,
  FunctionEventContext,
  FunctionTypeEnum,
} from '@contentful/node-apps-toolkit/lib/requests/typings';
import { Mux } from '@mux/mux-node';

type Parameters = {
  playbackId: string;
};

interface SignReturn {
  playbackToken: string;
  thumbnailToken: string;
  storyboardToken: string;
}

async function sign(
  mux: Mux,
  playbackId: string,
  signingKeyId: string,
  signingKeyPrivate: string
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

  return {
    playbackToken,
    thumbnailToken,
    storyboardToken,
  };
}

export const handler: FunctionEventHandler<FunctionTypeEnum.AppActionCall> = async (
  event: AppActionRequest<'Custom', Parameters>,
  context: FunctionEventContext
) => {
  const { playbackId } = event.body;
  const {
    appInstallationParameters: {
      muxSigningKeyId,
      muxSigningKeyPrivate,
      muxAccessTokenId,
      muxAccessTokenSecret,
    },
  } = context;
  const mux = new Mux({ tokenId: muxAccessTokenId, tokenSecret: muxAccessTokenSecret });

  if (typeof muxSigningKeyId !== 'string' || typeof muxSigningKeyPrivate !== 'string') {
    throw new TypeError('missing required mux signing key id or signing key private');
  }

  const signedTokens = await sign(mux, playbackId, muxSigningKeyId, muxSigningKeyPrivate);
  console.log('Tokens:', signedTokens);

  return {
    ok: true,
    data: {
      playbackToken: signedTokens.playbackToken,
      posterToken: signedTokens.thumbnailToken,
      storyboardToken: signedTokens.storyboardToken,
    },
  };
};
