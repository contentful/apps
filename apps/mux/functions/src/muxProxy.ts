import { FunctionEventHandler } from '@contentful/node-apps-toolkit';
import {
  AppActionRequest,
  FunctionEventContext,
  FunctionTypeEnum,
} from '@contentful/node-apps-toolkit/lib/requests/typings';
import { muxFetch } from './helpers/muxClient';

type Parameters = {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  body?: string;
};

export const handler: FunctionEventHandler<FunctionTypeEnum.AppActionCall> = async (
  event: AppActionRequest<'Custom', Parameters>,
  context: FunctionEventContext
) => {
  const { method, path, body } = event.body;
  const { muxAccessTokenId, muxAccessTokenSecret } = context.appInstallationParameters;

  if (!muxAccessTokenId || !muxAccessTokenSecret) {
    console.error('[muxProxy] Missing Mux credentials in appInstallationParameters');
    return { ok: false, error: 'Missing Mux API credentials', status: 401 };
  }

  let res: Response;
  try {
    res = await muxFetch(
      { tokenId: muxAccessTokenId, tokenSecret: muxAccessTokenSecret },
      method,
      path,
      body
    );
  } catch (err) {
    console.error(`[muxProxy] Network error on ${method} ${path}:`, err);
    return { ok: false, error: 'Network error calling Mux API', status: 502 };
  }

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    const errorMessage = errorBody?.error?.messages?.[0] || 'Unknown error';
    console.error(`[muxProxy] Error ${res.status} on ${method} ${path}: ${errorMessage}`);
    return {
      ok: false,
      error: errorMessage,
      status: res.status,
    };
  }

  if (res.status === 204) {
    return { ok: true, data: {} };
  }

  const responseBody = await res.json();
  return { ok: true, data: responseBody };
};
