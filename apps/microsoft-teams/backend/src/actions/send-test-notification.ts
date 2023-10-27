import { AppActionCallContext } from '@contentful/node-apps-toolkit';
import { AppActionCallResponse } from '../types';

interface AppActionCallParameters {}

export const handler = async (
  _payload: AppActionCallParameters,
  _context: AppActionCallContext
): Promise<AppActionCallResponse<null>> => {
  return {
    ok: true,
    data: null,
  };
};
