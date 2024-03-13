import { AppActionCallContext } from '@contentful/node-apps-toolkit';
import { AppActionCallResponse, PreviewEnvironment } from '../types';
import { withAsyncAppActionErrorHandling } from '../helpers/error-handling';

interface AppActionCallParameters {}

export const handler = withAsyncAppActionErrorHandling(
  async (
    _payload: AppActionCallParameters,
    _context: AppActionCallContext
  ): Promise<AppActionCallResponse<PreviewEnvironment>> => {
    return {
      ok: true,
      data: {
        url: 'url',
      },
    };
  }
);
