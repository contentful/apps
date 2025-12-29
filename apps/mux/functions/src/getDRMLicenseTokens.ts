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

interface DRMLicenseReturn {
  licenseToken: string;
  playbackToken: string;
  thumbnailToken: string;
  storyboardToken: string;
}

async function generateDRMLicenseToken(
  mux: Mux,
  playbackId: string,
  signingKeyId: string,
  signingKeyPrivate: string
): Promise<DRMLicenseReturn> {
  // For DRM, we need to generate multiple tokens:
  // - playback token: authorizes access to the stream
  // - license token: used to authorize DRM license requests
  // - thumbnail token: used to access thumbnail/poster images
  // - storyboard token: used to access storyboard images
  const baseOptions = {
    keyId: signingKeyId,
    keySecret: signingKeyPrivate,
    expiration: '12h',
  };

  // Generate playback token (type 'video') to authorize stream access
  const playbackToken = await mux.jwt.signPlaybackId(playbackId, {
    ...baseOptions,
    type: 'video',
  });

  // Generate DRM license token (type 'drm_license') for DRM license requests
  const licenseToken = await mux.jwt.signPlaybackId(playbackId, {
    ...baseOptions,
    type: 'drm_license',
  });

  // Generate thumbnail token (type 'thumbnail') for poster images
  const thumbnailToken = await mux.jwt.signPlaybackId(playbackId, {
    ...baseOptions,
    type: 'thumbnail',
  });

  // Generate storyboard token (type 'storyboard') for storyboard images
  const storyboardToken = await mux.jwt.signPlaybackId(playbackId, {
    ...baseOptions,
    type: 'storyboard',
  });

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

  const drmTokens = await generateDRMLicenseToken(
    mux,
    playbackId,
    muxSigningKeyId,
    muxSigningKeyPrivate
  );

  return {
    ok: true,
    data: {
      licenseToken: drmTokens.licenseToken,
      playbackToken: drmTokens.playbackToken,
      posterToken: drmTokens.thumbnailToken,
      storyboardToken: drmTokens.storyboardToken,
    },
  };
};


