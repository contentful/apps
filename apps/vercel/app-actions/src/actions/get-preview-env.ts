import { AppActionCallContext } from '@contentful/node-apps-toolkit';
import { AppActionCallResponse, ContentPreviewEnvironment } from '../types';
import { withAsyncAppActionErrorHandling } from '../helpers/error-handling';

interface AppActionCallParameters {
  contentTypeId?: string;
}

export const handler = withAsyncAppActionErrorHandling(
  async (
    parameters: AppActionCallParameters,
    _context: AppActionCallContext
  ): Promise<AppActionCallResponse<ContentPreviewEnvironment[]>> => {
    const { contentTypeId } = parameters;
    if (typeof contentTypeId !== 'string')
      throw new TypeError('invalid or missing contentTypeId in app action call parameters');
    const envId = 'vercel-app-preview-environment';
    return {
      ok: true,

      // TODO for now this value is intentionally hard coded
      data: [
        {
          sys: {
            id: envId,
            version: 1,
            type: 'PreviewEnvironment',
          },
          name: 'Vercel App',
          description: 'Content preview environment provided by Vercel app',
          configurations: [
            {
              contentType: contentTypeId,
              enabled: true,
              example: false,
              name: '',
              // hardcoded URL is for intentional testing purposes
              url: 'https://team-integrations-vercel-playground-{env_id}.vercel.app/api/enable-draft?slug={entry.fields.slug}&x-vercel-protection-bypass=ukkdTdqAgnG5DQHwFkIeQ22N1nUDWeU7&x-vercel-bypass-cookie=samesitenone',
              contentTypeFields: [],
            },
          ],
          envId,
        },
      ],
    };
  }
);
