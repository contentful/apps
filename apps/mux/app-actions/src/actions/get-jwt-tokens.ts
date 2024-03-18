import { AppActionCallContext } from '@contentful/node-apps-toolkit';
import { AppActionCallResponse, SignedUrlTokens } from '../types';
import { withAsyncAppActionErrorHandling } from '../helpers/error-handling';
import * as jwt from 'jsonwebtoken';
import { AppInstallationProps, FreeFormParameters } from 'contentful-management';

interface AppActionCallParameters {
  playbackId: string;
}

interface AppInstallationParameters {
  muxAccessTokenId?: string;
  muxAccessTokenSecret?: string;
  muxEnableSignedUrls?: boolean;
  muxSigningKeyId?: string;
  muxSigningKeyPrivate?: string;
  muxEnableAudioNormalize?: boolean;
  muxDomain?: string;
}

export const parametersFromAppInstallation = (appInstallation: AppInstallationProps) => {
  const appParameters = appInstallation.parameters;
  assertAppInstallationParameters(appParameters);
  return appParameters;
};

function assertAppInstallationParameters(
  parameters: FreeFormParameters | undefined
): asserts parameters is AppInstallationParameters {
  if (!parameters) throw new Error('No parameters found on appInstallation');
  if (typeof parameters !== 'object') throw new Error('Invalid parameters type');
}

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

export const handler = withAsyncAppActionErrorHandling(
  async (
    parameters: AppActionCallParameters,
    context: AppActionCallContext
  ): Promise<AppActionCallResponse<SignedUrlTokens>> => {
    const {
      cma,
      appActionCallContext: { appInstallationId },
    } = context;
    const { playbackId } = parameters;
    if (typeof playbackId !== 'string') {
      throw new TypeError('missing required playbackId from action parameters');
    }

    const appInstallation = await cma.appInstallation.get({ appDefinitionId: appInstallationId });
    const { muxSigningKeyId, muxSigningKeyPrivate } =
      parametersFromAppInstallation(appInstallation);

    if (typeof muxSigningKeyId !== 'string' || typeof muxSigningKeyPrivate !== 'string') {
      throw new TypeError('missing required mux signing key id or signing key private');
    }

    return {
      ok: true,
      data: {
        playbackToken: sign(playbackId, muxSigningKeyId, muxSigningKeyPrivate, 'v'),
        posterToken: sign(playbackId, muxSigningKeyId, muxSigningKeyPrivate, 't'),
        storyboardToken: sign(playbackId, muxSigningKeyId, muxSigningKeyPrivate, 's'),
      },
    };
  }
);
