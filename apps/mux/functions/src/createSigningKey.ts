import { FunctionEventHandler } from '@contentful/node-apps-toolkit';
import {
  AppActionRequest,
  FunctionEventContext,
  FunctionTypeEnum,
} from '@contentful/node-apps-toolkit/lib/requests/typings';
import { muxFetch } from './helpers/muxClient';

type Parameters = {
  muxAccessTokenId: string;
  muxAccessTokenSecret: string;
};

export const handler: FunctionEventHandler<FunctionTypeEnum.AppActionCall> = async (
  event: AppActionRequest<'Custom', Parameters>,
  _context: FunctionEventContext
) => {
  const { muxAccessTokenId, muxAccessTokenSecret } = event.body;

  const res = await muxFetch(
    { tokenId: muxAccessTokenId, tokenSecret: muxAccessTokenSecret },
    'POST',
    '/video/v1/signing-keys'
  );

  const body = await res.json();

  if (!res.ok) {
    return {
      ok: false,
      error: body.error?.messages?.[0] || 'Unknown error',
      status: res.status,
    };
  }

  return { ok: true, data: body.data };
};
