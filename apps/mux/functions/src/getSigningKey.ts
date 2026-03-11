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
  signingKeyId: string;
};

export const handler: FunctionEventHandler<FunctionTypeEnum.AppActionCall> = async (
  event: AppActionRequest<'Custom', Parameters>,
  _context: FunctionEventContext
) => {
  const { muxAccessTokenId, muxAccessTokenSecret, signingKeyId } = event.body;

  const res = await muxFetch(
    { tokenId: muxAccessTokenId, tokenSecret: muxAccessTokenSecret },
    'GET',
    `/video/v1/signing-keys/${signingKeyId}`
  );

  if (!res.ok) {
    return { ok: true, data: { exists: false } };
  }

  return { ok: true, data: { exists: true } };
};
