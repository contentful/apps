import { AppActionCallContext } from '@contentful/node-apps-toolkit';
import { AppActionCallResponse, BaseSites } from '../types';
import { withAsyncAppActionErrorHandling } from '../helpers/error-handling';

interface AppActionCallParameters {}

export const handler = withAsyncAppActionErrorHandling(
  async (
    _payload: AppActionCallParameters,
    _context: AppActionCallContext
  ): Promise<AppActionCallResponse<BaseSites>> => {
    return {
      ok: true,
      data: [{ channel: 'B2B', name: 'Fashion Site', uid: 'fashion-spa' }],
    };
  }
);
