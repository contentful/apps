import { FunctionEventHandler } from '@contentful/node-apps-toolkit';
import {
  AppActionRequest,
  FunctionEventContext,
  FunctionTypeEnum,
} from '@contentful/node-apps-toolkit/lib/requests/typings';
import { muxFetch } from './helpers/muxClient';

type Parameters = {
  assetId: string;
};

export const handler: FunctionEventHandler<FunctionTypeEnum.AppActionCall> = async (
  event: AppActionRequest<'Custom', Parameters>,
  context: FunctionEventContext
) => {
  const { assetId } = event.body;
  const { muxAccessTokenId, muxAccessTokenSecret } = context.appInstallationParameters;

  const res = await muxFetch(
    { tokenId: muxAccessTokenId, tokenSecret: muxAccessTokenSecret },
    'GET',
    `/video/v1/assets/${assetId}`
  );

  const body = await res.json();

  if (!res.ok) {
    return {
      ok: false,
      error: body.error?.messages?.[0] || 'Unknown error',
      status: res.status,
    };
  }

  return { ok: true, data: body };
};
