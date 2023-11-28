import { AppActionCallContext } from '@contentful/node-apps-toolkit';
import { AppActionCallResponse, Channel } from '../types';
import { mockChannels } from '../../test/fixtures/mockChannels';

interface AppActionCallParameters {
  tenantId: string;
}

export const handler = async (
  _payload: AppActionCallParameters,
  _context: AppActionCallContext
): Promise<AppActionCallResponse<Channel[]>> => {
  const channels = mockChannels;

  return {
    ok: true,
    data: channels,
  };
};
