import { AppActionCallContext } from '@contentful/node-apps-toolkit';
import { AppActionCallResponse, SignedUrlTokens } from '../types';
import { withAsyncAppActionErrorHandling } from '../helpers/error-handling';

interface AppActionCallParameters {}

export const handler = withAsyncAppActionErrorHandling(
  async (
    _payload: AppActionCallParameters,
    _context: AppActionCallContext
  ): Promise<AppActionCallResponse<SignedUrlTokens>> => {
    return {
      ok: true,
      data: {
        playbackToken: 'token',
        posterToken: 'token',
        storyboardToken: 'token',
      },
    };
  }
);
